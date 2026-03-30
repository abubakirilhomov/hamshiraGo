import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import AppModal from '@/components/AppModal';
import RatingModal from '@/components/RatingModal';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useRoutePolyline } from '@/hooks/useRoutePolyline';
import { useDispatchTimer } from '@/hooks/useDispatchTimer';
import type { OrderStatus } from '@/types/order';
import { styles } from './trackStyles';

// ─── Types (local only) ───────────────────────────────────────────────────────

type DispatchStatus = 'searching' | 'contacting' | 'no_medics';

const TrackMapComponent =
  Platform.OS === 'web'
    ? null
    : require('react-native-maps');

const AnimatedMedicMarker: React.ComponentType<any> | null = TrackMapComponent
  ? (TrackMapComponent.Marker.Animated ??
     Animated.createAnimatedComponent(TrackMapComponent.Marker as React.ComponentType<any>))
  : null;

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: { status: OrderStatus; labelKey: string; icon: string }[] = [
  { status: 'CREATED', labelKey: 'track.stepCreated', icon: 'file-text-o' },
  { status: 'ASSIGNED', labelKey: 'track.stepAssigned', icon: 'user' },
  { status: 'ACCEPTED', labelKey: 'track.stepAccepted', icon: 'check-circle-o' },
  { status: 'ON_THE_WAY', labelKey: 'track.stepOnTheWay', icon: 'car' },
  { status: 'ARRIVED', labelKey: 'track.stepArrived', icon: 'map-marker' },
  { status: 'SERVICE_STARTED', labelKey: 'track.stepServiceStarted', icon: 'heartbeat' },
  { status: 'DONE', labelKey: 'track.stepDone', icon: 'check-circle' },
];

const STATUS_INDEX: Partial<Record<OrderStatus, number>> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i]),
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [payStatus, setPayStatus] = useState<'idle' | 'paid'>('idle');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoritesChecked, setFavoritesChecked] = useState(false);
  const coursePromptShownRef = useRef(false);

  const {
    order,
    loading,
    wsConnected,
    dispatchState,
    medicLocation,
    ratingSubmitting,
    cancelOrder,
    submitRating,
  } = useOrderTracking(orderId);

  const { routeCoords, resetRoute } = useRoutePolyline(
    medicLocation,
    order?.location ?? null,
    order?.status,
  );

  const { elapsedSeconds } = useDispatchTimer(order?.status, order?.created_at);

  // Reset route when medic is newly assigned (so it refetches from new location)
  useEffect(() => {
    if (order?.status === 'ASSIGNED') {
      resetRoute();
    }
  }, [order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pulse animation (while dispatching) ─────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (order?.status !== 'CREATED' || !dispatchState) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [order?.status, dispatchState, pulseAnim]);

  // ── Smooth medic marker interpolation ────────────────────────────────────────
  const medicAnimCoordRef = useRef<any>(null);
  const [medicAnimReady, setMedicAnimReady] = useState(false);

  useEffect(() => {
    if (!medicLocation || !TrackMapComponent) return;
    if (!medicAnimCoordRef.current) {
      medicAnimCoordRef.current = new TrackMapComponent.AnimatedRegion({
        latitude: medicLocation.latitude,
        longitude: medicLocation.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      setMedicAnimReady(true);
    } else {
      const duration = medicLocation.source === 'socket' ? 900 : 0;
      medicAnimCoordRef.current.timing({
        latitude: medicLocation.latitude,
        longitude: medicLocation.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration,
        useNativeDriver: false,
      }).start();
    }
  }, [medicLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Force rating: block back navigation until rated ──────────────────────────
  const mustRate = order?.status === 'DONE' && order.clientRating === null && !!order.medic;

  useEffect(() => {
    if (!mustRate) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      Alert.alert(t('track.rateMedic'), t('track.rateBeforeBack'), [{ text: t('track.ok') }]);
    });
    return unsubscribe;
  }, [navigation, mustRate, t]);

  useEffect(() => {
    if (!mustRate) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(t('track.rateMedic'), t('track.rateBeforeBack'), [{ text: t('track.ok') }]);
      return true;
    });
    return () => sub.remove();
  }, [mustRate]);

  // ── Payment status check (when DONE) ─────────────────────────────────────────
  useEffect(() => {
    if (order?.status !== 'DONE' || !orderId || !token) return;
    apiFetch<{ status: string }>(`/payments/${orderId}/status`, { token })
      .then((p) => { if (p.status === 'paid') setPayStatus('paid'); })
      .catch(() => {});
  }, [order?.status, orderId, token]);

  // ── Check if medic is already favorited (when DONE) ──────────────────────────
  useEffect(() => {
    if (order?.status !== 'DONE' || !order.medic || !token || favoritesChecked) return;
    setFavoritesChecked(true);
    apiFetch<Array<{ medicId: string }>>('/favorites', { token })
      .then((list) => {
        const medicId = order.medic!.id;
        setIsFavorite(list.some((f) => f.medicId === medicId));
      })
      .catch(() => {});
  }, [order?.status, order?.medic, token, favoritesChecked]);

  // ── Course prompt (when DONE, once) ──────────────────────────────────────────
  useEffect(() => {
    if (order?.status !== 'DONE' || coursePromptShownRef.current) return;
    coursePromptShownRef.current = true;
    Alert.alert(
      t('courses.title'),
      t('courses.createPrompt'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('courses.create'), onPress: () => router.push('/courses') },
      ],
    );
  }, [order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pay handler ───────────────────────────────────────────────────────────────
  const handlePay = async () => {
    try {
      const { paymeUrl, clickUrl } = await apiFetch<{ paymeUrl: string; clickUrl: string }>(
        `/payments/${orderId}/initiate`, { method: 'POST', token: token ?? undefined },
      );
      Alert.alert(t('payment.choosePlatform'), '', [
        { text: 'Payme', onPress: () => WebBrowser.openBrowserAsync(paymeUrl) },
        { text: 'Click', onPress: () => WebBrowser.openBrowserAsync(clickUrl) },
        { text: t('payment.cancel'), style: 'cancel' },
      ]);
    } catch {
      Alert.alert(t('payment.errorFetch'));
    }
  };

  // ── Favorite toggle ────────────────────────────────────────────────────────
  const handleFavoriteToggle = async () => {
    if (!order?.medic || favoriteLoading || !token) return;
    const medicId = order.medic.id;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await apiFetch(`/favorites/${medicId}`, { method: 'DELETE', token });
        setIsFavorite(false);
      } else {
        await apiFetch(`/favorites/${medicId}`, { method: 'POST', token });
        setIsFavorite(true);
        Alert.alert(t('favorites.added'));
      }
    } catch {
      // silently ignore
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ── Cancel handlers ────────────────────────────────────────────────────────
  const confirmCancel = async () => {
    setCancelModal(false);
    try {
      await cancelOrder(cancelReason.trim() || undefined);
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : t('track.cancelFailed'));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('track.orderNotFound')}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/two')}>
          <Text style={styles.backBtnText}>{t('track.toOrders')}</Text>
        </Pressable>
      </View>
    );
  }

  const currentIdx = order.status === 'CANCELED' ? -1 : (STATUS_INDEX[order.status] ?? 0);
  const isDone = order.status === 'DONE';
  const isCanceled = order.status === 'CANCELED';
  const isActive = !isDone && !isCanceled;
  const urgentFee = order.isUrgent ? (order.urgentFee ?? 0) : 0;
  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
          {wsConnected && isActive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>
        {order.isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>🔴 {t('urgent.badge')}</Text>
          </View>
        )}
        <Text style={styles.priceText}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        {order.isUrgent && urgentFee > 0 && (
          <Text style={styles.urgentFeeText}>
            {t('urgent.fee')}: +{urgentFee.toLocaleString('ru-RU')} UZS
          </Text>
        )}
      </View>

      {/* Candidate medic banner (shown during dispatch contacting) */}
      {order.status === 'CREATED' && dispatchState?.status === 'contacting' && dispatchState.candidateName && (
        <View style={styles.candidateBanner}>
          <View style={styles.candidateAvatar}>
            {dispatchState.candidatePhoto
              ? <Image source={{ uri: dispatchState.candidatePhoto }} style={styles.candidateAvatarImg} />
              : <FontAwesome name="user-md" size={22} color={Theme.primary} />
            }
          </View>
          <View style={styles.candidateInfo}>
            <Text style={styles.candidateName}>{dispatchState.candidateName}</Text>
            <Text style={styles.candidateSubtitle}>{t('track.candidateReviewing')}</Text>
          </View>
          <ActivityIndicator size="small" color={Theme.primary} />
        </View>
      )}

      {/* Dispatch status banner */}
      {order.status === 'CREATED' && dispatchState && (
        <View style={[styles.dispatchBanner, dispatchState.status === 'no_medics' && styles.dispatchBannerWaiting]}>
          <ActivityIndicator size="small" color={dispatchState.status === 'no_medics' ? Theme.warning : Theme.primary} />
          <View style={styles.dispatchBannerText}>
            <FontAwesome
              name={dispatchState.status === 'no_medics' ? 'clock-o' : 'search'}
              size={13}
              color={dispatchState.status === 'no_medics' ? Theme.warning : Theme.primary}
            />
            <Text style={[styles.dispatchBannerLabel, dispatchState.status === 'no_medics' && { color: Theme.warning }]}>
              {getDispatchStatusText(t, dispatchState)}
            </Text>
          </View>
          <Text style={styles.dispatchTimer}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
      )}

      {/* Canceled banner */}
      {isCanceled && (
        <View style={styles.canceledBanner}>
          <FontAwesome name="times-circle" size={18} color={Theme.error} />
          <View style={{ flex: 1 }}>
            <Text style={styles.canceledText}>{t('track.orderCanceled')}</Text>
            {!!order.cancelReason && (
              <Text style={styles.canceledReason}>{order.cancelReason}</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress stepper */}
      {!isCanceled && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('track.orderStatus')}</Text>
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const future = idx > currentIdx;
            const lineColor = done ? Theme.primary : Theme.border;
            const circleColor = active ? Theme.primary : done ? Theme.primary : Theme.border;
            const labelColor = future ? Theme.textSecondary : Theme.text;
            return (
              <View key={step.status} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepCircle, { borderColor: circleColor, backgroundColor: (done || active) ? circleColor : 'transparent' }]}>
                    {done
                      ? <FontAwesome name="check" size={10} color="#fff" />
                      : <FontAwesome name={step.icon as keyof typeof FontAwesome.glyphMap} size={11} color={active ? '#fff' : Theme.border} />
                    }
                  </View>
                  {idx < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: lineColor }]} />}
                </View>
                <View style={styles.stepRight}>
                  <Text style={[styles.stepLabel, { color: labelColor, fontWeight: active ? '700' : '400' }]}>{t(step.labelKey)}</Text>
                  {active && <Text style={styles.stepActiveHint}>{getStepHint(t, step.status)}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Medic card */}
      {order.medic && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('track.yourMedic')}</Text>
          <View style={styles.medicRow}>
            <View style={styles.medicAvatar}>
              {order.medic.profilePhotoUrl
                ? <Image source={{ uri: order.medic.profilePhotoUrl }} style={styles.medicAvatarImg} />
                : <FontAwesome name="user-md" size={22} color={Theme.primary} />
              }
            </View>
            <View style={styles.medicInfo}>
              <Text style={styles.medicName}>{order.medic.name}</Text>
              {order.medic.rating != null && (
                <View style={styles.medicRatingRow}>
                  <FontAwesome name="star" size={13} color={Theme.primary} />
                  <Text style={styles.medicRatingText}>{Number(order.medic.rating).toFixed(1)}</Text>
                  {order.medic.reviewCount != null && order.medic.reviewCount > 0 && (
                    <Text style={styles.medicReviewCount}>
                      ({order.medic.reviewCount} {t('review.reviews')})
                    </Text>
                  )}
                  {order.medic.reviewCount === 0 && (
                    <Text style={styles.medicReviewCount}>{t('review.noReviews')}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Live map */}
      {order.location?.latitude != null && order.location?.longitude != null && TrackMapComponent && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{order.status === 'CREATED' ? t('track.searchingMedic') : t('track.medicOnMap')}</Text>
          <View style={styles.mapWrap}>
            <TrackMapComponent.default
              style={styles.map}
              initialRegion={{
                latitude: medicLocation ? (Number(order.location.latitude) + medicLocation.latitude) / 2 : Number(order.location.latitude),
                longitude: medicLocation ? (Number(order.location.longitude) + medicLocation.longitude) / 2 : Number(order.location.longitude),
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
            >
              <TrackMapComponent.Marker
                coordinate={{ latitude: Number(order.location.latitude), longitude: Number(order.location.longitude) }}
                title={t('track.youAreHere')}
                description={t('track.callAddress')}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.clientMarkerWrap}>
                  {order.status === 'CREATED' && dispatchState && (
                    <Animated.View style={[styles.pulseRing, {
                      opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                      transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                    }]} />
                  )}
                  <View style={styles.clientMarkerDot}>
                    <Text style={styles.markerEmoji}>🏠</Text>
                  </View>
                </View>
              </TrackMapComponent.Marker>

              {medicLocation && medicAnimReady && medicAnimCoordRef.current && AnimatedMedicMarker && (
                <AnimatedMedicMarker
                  coordinate={medicAnimCoordRef.current}
                  title={order.status === 'CREATED' && dispatchState?.candidateName ? dispatchState.candidateName : t('track.medic')}
                  description={order.status === 'CREATED' ? t('track.waitingConfirmation') : t('track.currentPosition')}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.medicMarkerDot, order.status === 'CREATED' && { backgroundColor: '#f59e0b' }]}>
                    {order.medic?.profilePhotoUrl
                      ? <Image source={{ uri: order.medic.profilePhotoUrl }} style={styles.medicMarkerImg} />
                      : <Text style={styles.markerEmoji}>🧑‍⚕️</Text>
                    }
                  </View>
                </AnimatedMedicMarker>
              )}

              {medicLocation && (
                <TrackMapComponent.Polyline
                  coordinates={routeCoords.length > 1 ? routeCoords : [
                    { latitude: Number(order.location.latitude), longitude: Number(order.location.longitude) },
                    { latitude: medicLocation.latitude, longitude: medicLocation.longitude },
                  ]}
                  strokeColor={order.status === 'CREATED' ? '#f59e0b' : '#16a34a'}
                  strokeWidth={3}
                  lineDashPattern={order.status === 'CREATED' ? [6, 4] : undefined}
                />
              )}
            </TrackMapComponent.default>
          </View>

          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendText}>{t('track.you')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: order.status === 'CREATED' ? '#f59e0b' : '#16a34a' }]} />
              <Text style={styles.legendText}>{order.status === 'CREATED' ? t('track.candidate') : t('track.medic')}</Text>
            </View>
            {medicLocation && (
              <Text style={styles.mapMeta}>{new Date(medicLocation.updatedAt).toLocaleTimeString('ru-RU')}</Text>
            )}
          </View>
        </View>
      )}

      {/* Address */}
      {order.location && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('track.address')}</Text>
          <View style={styles.addressRow}>
            <FontAwesome name="map-marker" size={14} color={Theme.textSecondary} />
            <Text style={styles.addressText} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
              {order.location.house}
              {order.location.floor ? `, ${t('confirm.floor')} ${order.location.floor}` : ''}
              {order.location.apartment ? `, ${t('confirm.apt')} ${order.location.apartment}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Rating block */}
      <RatingModal
        visible={isDone && order.clientRating === null && !!order.medic}
        submitting={ratingSubmitting}
        onSubmit={submitRating}
      />

      {/* Rating already submitted */}
      {isDone && order.clientRating !== null && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('track.yourRating')}</Text>
          <View style={styles.ratingDoneRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name={star <= order.clientRating! ? 'star' : 'star-o'}
                size={28}
                color={star <= order.clientRating! ? Theme.primary : Theme.border}
              />
            ))}
          </View>
          {!!order.clientReview && (
            <Text style={styles.clientReviewText}>"{order.clientReview}"</Text>
          )}
        </View>
      )}

      {/* Buttons */}
      {isActive && (order.status === 'CREATED' || order.status === 'ASSIGNED') && (
        <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]} onPress={() => setCancelModal(true)}>
          <Text style={styles.cancelBtnText}>{t('track.cancelOrder')}</Text>
        </Pressable>
      )}

      {isDone && !mustRate && !!order.medic && (
        <Pressable
          style={({ pressed }) => [styles.favoriteBtn, isFavorite && styles.favoriteBtnActive, pressed && { opacity: 0.75 }]}
          onPress={handleFavoriteToggle}
          disabled={favoriteLoading}
        >
          <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={16} color={isFavorite ? Theme.error : Theme.primary} />
          <Text style={[styles.favoriteBtnText, isFavorite && { color: Theme.error }]}>
            {isFavorite ? t('favorites.remove') : t('favorites.add')}
          </Text>
        </Pressable>
      )}

      {isDone && !mustRate && (
        payStatus === 'paid'
          ? <Text style={styles.payPaid}>{t('payment.paid')}</Text>
          : <Pressable style={styles.payBtn} onPress={handlePay}>
              <Text style={styles.payBtnText}>{t('payment.pay')}</Text>
            </Pressable>
      )}

      {(isDone || isCanceled) && !mustRate && (
        <Pressable style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]} onPress={() => router.replace('/(tabs)/two')}>
          <Text style={styles.doneBtnText}>{t('track.toMyOrders')}</Text>
        </Pressable>
      )}
    </ScrollView>

    <AppModal
      visible={cancelModal}
      title={t('track.cancelTitle')}
      message={t('track.cancelMessage')}
      buttons={[
        { text: t('track.cancelNo'), style: 'cancel', onPress: () => { setCancelModal(false); setCancelReason(''); } },
        { text: t('track.cancelYes'), style: 'destructive', onPress: confirmCancel },
      ]}
      onClose={() => { setCancelModal(false); setCancelReason(''); }}
    >
      <TextInput
        placeholder={t('track.cancelReasonPlaceholder')}
        placeholderTextColor={Theme.textSecondary}
        value={cancelReason}
        onChangeText={setCancelReason}
        style={{ fontSize: 14, color: Theme.text, paddingVertical: 8, borderWidth: 1, borderColor: Theme.border, borderRadius: 10, paddingHorizontal: 12, marginTop: 4 }}
        maxLength={200}
      />
    </AppModal>

    <AppModal
      visible={cancelError !== null}
      title={t('common.error')}
      message={cancelError ?? ''}
      buttons={[{ text: 'OK', style: 'default', onPress: () => setCancelError(null) }]}
      onClose={() => setCancelError(null)}
    />
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

function getDispatchStatusText(t: (key: string, opts?: Record<string, string>) => string, dispatchState: { status: DispatchStatus; candidateName?: string } | null): string | null {
  if (!dispatchState) return null;
  switch (dispatchState.status) {
    case 'searching': return t('track.dispatchSearching');
    case 'contacting': return dispatchState.candidateName ? t('track.dispatchContacting', { name: dispatchState.candidateName }) : t('track.dispatchContactingGeneric');
    case 'no_medics': return t('track.dispatchNoMedics');
    default: return null;
  }
}

function getStepHint(t: (key: string) => string, status: OrderStatus): string {
  switch (status) {
    case 'CREATED': return t('track.hintCreated');
    case 'ASSIGNED': return t('track.hintAssigned');
    case 'ACCEPTED': return t('track.hintAccepted');
    case 'ON_THE_WAY': return t('track.hintOnTheWay');
    case 'ARRIVED': return t('track.hintArrived');
    case 'SERVICE_STARTED': return t('track.hintServiceStarted');
    case 'DONE': return t('track.hintDone');
    default: return '';
  }
}

import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import AppModal from '@/components/AppModal';
import RatingModal from '@/components/RatingModal';
import ProgressStepper from '@/components/order/ProgressStepper';
import MedicInfoCard from '@/components/order/MedicInfoCard';
import TrackMap from '@/components/order/TrackMap';
import TrackActions from '@/components/order/TrackActions';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Shadow, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useRoutePolyline } from '@/hooks/useRoutePolyline';
import { useDispatchTimer } from '@/hooks/useDispatchTimer';
import type { OrderStatus } from '@/types/order';
import { trackEvent } from '@/utils/analytics';
import { styles } from './trackStyles';

// ---- Types (local only) ----

type DispatchStatus = 'searching' | 'contacting' | 'no_medics';

const TrackMapComponent =
  Platform.OS === 'web'
    ? null
    : require('react-native-maps');

// ---- Screen ----

export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [payStatus, setPayStatus] = useState<'idle' | 'paid'>('idle');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoritesChecked, setFavoritesChecked] = useState(false);

  const {
    order,
    loading,
    wsConnected,
    dispatchState,
    medicLocation,
    etaMinutes,
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

  // -- Pulse animation (while dispatching) --
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

  // -- Smooth medic marker interpolation --
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

  // -- Rating: suggest but don't block navigation --
  const mustRate = order?.status === 'DONE' && order.clientRating === null && !!order.medic;
  const ratingPromptShown = useRef(false);

  useEffect(() => {
    if (!mustRate || ratingPromptShown.current) return;
    ratingPromptShown.current = true;
    // Show a non-blocking prompt once
    Alert.alert(
      t('track.rateMedic'),
      t('track.rateBeforeBack'),
      [{ text: t('track.ok') }],
    );
  }, [mustRate, t]);

  // -- Payment status check (when DONE) --
  useEffect(() => {
    if (order?.status !== 'DONE' || !orderId || !token) return;
    apiFetch<{ status: string }>(`/payments/${orderId}/status`, { token })
      .then((p) => { if (p.status === 'paid') setPayStatus('paid'); })
      .catch(() => {});
  }, [order?.status, orderId, token]);

  // -- Check if medic is already favorited (when DONE) --
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

  // -- Analytics: track order completion --
  useEffect(() => {
    if (order?.status === 'DONE' && orderId) {
      trackEvent('order_completed', { orderId }).catch(() => {});
    }
  }, [order?.status, orderId]);

  // Course prompt removed — was auto-showing modal on DONE, blocking UI.
  // User can create a course from Profile → Courses instead.

  // -- Pay handler --
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
      showToast(t('payment.errorFetch'), 'error');
    }
  };

  // -- Favorite toggle --
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
        showToast(t('favorites.added'), 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // -- Cancel handlers --
  const confirmCancel = async () => {
    setCancelModal(false);
    try {
      await cancelOrder(cancelReason.trim() || undefined);
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : t('track.cancelFailed'));
    }
  };

  // -----------------------------------------------------------------------
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

  const isDone = order.status === 'DONE';
  const isCanceled = order.status === 'CANCELED';
  const isActive = !isDone && !isCanceled;
  const urgentFee = order.isUrgent ? (order.urgentFee ?? 0) : 0;
  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);

  return (
    <>
    <View style={{ flex: 1, backgroundColor: Theme.background }}>
      {/* Floating header with safe area */}
      <View style={[trackLocalStyles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={trackLocalStyles.topBackBtn}
          onPress={() => {
            if (mustRate) {
              Alert.alert(t('track.rateMedic'), t('track.rateBeforeBack'), [{ text: t('track.ok') }]);
            } else {
              router.back();
            }
          }}
          hitSlop={12}
        >
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>

        {/* Status pill */}
        {isActive && (
          <View style={trackLocalStyles.statusPill}>
            <View style={[trackLocalStyles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={trackLocalStyles.statusPillText}>
              {getStatusLabel(t, order.status)}
            </Text>
          </View>
        )}

        {wsConnected && isActive && (
          <View style={trackLocalStyles.livePill}>
            <View style={trackLocalStyles.liveDotSmall} />
            <Text style={trackLocalStyles.liveTextSmall}>Live</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: 0, paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >

      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
        </View>
        {order.isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>{t('urgent.badge')}</Text>
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
              ? <Image source={{ uri: dispatchState.candidatePhoto }} style={styles.candidateAvatarImg} placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }} contentFit="cover" transition={200} />
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
        <ProgressStepper currentStatus={order.status} />
      )}

      {/* Medic card */}
      {order.medic && (
        <MedicInfoCard medic={order.medic} />
      )}

      {/* ETA display */}
      {etaMinutes != null && (order.status === 'ON_THE_WAY' || order.status === 'ACCEPTED') && (
        <View style={trackLocalStyles.etaBanner}>
          <FontAwesome name="clock-o" size={16} color={Theme.primary} />
          <Text style={trackLocalStyles.etaText}>
            ~{etaMinutes} daqiqa
          </Text>
        </View>
      )}

      {/* Live map */}
      {order.location && (
        <TrackMap
          orderStatus={order.status}
          orderLocation={order.location}
          medicLocation={medicLocation}
          medicInfo={order.medic ?? null}
          routeCoords={routeCoords}
          dispatchState={dispatchState}
          pulseAnim={pulseAnim}
          medicAnimCoord={medicAnimCoordRef.current}
          medicAnimReady={medicAnimReady}
        />
      )}

      {/* Address */}
      {order.location && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('track.address')}</Text>
          <View style={styles.addressRow}>
            <FontAwesome name="map-pin" size={14} color={Theme.primary} />
            <Text style={styles.addressText}>
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

      {/* Loyalty points earned */}
      {isDone && (
        <View style={styles.card}>
          <Text style={{
            fontSize: 15,
            fontFamily: Fonts.manropeSb,
            fontWeight: '600',
            color: Theme.primary,
            textAlign: 'center',
          }}>
            {t('loyalty.pointsEarned', { points: '10' })}
          </Text>
        </View>
      )}

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
                color={star <= order.clientRating! ? Theme.primary : Theme.surfaceContainerHigh}
              />
            ))}
          </View>
          {!!order.clientReview && (
            <Text style={styles.clientReviewText}>"{order.clientReview}"</Text>
          )}
        </View>
      )}

      {/* Action buttons row */}
      {isActive && order.medic && (
        <View style={trackLocalStyles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              trackLocalStyles.actionBtnSecondary,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push({ pathname: '/order/chat', params: { orderId: order.id } })}
          >
            <FontAwesome name="comments" size={16} color={Theme.primary} />
            <Text style={trackLocalStyles.actionBtnSecondaryText}>{t('track.contact', { defaultValue: 'Aloqa' })}</Text>
          </Pressable>
        </View>
      )}

      {/* TrackActions (pay, favorite, done) */}
      <TrackActions
        orderStatus={order.status}
        mustRate={mustRate}
        payStatus={payStatus}
        isFavorite={isFavorite}
        favoriteLoading={favoriteLoading}
        hasMedic={!!order.medic}
        onCancel={() => setCancelModal(true)}
        onFavoriteToggle={handleFavoriteToggle}
        onPay={handlePay}
        onGoToOrders={() => router.replace('/(tabs)/two')}
      />
    </ScrollView>
    </View>

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
        placeholderTextColor={Theme.textTertiary}
        value={cancelReason}
        onChangeText={setCancelReason}
        style={trackLocalStyles.cancelReasonInput}
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

// ---- Helpers ----

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    CREATED: Theme.statusCreated,
    ASSIGNED: Theme.statusAssigned,
    ACCEPTED: Theme.statusAccepted,
    ON_THE_WAY: Theme.statusOnTheWay,
    ARRIVED: Theme.statusArrived,
    SERVICE_STARTED: Theme.statusStarted,
    DONE: Theme.statusDone,
    CANCELED: Theme.statusCanceled,
  };
  return map[status] ?? Theme.textSecondary;
}

function getStatusLabel(t: (key: string, opts?: any) => string, status: string): string {
  const map: Record<string, string> = {
    CREATED: 'Yaratildi',
    ASSIGNED: 'Tayinlandi',
    ACCEPTED: 'Qabul qilindi',
    ON_THE_WAY: "Yo'lda",
    ARRIVED: 'Yetib keldi',
    SERVICE_STARTED: 'Xizmat boshlandi',
    DONE: 'Bajarildi',
    CANCELED: 'Bekor qilindi',
  };
  return map[status] ?? status;
}

// Local styles for track-specific UI not in trackStyles.ts
import { StyleSheet } from 'react-native';

const trackLocalStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Theme.surface,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  topBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surface,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 14,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Theme.success}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.success,
  },
  liveTextSmall: {
    fontSize: 11,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.success,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  chatBtnText: {
    color: Theme.primary,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  actionBtnSecondaryText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.primary,
  },
  actionBtnError: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  actionBtnErrorText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.error,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Theme.primary}12`,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  etaText: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    fontWeight: '500',
    color: Theme.primary,
  },
  cancelReasonInput: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
});

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch, API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MAP_ACTIVE_STATUSES } from '@/types/order';
import { useOrderStatus, NEXT_STATUS_MAP } from '@/hooks/useOrderStatus';
import { useMedicLocation } from '@/hooks/useMedicLocation';
import { useMedicRoute } from '@/hooks/useMedicRoute';
import { useSharedSocket } from '@/context/SocketContext';
import ClientRatingModal from '@/components/ClientRatingModal';
import { trackEvent } from '@/utils/analytics';
import { StatusActions } from '@/components/order/StatusActions';
import { EarningsCard } from '@/components/order/EarningsCard';
import { ClientInfo } from '@/components/order/ClientInfo';
import { OrderDetailMap } from '@/components/order/OrderDetailMap';

interface MedCardData {
  bloodType?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  notes?: string | null;
}

/* ── Status stepper config ──────────────────────────────────────────── */
const STATUS_STEPS = [
  'CREATED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'DONE',
] as const;

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Yaratildi',
  ASSIGNED: 'Tayinlandi',
  ACCEPTED: 'Qabul qilindi',
  ON_THE_WAY: 'Yo\'lda',
  ARRIVED: 'Yetib keldi',
  SERVICE_STARTED: 'Xizmat boshlandi',
  DONE: 'Bajarildi',
  CANCELED: 'Bekor qilindi',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [updating, setUpdating] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [medicPos, setMedicPos] = useState<{ latitude: number; longitude: number; heading: number | null } | null>(null);
  const [lastLocationSentAt, setLastLocationSentAt] = useState<string | null>(null);
  const [sentLocationCount, setSentLocationCount] = useState(0);
  const [medCardVisible, setMedCardVisible] = useState(false);
  const [medCardData, setMedCardData] = useState<MedCardData | null>(null);
  const [medCardLoading, setMedCardLoading] = useState(false);
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState<'before' | 'after' | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { order, loading, wsConnected, updateOrderStatus, doneEarnings } =
    useOrderStatus(id);
  const { socket } = useSharedSocket();

  const { routeCoords, routeLoading, fetchRoute, resetRoute } = useMedicRoute();

  const incrementSentCount = useCallback(() => setSentLocationCount((prev) => prev + 1), []);

  const { startTracking, stopTracking } = useMedicLocation({
    orderId: id,
    socket,
    onLocationUpdate: setMedicPos,
    onLastSentAt: setLastLocationSentAt,
    onSentCountIncrement: incrementSentCount,
  });

  // ── Location tracking: ACCEPTED and ON_THE_WAY ───────────────────────────
  useEffect(() => {
    if (order?.status === 'ON_THE_WAY' || order?.status === 'ACCEPTED') {
      startTracking();
    }
    return stopTracking;
  }, [order?.status, startTracking, stopTracking]);

  // ── Get initial medic position for map display ────────────────────────────
  useEffect(() => {
    if (!order || !MAP_ACTIVE_STATUSES.includes(order.status)) return;
    Location.getForegroundPermissionsAsync().then((perm) => {
      if (perm.status !== 'granted') return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((loc) => {
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, heading: null };
          setMedicPos(pos);
        })
        .catch(() => {});
    });
  }, [order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch OSRM route whenever medicPos changes ─────────────────────────────
  useEffect(() => {
    fetchRoute(medicPos, order?.location ?? null);
  }, [medicPos, order?.location, fetchRoute]);

  // ── Reset route when leaving active map statuses ───────────────────────────
  useEffect(() => {
    if (order && !MAP_ACTIVE_STATUSES.includes(order.status)) {
      resetRoute();
    }
  }, [order?.status, resetRoute]);

  // ── Load existing photos from order ─────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    if ((order as any).beforePhotoUrl) setBeforePhotoUrl((order as any).beforePhotoUrl);
    if ((order as any).afterPhotoUrl) setAfterPhotoUrl((order as any).afterPhotoUrl);
  }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTakePhoto = useCallback(async (type: 'before' | 'after') => {
    if (!id || !token) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast(t('common.cameraPermission', { defaultValue: 'Kameraga ruxsat kerak' }), 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setPhotoUploading(type);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: result.assets[0].uri,
        name: `${type}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('type', type);

      const res = await fetch(`${API_BASE}/orders/${id}/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (type === 'before') {
        setBeforePhotoUrl(data.beforePhotoUrl ?? result.assets[0].uri);
      } else {
        setAfterPhotoUrl(data.afterPhotoUrl ?? result.assets[0].uri);
      }
      showToast(t('common.photoUploaded', { defaultValue: 'Rasm yuklandi' }), 'success');
    } catch {
      showToast(t('common.photoUploadError', { defaultValue: 'Rasm yuklashda xatolik' }), 'error');
    } finally {
      setPhotoUploading(null);
    }
  }, [id, token, t, showToast]);

  const handleNextStatus = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOrderStatus((v) => setUpdating(v));
  }, [updateOrderStatus]);

  const handleOpenMedCard = useCallback(async () => {
    if (!order?.clientId) return;
    setMedCardLoading(true);
    try {
      const data = await apiFetch<MedCardData>(
        `/medical-card/client/${order.clientId}`,
        { token: token ?? undefined },
      );
      setMedCardData(data);
      setMedCardVisible(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('403')) {
        showToast(t('medcard.noAccess'), 'warning');
      } else if (msg.includes('404')) {
        showToast(t('medcard.noCard'), 'info');
      } else {
        showToast(msg || t('common.error'), 'error');
      }
    } finally {
      setMedCardLoading(false);
    }
  }, [order?.clientId, token, t]);

  // ── Show rating modal when order completes ─────────────────────────────────
  useEffect(() => {
    if (doneEarnings) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('order_completed', { orderId: id }).catch(() => {});
      setShowRating(true);
    }
  }, [doneEarnings]); // eslint-disable-line react-hooks/exhaustive-deps

  const showEarningsAndNavigate = useCallback(() => {
    setShowRating(false);
    if (doneEarnings) {
      Alert.alert(
        `${t('orders.completeOrder')}`,
        `${t('orders.netEarnings')}:\n+${doneEarnings.earned.toLocaleString('ru-RU')} ${t('common.sum')}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/my-orders') }],
      );
    } else {
      router.replace('/(tabs)/my-orders');
    }
  }, [doneEarnings, t, router]);

  const handleRateClient = useCallback(async (stars: number, comment?: string) => {
    if (!order) return;
    setRatingSubmitting(true);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          orderId: order.id,
          rating: stars,
          comment,
          targetRole: 'client',
        }),
      });
    } catch {
      // Ignore review error -- don't block navigation
    }
    setRatingSubmitting(false);
    showEarningsAndNavigate();
  }, [order, token, showEarningsAndNavigate]);

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const nextStep = NEXT_STATUS_MAP[order.status];
  const urgentFee = order.isUrgent ? (order.urgentFee ?? 0) : 0;
  const netPrice = order.priceAmount + urgentFee - (order.discountAmount ?? 0);
  const platformFee = order.platformFee ?? Math.round(netPrice * 0.1);
  const medicEarnings = netPrice - platformFee;
  const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const clientLat =
    order.location?.latitude != null ? Number(order.location.latitude) : null;
  const clientLng =
    order.location?.longitude != null ? Number(order.location.longitude) : null;
  const showMap =
    clientLat != null &&
    clientLng != null &&
    MAP_ACTIVE_STATUSES.includes(order.status);

  const currentStepIdx = STATUS_STEPS.indexOf(order.status as any);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Custom header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Buyurtma</Text>
          <Text style={styles.headerOrderId}>#{(order.id ?? '').slice(0, 8)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent badge */}
        {order.isUrgent && (
          <View style={styles.urgentBadge}>
            <FontAwesome name="exclamation-circle" size={14} color={Theme.error} />
            <Text style={styles.urgentBadgeText}>{t('urgent.badge')}</Text>
          </View>
        )}

        {/* ── Service card ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <View style={styles.serviceIconWrap}>
              <FontAwesome name="medkit" size={20} color={Theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
              <Text style={styles.serviceDate}>{date}</Text>
            </View>
            <Text style={styles.servicePrice}>
              {order.priceAmount.toLocaleString('ru-RU')} UZS
            </Text>
          </View>
        </View>

        {/* ── Status stepper ────────────────────────────────────────── */}
        {order.status !== 'CANCELED' && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('orders.status', { defaultValue: 'Holat' })}</Text>
            <View style={styles.stepper}>
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <View key={step} style={styles.stepItem}>
                    <View style={styles.stepDotRow}>
                      <View style={[
                        styles.stepDot,
                        isDone && styles.stepDotDone,
                        isCurrent && styles.stepDotCurrent,
                      ]} />
                      {i < STATUS_STEPS.length - 1 && (
                        <View style={[
                          styles.stepLine,
                          i < currentStepIdx && styles.stepLineDone,
                        ]} />
                      )}
                    </View>
                    {isCurrent && (
                      <Text style={styles.stepLabel}>
                        {STATUS_LABELS[step] ?? step}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Chat button */}
        {!['DONE', 'CANCELED', 'CREATED'].includes(order.status) && (
          <Pressable
            style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/order/chat', params: { orderId: order.id } })}
          >
            <FontAwesome name="comments" size={18} color={Theme.primary} />
            <Text style={styles.chatBtnText}>
              {t('chat.openChat')}
            </Text>
          </Pressable>
        )}

        {/* Status + action buttons */}
        <StatusActions
          status={order.status}
          nextStep={nextStep}
          updating={updating}
          wsConnected={wsConnected}
          lastLocationSentAt={lastLocationSentAt}
          sentLocationCount={sentLocationCount}
          onNextStatus={handleNextStatus}
          t={t}
        />

        {/* Service info + earnings: show full breakdown only after DONE */}
        {order.status === 'DONE' ? (
          <EarningsCard
            serviceTitle={order.serviceTitle}
            date={date}
            priceAmount={order.priceAmount}
            isUrgent={!!order.isUrgent}
            urgentFee={urgentFee}
            discountAmount={order.discountAmount}
            platformFee={doneEarnings ? (order.priceAmount + urgentFee - (order.discountAmount ?? 0) - doneEarnings.earned) : platformFee}
            medicEarnings={doneEarnings ? doneEarnings.earned : medicEarnings}
            t={t}
          />
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('orders.service')}</Text>
            <Text style={styles.serviceTitleLarge}>{order.serviceTitle}</Text>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('orders.createdAt')}</Text>
              <Text style={styles.rowValue}>{date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('orders.serviceCost')}</Text>
              <Text style={styles.rowValue}>{order.priceAmount.toLocaleString('ru-RU')} UZS</Text>
            </View>
            {order.status !== 'CANCELED' && (
              <View style={[styles.row, { paddingTop: Spacing.md, marginTop: Spacing.xs }]}>
                <Text style={styles.earningsHint}>
                  {t('orders.earningsAfterDone')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Client info */}
        {order.location && (
          <ClientInfo
            location={order.location}
            status={order.status}
            clientId={order.clientId}
            medCardLoading={medCardLoading}
            onViewMedCard={handleOpenMedCard}
            t={t}
          />
        )}

        {/* Embedded map: medic -> client */}
        {showMap && clientLat != null && clientLng != null && (
          <OrderDetailMap
            clientLat={clientLat}
            clientLng={clientLng}
            medicPos={medicPos}
            routeCoords={routeCoords}
            routeLoading={routeLoading}
            clientLabel={t('orders.client')}
            youLabel={t('orders.you')}
            waitingGpsLabel={t('orders.waitingGps')}
            buildingRouteLabel={t('orders.buildingRoute')}
            routeTitle={t('orders.routeToClient')}
          />
        )}

        {/* ── Before/After photos ─────────────────────────────────── */}
        {['ARRIVED', 'SERVICE_STARTED', 'DONE'].includes(order.status) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('orders.photos', { defaultValue: 'Rasmlar' })}</Text>
            <View style={styles.photosRow}>
              {/* Before photo */}
              <Pressable
                style={({ pressed }) => [styles.photoCard, pressed && { opacity: 0.85 }]}
                onPress={() => !beforePhotoUrl && handleTakePhoto('before')}
                disabled={!!beforePhotoUrl || photoUploading === 'before'}
              >
                {photoUploading === 'before' ? (
                  <ActivityIndicator size="small" color={Theme.primary} />
                ) : beforePhotoUrl ? (
                  <Image source={{ uri: beforePhotoUrl }} style={styles.photoImage} />
                ) : (
                  <>
                    <FontAwesome name="camera" size={24} color={Theme.textTertiary} />
                    <Text style={styles.photoLabel}>
                      {t('orders.photoBefore', { defaultValue: 'Oldin' })}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* After photo */}
              <Pressable
                style={({ pressed }) => [styles.photoCard, pressed && { opacity: 0.85 }]}
                onPress={() => !afterPhotoUrl && handleTakePhoto('after')}
                disabled={!!afterPhotoUrl || photoUploading === 'after'}
              >
                {photoUploading === 'after' ? (
                  <ActivityIndicator size="small" color={Theme.primary} />
                ) : afterPhotoUrl ? (
                  <Image source={{ uri: afterPhotoUrl }} style={styles.photoImage} />
                ) : (
                  <>
                    <FontAwesome name="camera" size={24} color={Theme.textTertiary} />
                    <Text style={styles.photoLabel}>
                      {t('orders.photoAfter', { defaultValue: 'Keyin' })}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Client rating display (after DONE) */}
        {order.status === 'DONE' && order.clientRating != null && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('orders.clientRating')}</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: order.clientReview ? 8 : 0 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome
                  key={star}
                  name={star <= (order.clientRating ?? 0) ? 'star' : 'star-o'}
                  size={20}
                  color="#f59e0b"
                />
              ))}
            </View>
            {order.clientReview ? (
              <Text style={styles.reviewQuote}>
                "{order.clientReview}"
              </Text>
            ) : null}
          </View>
        )}

        {order.status === 'CANCELED' && order.cancelReason ? (
          <View style={[styles.card, { backgroundColor: Theme.errorContainer }]}>
            <Text style={styles.sectionLabel}>{t('orders.cancelReason')}</Text>
            <Text style={{ ...Typography.bodySmall, color: Theme.error }}>{order.cancelReason}</Text>
          </View>
        ) : null}

        {/* Client rating modal after DONE */}
        <ClientRatingModal
          visible={showRating}
          submitting={ratingSubmitting}
          onSubmit={handleRateClient}
          onSkip={showEarningsAndNavigate}
        />

        {/* Medical card modal */}
        <Modal
          visible={medCardVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMedCardVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <FontAwesome name="heartbeat" size={18} color={Theme.primary} />
                </View>
                <Text style={styles.modalTitle}>{t('medcard.clientCard')}</Text>
              </View>
              <View style={styles.divider} />
              {medCardData && (
                <>
                  <MedCardRow label={t('medcard.bloodType')} value={medCardData.bloodType} />
                  <MedCardRow label={t('medcard.allergies')} value={medCardData.allergies} />
                  <MedCardRow label={t('medcard.chronicDiseases')} value={medCardData.chronicDiseases} />
                  <MedCardRow label={t('medcard.notes')} value={medCardData.notes} />
                </>
              )}
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                onPress={() => setMedCardVisible(false)}
              >
                <LinearGradient
                  colors={Theme.primaryGradient as unknown as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

function MedCardRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.medCardRow}>
      <Text style={styles.medCardLabel}>{label}</Text>
      <Text style={styles.medCardValue}>{value || '\u2014'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },

  /* ── Header ────────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Theme.text,
  },
  headerOrderId: {
    ...Typography.caption,
    color: Theme.textTertiary,
    marginTop: 2,
  },

  /* ── Urgent badge ──────────────────────────────────────────────── */
  urgentBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  urgentBadgeText: {
    ...Typography.caption,
    fontFamily: Fonts.interSb,
    color: Theme.error,
  },

  /* ── Card ───────────────────────────────────────────────────────── */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  /* ── Service card ──────────────────────────────────────────────── */
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    ...Typography.h4,
    color: Theme.text,
  },
  serviceDate: {
    ...Typography.caption,
    color: Theme.textTertiary,
    marginTop: 2,
  },
  servicePrice: {
    ...Typography.numeric,
    color: Theme.primary,
  },

  /* ── Status stepper ────────────────────────────────────────────── */
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.surfaceContainerHigh,
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: Theme.primary,
  },
  stepDotCurrent: {
    backgroundColor: Theme.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Theme.primaryLight,
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Theme.surfaceContainerHigh,
  },
  stepLineDone: {
    backgroundColor: Theme.primary,
  },
  stepLabel: {
    ...Typography.caption,
    color: Theme.primary,
    marginTop: 6,
    textAlign: 'center',
  },

  /* ── Chat button ───────────────────────────────────────────────── */
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.primaryLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  chatBtnText: {
    ...Typography.button,
    color: Theme.primary,
  },

  /* ── Service detail ────────────────────────────────────────────── */
  serviceTitleLarge: {
    ...Typography.h3,
    color: Theme.text,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.surfaceContainerLow,
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowLabel: {
    ...Typography.bodySmall,
    color: Theme.textSecondary,
  },
  rowValue: {
    ...Typography.bodySmall,
    fontFamily: Fonts.interSb,
    color: Theme.text,
  },
  earningsHint: {
    ...Typography.caption,
    color: Theme.textTertiary,
    fontStyle: 'italic',
  },

  /* ── Photos ────────────────────────────────────────────────────── */
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoCard: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
  },
  photoLabel: {
    ...Typography.caption,
    color: Theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },

  /* ── Review quote ──────────────────────────────────────────────── */
  reviewQuote: {
    ...Typography.bodySmall,
    color: Theme.text,
    fontStyle: 'italic',
  },

  /* ── Modal ─────────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    ...Shadow.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.h4,
    color: Theme.text,
  },
  medCardRow: {
    marginBottom: Spacing.md,
  },
  medCardLabel: {
    ...Typography.caption,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  medCardValue: {
    ...Typography.body,
    color: Theme.text,
  },
  modalCloseBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  modalCloseBtnText: {
    ...Typography.button,
    color: Theme.textInverse,
  },
});

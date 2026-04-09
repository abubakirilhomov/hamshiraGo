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
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
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
        `${t('orders.completeOrder')} ✓`,
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
      // Ignore review error — don't block navigation
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Urgent badge */}
      {order.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>🔴 {t('urgent.badge')}</Text>
        </View>
      )}

      {/* Chat button */}
      {!['DONE', 'CANCELED', 'CREATED'].includes(order.status) && (
        <Pressable
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: '#fff', borderWidth: 1, borderColor: Theme.primary, borderRadius: 12,
              paddingVertical: 12, marginHorizontal: 16, marginBottom: 12 },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push({ pathname: '/order/chat', params: { orderId: order.id } })}
        >
          <FontAwesome name="comments" size={18} color={Theme.primary} />
          <Text style={{ color: Theme.primary, fontWeight: '600', fontSize: 15 }}>
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
          <Text style={styles.cardTitle}>{t('orders.service')}</Text>
          <Text style={{ fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text }}>{order.serviceTitle}</Text>
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
            <View style={[styles.row, { paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Theme.border, marginTop: Spacing.xs }]}>
              <Text style={{ fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.textSecondary, fontStyle: 'italic' }}>
                {t('orders.earningsAfterDone')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Client address */}
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

      {/* Before/After photos */}
      {['ARRIVED', 'SERVICE_STARTED', 'DONE'].includes(order.status) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('orders.photos', { defaultValue: 'Rasmlar' })}</Text>
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
                    {t('orders.photoBefore', { defaultValue: 'Rasm olish (oldin)' })}
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
                    {t('orders.photoAfter', { defaultValue: 'Rasm olish (keyin)' })}
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
          <Text style={styles.cardTitle}>{t('orders.clientRating')}</Text>
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
            <Text style={{ fontSize: 14, color: Theme.text, fontStyle: 'italic' }}>
              "{order.clientReview}"
            </Text>
          ) : null}
        </View>
      )}

      {order.status === 'CANCELED' && order.cancelReason ? (
        <View style={[styles.card, { borderColor: `${Theme.error}30` }]}>
          <Text style={styles.cardTitle}>{t('orders.cancelReason')}</Text>
          <Text style={{ fontSize: 14, color: Theme.error }}>{order.cancelReason}</Text>
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
              <FontAwesome name="heartbeat" size={18} color={Theme.primary} />
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
              style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setMedCardVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  urgentBadgeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: Theme.error,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: Spacing.md,
    gap: 0,
  },
  cardTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: Spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowLabel: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },
  rowValue: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.text },
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoCard: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
  },
  photoLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    color: Theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Theme.text,
  },
  medCardRow: {
    marginBottom: Spacing.md,
  },
  medCardLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  medCardValue: {
    fontSize: Typography.body.fontSize,
    color: Theme.text,
  },
  modalCloseBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  modalCloseBtnText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
});

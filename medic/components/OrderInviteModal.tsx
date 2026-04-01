import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { OSRM_URL } from '@/constants/config';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DispatchInvitePayload {
  orderId: string;
  order: {
    id: string;
    serviceTitle: string;
    priceAmount: number;
    discountAmount: number;
    isUrgent?: boolean;
    urgentFee?: number;
    location: {
      house: string;
      floor: string | null;
      apartment: string | null;
      phone: string;
      latitude: number;
      longitude: number;
    } | null;
  };
  client?: {
    averageRating: number | null;
    reviewCount: number;
  };
  expiresAt: string; // ISO timestamp
}

interface Props {
  invite: DispatchInvitePayload | null;
  onDismiss: () => void;
}

export function OrderInviteModal({ invite, onDismiss }: Props) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [medicPos, setMedicPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Computed early so they can be used in useEffect dependency arrays
  const clientLat = invite?.order?.location?.latitude != null ? Number(invite.order.location.latitude) : null;
  const clientLng = invite?.order?.location?.longitude != null ? Number(invite.order.location.longitude) : null;

  useEffect(() => {
    if (!invite) return;
    const update = () => {
      const ms = new Date(invite.expiresAt).getTime() - Date.now();
      const left = Math.max(0, Math.ceil(ms / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(interval);
        // Auto-dismiss after a short delay so the user sees "expired" state
        setTimeout(() => onDismiss(), 2000);
      }
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [invite, onDismiss]);

  // Get medic's current location for distance + map
  useEffect(() => {
    if (!invite) return;
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !alive) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (alive) setMedicPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // GPS unavailable — show text-only distance
      }
    })();
    return () => {
      alive = false;
      locationSubRef.current?.remove();
    };
  }, [invite?.orderId]);

  // Fetch road route medic → client via OSRM when both positions are known
  useEffect(() => {
    if (!medicPos || clientLat == null || clientLng == null) return;
    setRouteLoading(true);
    setRouteCoords([]);
    setRouteError(false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    fetch(
      `${OSRM_URL}/${medicPos.longitude},${medicPos.latitude};${clientLng},${clientLat}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data: { routes?: Array<{ geometry?: { coordinates?: [number, number][] } }> }) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates ?? [];
        if (coords.length) {
          setRouteCoords(coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng })));
        }
      })
      .catch(() => {
        setRouteError(true);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setRouteLoading(false);
      });
    return () => { controller.abort(); };
  }, [medicPos, clientLat, clientLng]);

  const handleAccept = async () => {
    if (!invite) return;
    setLoading('accept');
    try {
      await apiFetch(`/orders/${invite.orderId}/accept`, {
        method: 'POST',
        token: token ?? undefined,
      });
      onDismiss();
      router.push(`/order/${invite.orderId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('INSUFFICIENT_WALLET')) {
        showToast(`${t('wallet.insufficientTitle')}: ${t('wallet.insufficientMessage')}`, 'error', 5000);
      } else {
        showToast(msg || t('common.error'), 'error');
      }
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;
    setLoading('decline');
    try {
      await apiFetch(`/orders/${invite.orderId}/decline`, {
        method: 'POST',
        token: token ?? undefined,
      });
      onDismiss();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t('orders.declineError'), 'error');
      setLoading(null);
    }
  };

  if (!invite) return null;

  const netPrice = (invite.order.priceAmount ?? 0) - (invite.order.discountAmount ?? 0);
  const isExpired = secondsLeft === 0;
  const isCountdownUrgent = secondsLeft <= 15 && !isExpired;
  const canAct = loading === null && !isExpired;
  const orderIsUrgent = invite.order.isUrgent === true;
  const orderUrgentFee = invite.order.urgentFee ?? 0;

  const loc = invite.order.location;
  const addressParts = loc
    ? [
        loc.house,
        loc.floor ? `${t('orders.floor')} ${loc.floor}` : null,
        loc.apartment ? `${t('orders.apartment')} ${loc.apartment}` : null,
      ].filter(Boolean)
    : [];

  const distanceKm =
    medicPos && clientLat != null && clientLng != null
      ? haversineKm(medicPos.latitude, medicPos.longitude, clientLat, clientLng)
      : null;
  const showMap = MapsModule && clientLat != null && clientLng != null;
  const mapInitialRegion =
    medicPos && clientLat != null && clientLng != null
      ? {
          latitude: (medicPos.latitude + clientLat) / 2,
          longitude: (medicPos.longitude + clientLng) / 2,
          latitudeDelta: Math.max(Math.abs(medicPos.latitude - clientLat) * 2.2, 0.008),
          longitudeDelta: Math.max(Math.abs(medicPos.longitude - clientLng) * 2.2, 0.008),
        }
      : {
          latitude: clientLat ?? 0,
          longitude: clientLng ?? 0,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Top header with countdown */}
        <View style={[styles.header, isCountdownUrgent && styles.headerUrgent, isExpired && styles.headerExpired]}>
          <View style={styles.timerWrap}>
            <Text style={[styles.timerNumber, isCountdownUrgent && styles.timerNumberUrgent, isExpired && styles.timerNumberExpired]}>
              {secondsLeft}
            </Text>
            <Text style={styles.timerSec}>{t('orders.sec')}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {isExpired ? t('orders.timeExpired') : `🚨 ${t('orders.newOrderNearby')}`}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isExpired
                ? t('orders.orderPassedToAnother')
                : t('orders.respondWithin', { seconds: secondsLeft })}
            </Text>
          </View>
        </View>

        {/* Urgent order banner */}
        {orderIsUrgent && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentBannerText}>
              🔴 {t('urgent.badge').toUpperCase()} — {t('urgent.fee')}: +{orderUrgentFee.toLocaleString('ru-RU')} {t('common.sum')}
            </Text>
          </View>
        )}

        {/* Order details card */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <FontAwesome name="medkit" size={22} color={Theme.primary} />
            <Text style={styles.serviceTitle}>{invite.order.serviceTitle}</Text>
          </View>

          {/* Client rating */}
          <View style={styles.clientRatingRow}>
            {invite.client && invite.client.reviewCount > 0 ? (
              <View style={styles.clientRatingBadge}>
                <FontAwesome name="star" size={14} color="#f59e0b" />
                <Text style={styles.clientRatingText}>
                  {invite.client.averageRating != null
                    ? invite.client.averageRating.toFixed(1)
                    : '—'}{' '}
                  ({invite.client.reviewCount})
                </Text>
              </View>
            ) : (
              <View style={styles.newClientBadge}>
                <Text style={styles.newClientText}>{t('rating.newClient')}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <InfoRow label={t('orders.cost')} value={`${netPrice.toLocaleString('ru-RU')} UZS`} valueStyle={styles.priceValue} />

          {loc && (
            <>
              {addressParts.length > 0 && (
                <InfoRow label={t('orders.address')} value={addressParts.join(', ')} />
              )}
              <InfoRow label={t('orders.phone')} value={loc.phone} />
              {distanceKm != null && (
                <InfoRow
                  label={t('orders.distance')}
                  value={distanceKm < 1
                    ? `~${Math.round(distanceKm * 1000)} м`
                    : `~${distanceKm.toFixed(1)} км`}
                  valueStyle={styles.distanceValue}
                />
              )}
            </>
          )}
        </View>

        {/* Mini map: client + medic positions */}
        {showMap && (
          <View style={styles.mapCard}>
            <View style={styles.mapWrap}>
              <MapsModule.default
                style={styles.map}
                initialRegion={mapInitialRegion}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {/* Client marker — blue */}
                <MapsModule.Marker
                  coordinate={{ latitude: clientLat!, longitude: clientLng! }}
                  title={t('orders.client')}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.clientDot}>
                    <Text style={styles.markerEmoji}>🏠</Text>
                  </View>
                </MapsModule.Marker>

                {/* Medic marker — red */}
                {medicPos && (
                  <MapsModule.Marker
                    coordinate={medicPos}
                    title={t('orders.you')}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={styles.medicDot}>
                      <Text style={styles.markerEmoji}>🩺</Text>
                    </View>
                  </MapsModule.Marker>
                )}

                {/* Road route (OSRM), fallback to straight line while loading */}
                {medicPos && (
                  <MapsModule.Polyline
                    coordinates={
                      routeCoords.length > 1
                        ? routeCoords
                        : [{ latitude: clientLat!, longitude: clientLng! }, medicPos]
                    }
                    strokeColor="#16a34a"
                    strokeWidth={3}
                  />
                )}
              </MapsModule.default>
              {routeLoading && (
                <View style={styles.mapLoadingOverlay}>
                  <ActivityIndicator color={Theme.primary} size="small" />
                  <Text style={styles.mapLoadingText}>{t('orders.buildingRoute')}</Text>
                </View>
              )}
              {routeError && !routeLoading && routeCoords.length === 0 && (
                <View style={styles.mapLoadingOverlay}>
                  <FontAwesome name="exclamation-triangle" size={16} color={Theme.textSecondary} />
                  <Text style={styles.mapLoadingText}>{t('orders.routeUnavailable') || 'Маршрут недоступен'}</Text>
                </View>
              )}
            </View>
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                <Text style={styles.legendLabel}>{t('orders.client')}</Text>
              </View>
              {medicPos && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
                  <Text style={styles.legendLabel}>{t('orders.you')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.acceptBtn,
              pressed && styles.btnPressed,
              !canAct && styles.btnDisabled,
            ]}
            onPress={handleAccept}
            disabled={!canAct}
          >
            {loading === 'accept' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check-circle" size={20} color="#fff" />
                <Text style={styles.acceptBtnText}>{t('orders.acceptOrder')}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.declineBtn,
              pressed && styles.btnPressed,
              !canAct && styles.btnDisabled,
            ]}
            onPress={handleDecline}
            disabled={!canAct}
          >
            {loading === 'decline' ? (
              <ActivityIndicator color={Theme.error} />
            ) : (
              <>
                <FontAwesome name="times-circle" size={20} color={Theme.error} />
                <Text style={styles.declineBtnText}>{t('orders.declineOrder')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Theme.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
  },
  headerUrgent: {
    backgroundColor: '#d97706', // amber-600
  },
  headerExpired: {
    backgroundColor: Theme.textSecondary,
  },
  timerWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  timerNumberUrgent: {
    color: '#fef3c7',
  },
  timerNumberExpired: {
    color: 'rgba(255,255,255,0.6)',
  },
  timerSec: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },

  // ── Urgent banner ────────────────────────────────────────────────────────────
  urgentBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: '#fee2e2',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  urgentBannerText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: Theme.error,
    textAlign: 'center',
  },

  // ── Details card ────────────────────────────────────────────────────────────
  card: {
    margin: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    ...Shadow.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  clientRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  clientRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef9c3',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  clientRatingText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#92400e',
  },
  newClientBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  newClientText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#0369a1',
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
    minWidth: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Theme.text,
    textAlign: 'right',
  },
  priceValue: {
    color: Theme.primary,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },

  // ── Distance value ──────────────────────────────────────────────────────────
  distanceValue: {
    color: Theme.primary,
    fontWeight: '700',
    fontSize: Typography.body.fontSize,
  },

  // ── Mini map ────────────────────────────────────────────────────────────────
  mapCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    gap: 0,
  },
  mapWrap: {
    height: 200,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    backgroundColor: Theme.surface,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: Typography.caption.fontSize,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  clientDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  medicDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    backgroundColor: Theme.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerEmoji: {
    fontSize: Typography.body.fontSize,
    lineHeight: 20,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapLoadingText: {
    fontSize: Typography.caption.fontSize,
    color: Theme.primary,
    fontWeight: '600',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  buttons: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: Radius.lg,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.45 },
  acceptBtn: {
    backgroundColor: Theme.primary,
  },
  acceptBtnText: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
  declineBtn: {
    backgroundColor: Theme.surface,
    borderWidth: 1.5,
    borderColor: Theme.error,
  },
  declineBtnText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Theme.error,
  },
});

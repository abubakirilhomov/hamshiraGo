import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

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
    location: {
      house: string;
      floor: string | null;
      apartment: string | null;
      phone: string;
      latitude: number;
      longitude: number;
    } | null;
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
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [medicPos, setMedicPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Computed early so they can be used in useEffect dependency arrays
  const clientLat = invite?.order?.location?.latitude != null ? Number(invite.order.location.latitude) : null;
  const clientLng = invite?.order?.location?.longitude != null ? Number(invite.order.location.longitude) : null;

  useEffect(() => {
    if (!invite) return;
    const update = () => {
      const ms = new Date(invite.expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [invite]);

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
      .catch(() => {})
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
        Alert.alert(t('wallet.insufficientTitle'), t('wallet.insufficientMessage'), [{ text: t('wallet.ok') }]);
      } else {
        Alert.alert(t('common.error'), msg || t('common.error'));
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
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отклонить заказ');
      setLoading(null);
    }
  };

  if (!invite) return null;

  const netPrice = (invite.order.priceAmount ?? 0) - (invite.order.discountAmount ?? 0);
  const isExpired = secondsLeft === 0;
  const isUrgent = secondsLeft <= 15 && !isExpired;
  const canAct = loading === null && !isExpired;

  const loc = invite.order.location;
  const addressParts = loc
    ? [
        loc.house,
        loc.floor ? `эт. ${loc.floor}` : null,
        loc.apartment ? `кв. ${loc.apartment}` : null,
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
        <View style={[styles.header, isUrgent && styles.headerUrgent, isExpired && styles.headerExpired]}>
          <View style={styles.timerWrap}>
            <Text style={[styles.timerNumber, isUrgent && styles.timerNumberUrgent, isExpired && styles.timerNumberExpired]}>
              {secondsLeft}
            </Text>
            <Text style={styles.timerSec}>сек</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {isExpired ? 'Время истекло' : '🚨 Новый заказ рядом!'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isExpired
                ? 'Заказ передан другому медику'
                : `Ответьте в течение ${secondsLeft} секунд`}
            </Text>
          </View>
        </View>

        {/* Order details card */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <FontAwesome name="medkit" size={22} color={Theme.primary} />
            <Text style={styles.serviceTitle}>{invite.order.serviceTitle}</Text>
          </View>
          <View style={styles.divider} />

          <InfoRow label="Стоимость" value={`${netPrice.toLocaleString('ru-RU')} UZS`} valueStyle={styles.priceValue} />

          {loc && (
            <>
              {addressParts.length > 0 && (
                <InfoRow label="Адрес" value={addressParts.join(', ')} />
              )}
              <InfoRow label="Телефон" value={loc.phone} />
              {distanceKm != null && (
                <InfoRow
                  label="Расстояние"
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
                  title="Клиент"
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
                    title="Вы"
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
                  <Text style={styles.mapLoadingText}>Строим маршрут...</Text>
                </View>
              )}
            </View>
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                <Text style={styles.legendLabel}>Клиент</Text>
              </View>
              {medicPos && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
                  <Text style={styles.legendLabel}>Вы</Text>
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
                <Text style={styles.acceptBtnText}>Принять заказ</Text>
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
                <Text style={styles.declineBtnText}>Отклонить</Text>
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
    gap: 16,
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
    fontSize: 28,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // ── Details card ────────────────────────────────────────────────────────────
  card: {
    margin: 16,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    minWidth: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.text,
    textAlign: 'right',
  },
  priceValue: {
    color: Theme.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Distance value ──────────────────────────────────────────────────────────
  distanceValue: {
    color: Theme.primary,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Mini map ────────────────────────────────────────────────────────────────
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
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
    paddingVertical: 8,
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
    fontSize: 12,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  clientDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  medicDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerEmoji: {
    fontSize: 16,
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
    fontSize: 12,
    color: Theme.primary,
    fontWeight: '600',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  buttons: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.45 },
  acceptBtn: {
    backgroundColor: Theme.primary,
  },
  acceptBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  declineBtn: {
    backgroundColor: Theme.surface,
    borderWidth: 1.5,
    borderColor: Theme.error,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.error,
  },
});

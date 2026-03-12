import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { MAP_ACTIVE_STATUSES, OrderStatus } from '@/types/order';
import { useOrderStatus, NEXT_STATUS_MAP } from '@/hooks/useOrderStatus';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/constants/api';
import { useMedicLocation } from '@/hooks/useMedicLocation';
import { useMedicRoute } from '@/hooks/useMedicRoute';

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');

async function openInMaps(latitude: number, longitude: number) {
  const lat = latitude;
  const lng = longitude;

  const yandexApp =
    Platform.OS === 'ios'
      ? `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=16&l=map`
      : `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=16`;

  const yandexWeb = `https://maps.yandex.ru/?pt=${lng},${lat}&z=16&l=map`;
  const googleWeb = `https://maps.google.com/?q=${lat},${lng}`;

  try {
    const canYandex = await Linking.canOpenURL(yandexApp);
    if (canYandex) {
      await Linking.openURL(yandexApp);
      return;
    }
  } catch {}

  Alert.alert('Открыть в картах', '', [
    { text: 'Яндекс Карты', onPress: () => Linking.openURL(yandexWeb) },
    { text: 'Google Maps', onPress: () => Linking.openURL(googleWeb) },
    { text: 'Отмена', style: 'cancel' },
  ]);
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED:         Theme.primary,
  ASSIGNED:        Theme.warning,
  ACCEPTED:        Theme.warning,
  ON_THE_WAY:      Theme.warning,
  ARRIVED:         Theme.warning,
  SERVICE_STARTED: Theme.accent,
  DONE:            Theme.success,
  CANCELED:        Theme.error,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { token } = useAuth();

  const [updating, setUpdating] = useState(false);
  const [medicPos, setMedicPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastLocationSentAt, setLastLocationSentAt] = useState<string | null>(null);
  const [sentLocationCount, setSentLocationCount] = useState(0);
  const mapRef = useRef<any>(null);
  const hasFittedMapRef = useRef(false);
  const autoAcceptedRef = useRef(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { order, loading, wsConnected, socketRef, updateOrderStatus } =
    useOrderStatus(id);

  const { routeCoords, routeLoading, fetchRoute, resetRoute } = useMedicRoute();

  const { startTracking, stopTracking } = useMedicLocation({
    orderId: id,
    socketRef,
    onLocationUpdate: setMedicPos,
    onLastSentAt: setLastLocationSentAt,
    onSentCountIncrement: () => setSentLocationCount((prev) => prev + 1),
  });

  // ── Location tracking: ACCEPTED and ON_THE_WAY ───────────────────────────
  useEffect(() => {
    if (order?.status === 'ON_THE_WAY' || order?.status === 'ACCEPTED') {
      startTracking();
    }
    return stopTracking;
  }, [order?.status, startTracking, stopTracking]);

  // ── Get initial medic position + emit once to client ─────────────────────
  useEffect(() => {
    if (!order || !MAP_ACTIVE_STATUSES.includes(order.status)) return;
    Location.getForegroundPermissionsAsync().then((perm) => {
      if (perm.status !== 'granted') return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((loc) => {
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setMedicPos(pos);
          // Emit to client so they see medic position even before ON_THE_WAY
          if (socketRef.current?.connected && order.id) {
            socketRef.current.emit('medic_location', { orderId: order.id, ...pos });
          }
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
      hasFittedMapRef.current = false;
    }
  }, [order?.status, resetRoute]);

  // ── Auto-fit map — only once on first GPS fix ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !medicPos || !order?.location?.latitude) return;
    if (hasFittedMapRef.current) return; // only fit once
    hasFittedMapRef.current = true;
    mapRef.current.fitToCoordinates(
      [
        { latitude: medicPos.latitude, longitude: medicPos.longitude },
        {
          latitude: Number(order.location.latitude),
          longitude: Number(order.location.longitude),
        },
      ],
      { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
    );
  }, [medicPos]);

  // ── Auto-advance ASSIGNED → ACCEPTED on page load ─────────────────────────
  useEffect(() => {
    if (order?.status !== 'ASSIGNED' || autoAcceptedRef.current || !order?.id) return;
    autoAcceptedRef.current = true;
    apiFetch(`/orders/${order.id}/medic-status`, {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify({ status: 'ACCEPTED' }),
    }).catch(() => { autoAcceptedRef.current = false; }); // reset on failure so user can retry
  }, [order?.status, order?.id, token]);

  const handleNextStatus = useCallback(() => {
    updateOrderStatus((v) => setUpdating(v));
  }, [updateOrderStatus]);

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const statusColor = STATUS_COLOR[order.status];
  const nextStep = NEXT_STATUS_MAP[order.status];
  const netPrice = order.priceAmount - (order.discountAmount ?? 0);
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
    MapsModule &&
    clientLat != null &&
    clientLng != null &&
    MAP_ACTIVE_STATUSES.includes(order.status);

  const mapInitialRegion =
    medicPos && clientLat != null && clientLng != null
      ? {
          latitude: (medicPos.latitude + clientLat) / 2,
          longitude: (medicPos.longitude + clientLng) / 2,
          latitudeDelta: Math.max(
            Math.abs(medicPos.latitude - clientLat) * 2.5,
            0.01,
          ),
          longitudeDelta: Math.max(
            Math.abs(medicPos.longitude - clientLng) * 2.5,
            0.01,
          ),
        }
      : {
          latitude: clientLat ?? 0,
          longitude: clientLng ?? 0,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Status */}
      <View
        style={[
          styles.statusBlock,
          { backgroundColor: `${statusColor}12`, borderColor: `${statusColor}30` },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {t(`orders.status.${order.status}`)}
        </Text>
      </View>

      {order.status === 'ON_THE_WAY' && (
        <View style={styles.liveTrackingCard}>
          <View style={styles.liveTrackingRow}>
            <View
              style={[
                styles.liveTrackingDot,
                { backgroundColor: wsConnected ? Theme.success : Theme.warning },
              ]}
            />
            <Text style={styles.liveTrackingText}>
              {wsConnected
                ? 'Передаём геолокацию клиенту'
                : 'Подключаем live-трекинг...'}
            </Text>
          </View>
          {lastLocationSentAt && (
            <Text style={styles.liveTrackingMeta}>
              Последняя отправка:{' '}
              {new Date(lastLocationSentAt).toLocaleTimeString('ru-RU')} · точек:{' '}
              {sentLocationCount}
            </Text>
          )}
        </View>
      )}

      {/* Service info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Услуга</Text>
        <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
        <View style={styles.divider} />
        <Row label="Дата создания" value={date} />
        <Row
          label="Стоимость услуги"
          value={`${order.priceAmount.toLocaleString('ru-RU')} UZS`}
        />
        {order.discountAmount > 0 && (
          <Row
            label="Скидка клиента"
            value={`−${order.discountAmount.toLocaleString('ru-RU')} UZS`}
            valueColor={Theme.success}
          />
        )}
        <Row
          label={`${t('orders.commission')} (10%)`}
          value={`−${platformFee.toLocaleString('ru-RU')} UZS`}
          valueColor={Theme.textSecondary}
        />
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>{t('orders.netEarnings')}</Text>
          <Text style={styles.finalValue}>
            {medicEarnings.toLocaleString('ru-RU')} UZS
          </Text>
        </View>
      </View>

      {/* Address */}
      {order.location && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Адрес клиента</Text>
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={16} color={Theme.primary} />
            <Text style={styles.locationText}>
              {order.location.house}
              {order.location.floor ? `, этаж ${order.location.floor}` : ''}
              {order.location.apartment ? `, кв. ${order.location.apartment}` : ''}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <FontAwesome name="phone" size={16} color={Theme.primary} />
            <Text style={styles.locationText}>{order.location.phone}</Text>
            {order.status !== 'DONE' && order.status !== 'CANCELED' && (
              <Pressable
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
                onPress={() => Linking.openURL(`tel:${order.location!.phone}`)}
              >
                <FontAwesome name="phone" size={13} color="#fff" />
                <Text style={styles.callBtnText}>{t('orders.callPatient')}</Text>
              </Pressable>
            )}
          </View>
          {clientLat != null && clientLng != null && (
            <Pressable
              style={({ pressed }) => [
                styles.mapsBtn,
                pressed && styles.mapsBtnPressed,
              ]}
              onPress={() => openInMaps(clientLat!, clientLng!)}
            >
              <FontAwesome name="location-arrow" size={15} color="#fff" />
              <Text style={styles.mapsBtnText}>{t('orders.openMap')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Embedded map: medic → client */}
      {showMap && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Маршрут к клиенту</Text>
          <View style={styles.mapWrap}>
            <MapsModule.default
              ref={mapRef}
              style={styles.map}
              initialRegion={mapInitialRegion}
              pitchEnabled={false}
              rotateEnabled={false}
              onMapReady={() => {
                if (medicPos && clientLat != null && clientLng != null) {
                  mapRef.current?.fitToCoordinates(
                    [
                      {
                        latitude: medicPos.latitude,
                        longitude: medicPos.longitude,
                      },
                      { latitude: clientLat, longitude: clientLng },
                    ],
                    {
                      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                      animated: false,
                    },
                  );
                }
              }}
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

              {/* Medic marker — green */}
              {medicPos && (
                <MapsModule.Marker
                  coordinate={medicPos}
                  title="Вы"
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.medicDot}>
                    <Text style={styles.markerEmoji}>🧑‍⚕️</Text>
                  </View>
                </MapsModule.Marker>
              )}

              {/* Route line */}
              {medicPos && (
                <MapsModule.Polyline
                  coordinates={
                    routeCoords.length > 1
                      ? routeCoords
                      : [
                          {
                            latitude: medicPos.latitude,
                            longitude: medicPos.longitude,
                          },
                          { latitude: clientLat!, longitude: clientLng! },
                        ]
                  }
                  strokeColor="#16a34a"
                  strokeWidth={3.5}
                />
              )}
            </MapsModule.default>

            {routeLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator color={Theme.primary} />
                <Text style={styles.mapLoadingText}>Строим маршрут...</Text>
              </View>
            )}
          </View>

          {/* Legend */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendLabel}>Клиент</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.legendLabel}>Вы</Text>
            </View>
            {!medicPos && (
              <Text style={styles.waitingGps}>Ожидаем GPS...</Text>
            )}
          </View>
        </View>
      )}

      {/* Next action button */}
      {nextStep && (
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            nextStep.status === 'DONE' && styles.actionBtnDone,
            pressed && styles.actionBtnPressed,
            updating && styles.actionBtnDisabled,
          ]}
          onPress={handleNextStatus}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome
                name={nextStep.status === 'DONE' ? 'check-circle' : 'arrow-right'}
                size={18}
                color="#fff"
              />
              <Text style={styles.actionBtnText}>{t(nextStep.labelKey)}</Text>
            </>
          )}
        </Pressable>
      )}

      {(order.status === 'DONE' || order.status === 'CANCELED') && (
        <View style={styles.completedNote}>
          <FontAwesome
            name={order.status === 'DONE' ? 'check-circle' : 'times-circle'}
            size={20}
            color={statusColor}
          />
          <Text style={[styles.completedText, { color: statusColor }]}>
            {t(`orders.status.${order.status}`)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  statusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  liveTrackingCard: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: `${Theme.primary}10`,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
  },
  liveTrackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveTrackingDot: { width: 8, height: 8, borderRadius: 4 },
  liveTrackingText: { fontSize: 13, fontWeight: '600', color: Theme.text },
  liveTrackingMeta: { marginTop: 6, fontSize: 12, color: Theme.textSecondary },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
    gap: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceTitle: { fontSize: 18, fontWeight: '700', color: Theme.text },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: { fontSize: 14, color: Theme.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: Theme.text },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    marginTop: 4,
  },
  finalLabel: { fontSize: 14, fontWeight: '600', color: Theme.text },
  finalValue: { fontSize: 17, fontWeight: '700', color: Theme.primary },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  locationText: { fontSize: 15, color: Theme.text, flex: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  callBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  mapsBtnPressed: { opacity: 0.9 },
  mapsBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Map ───────────────────────────────────────────────────────────────────
  mapWrap: { height: 240, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapLoadingText: { fontSize: 12, color: Theme.primary, fontWeight: '600' },
  map: { width: '100%', height: '100%' },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: Theme.textSecondary, fontWeight: '600' },
  waitingGps: { fontSize: 12, color: Theme.textSecondary, marginLeft: 4 },
  clientDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  medicDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  markerEmoji: { fontSize: 17, lineHeight: 21 },

  // ── Action button ─────────────────────────────────────────────────────────
  actionBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  actionBtnDone: { backgroundColor: Theme.success },
  actionBtnPressed: { opacity: 0.9 },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  completedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  completedText: { fontSize: 16, fontWeight: '600' },
});

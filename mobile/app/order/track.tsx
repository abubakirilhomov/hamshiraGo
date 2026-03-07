import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AppModal from '@/components/AppModal';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { io, Socket } from 'socket.io-client';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { API_BASE, apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'SERVICE_STARTED'
  | 'DONE'
  | 'CANCELED';

interface Medic {
  id: string;
  name: string;
  phone: string;
  profilePhotoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Order {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  status: OrderStatus;
  dispatchStatus?: 'SEARCHING' | 'NO_MEDICS' | 'ASSIGNED' | 'FAILED' | null;
  clientRating: number | null;
  medic?: Medic | null;
  location: {
    house: string;
    floor?: string | null;
    apartment?: string | null;
    phone: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  created_at: string;
}

type MedicLocationPayload = {
  orderId: string;
  medicId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  source?: 'socket' | 'rest';
};

type DispatchStatus = 'searching' | 'contacting' | 'no_medics';

type DispatchUpdatePayload = {
  orderId: string;
  status: DispatchStatus;
  medic?: {
    name: string;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
  } | null;
};

const TrackMapComponent =
  Platform.OS === 'web'
    ? null
    : require('react-native-maps');

// Animated marker: prefer the built-in Marker.Animated, fall back to createAnimatedComponent
const AnimatedMedicMarker: React.ComponentType<any> | null = TrackMapComponent
  ? (TrackMapComponent.Marker.Animated ??
     Animated.createAnimatedComponent(TrackMapComponent.Marker as React.ComponentType<any>))
  : null;

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'CREATED', label: 'Заказ создан', icon: 'file-text-o' },
  { status: 'ASSIGNED', label: 'Медик найден', icon: 'user' },
  { status: 'ACCEPTED', label: 'Медик принял', icon: 'check-circle-o' },
  { status: 'ON_THE_WAY', label: 'Медик едет', icon: 'car' },
  { status: 'ARRIVED', label: 'Медик прибыл', icon: 'map-marker' },
  { status: 'SERVICE_STARTED', label: 'Услуга начата', icon: 'heartbeat' },
  { status: 'DONE', label: 'Завершено', icon: 'check-circle' },
];

const STATUS_INDEX: Partial<Record<OrderStatus, number>> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i]),
);

// ─── Persistent notification helpers ─────────────────────────────────────────

const TRACK_NOTIF_ID = 'hamshirago-track';
const ACTIVE_TRACK_STATUSES: OrderStatus[] = ['CREATED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'];

function getTrackNotifContent(order: Order): { title: string; body: string } | null {
  const name = order.medic?.name;
  switch (order.status) {
    case 'CREATED':         return { title: '🔍 Ищем медика', body: 'Подбираем медика для вас...' };
    case 'ASSIGNED':        return { title: '👤 Медик назначен', body: name ? `${name} принял заказ` : 'Медик принял заказ' };
    case 'ACCEPTED':        return { title: '✅ Медик подтвердил', body: name ? `${name} скоро выедет` : 'Медик скоро выедет' };
    case 'ON_THE_WAY':      return { title: '🚗 Медик едет', body: name ? `${name} едет к вам` : 'Медик едет к вам' };
    case 'ARRIVED':         return { title: '📍 Медик прибыл', body: 'Откройте дверь — медик у вашего дома' };
    case 'SERVICE_STARTED': return { title: '💉 Услуга начата', body: 'Медик оказывает услугу' };
    default:                return null;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [payStatus, setPayStatus] = useState<'idle' | 'paid'>('idle');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [dispatchState, setDispatchState] = useState<{
    status: DispatchStatus;
    candidateName?: string;
    candidateLat?: number | null;
    candidateLng?: number | null;
  } | null>(null);
  const [medicLocation, setMedicLocation] = useState<{
    latitude: number;
    longitude: number;
    updatedAt: string;
    source?: 'socket' | 'rest';
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRouteFetchAtRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // AnimatedRegion used for smooth marker interpolation (initialized on first location)
  const medicAnimCoordRef = useRef<any>(null);
  const [medicAnimReady, setMedicAnimReady] = useState(false);
  const orderRef = useRef<Order | null>(null);

  // ── REST fetch ──────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    try {
      const data = await apiFetch<Order>(`/orders/${orderId}`, {
        token: token ?? undefined,
      });
      setOrder(data);
      if (data?.medic?.latitude != null && data?.medic?.longitude != null) {
        setMedicLocation({
          latitude: Number(data.medic.latitude),
          longitude: Number(data.medic.longitude),
          updatedAt: new Date().toISOString(),
          source: 'rest',
        });
      }
      // Initialize dispatch state from REST as fallback (WebSocket events override with richer data)
      if (data.status === 'CREATED' && data.dispatchStatus) {
        setDispatchState((prev) => {
          if (prev) return prev; // WebSocket already provided richer info — keep it
          if (data.dispatchStatus === 'SEARCHING') return { status: 'searching' };
          if (data.dispatchStatus === 'NO_MEDICS') return { status: 'no_medics' };
          return null;
        });
      }
    } catch {
      // silent – keep stale data
    }
  }, [orderId, token]);

  // ── WebSocket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !token) return;

    setLoading(true);
    fetchOrder().finally(() => setLoading(false));

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setWsConnected(true);
      socket.emit('subscribe_order', orderId);
    });

    socket.on('disconnect', () => setWsConnected(false));

    socket.on('order_status', (payload: { orderId: string; status: OrderStatus }) => {
      if (payload.orderId !== orderId) return;
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      if (payload.status === 'ASSIGNED') {
        // Medic accepted — clear dispatch overlay and reset route so it refetches
        setDispatchState(null);
        setRouteCoords([]);
        lastRouteFetchAtRef.current = 0;
      }
      if (payload.status === 'DONE' || payload.status === 'CANCELED') {
        // Refetch full order so medic field is populated for the rating block
        fetchOrder().finally(() => socket.disconnect());
      }
    });

    socket.on('dispatch_update', (payload: DispatchUpdatePayload) => {
      if (payload.orderId !== orderId) return;
      setDispatchState({
        status: payload.status,
        candidateName: payload.medic?.name,
        candidateLat: payload.medic?.latitude,
        candidateLng: payload.medic?.longitude,
      });
      // Show candidate medic on the map
      if (payload.medic?.latitude != null && payload.medic?.longitude != null) {
        setMedicLocation({
          latitude: Number(payload.medic.latitude),
          longitude: Number(payload.medic.longitude),
          updatedAt: new Date().toISOString(),
          source: 'socket',
        });
      }
    });

    socket.on('medic_location', (payload: MedicLocationPayload) => {
      if (payload.orderId !== orderId) return;
      setMedicLocation({
        latitude: payload.latitude,
        longitude: payload.longitude,
        updatedAt: payload.updatedAt,
        source: payload.source,
      });
    });

    // Polling fallback every 20s (in case WS fails)
    pollingRef.current = setInterval(() => {
      if (!wsConnected) fetchOrder();
    }, 20_000);

    return () => {
      socket.emit('unsubscribe_order', orderId);
      socket.disconnect();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Force rating: block back navigation until rated ──────────────────────────
  const mustRate = order?.status === 'DONE' && order.clientRating === null && !!order.medic;

  useEffect(() => {
    if (!mustRate) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      Alert.alert(
        'Оцените медика',
        'Пожалуйста, оцените медика перед тем как вернуться назад.',
        [{ text: 'Хорошо' }],
      );
    });
    return unsubscribe;
  }, [navigation, mustRate]);

  useEffect(() => {
    if (!mustRate) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Оцените медика',
        'Пожалуйста, оцените медика перед тем как вернуться назад.',
        [{ text: 'Хорошо' }],
      );
      return true;
    });
    return () => sub.remove();
  }, [mustRate]);

  // ── Persistent notification ──────────────────────────────────────────────
  // Keep ref in sync so AppState listener always reads latest order
  useEffect(() => { orderRef.current = order; }, [order]);

  // Dismiss notification when order ends (even while app is in foreground)
  useEffect(() => {
    if (order?.status === 'DONE' || order?.status === 'CANCELED') {
      Notifications.dismissNotificationAsync(TRACK_NOTIF_ID).catch(() => {});
    }
  }, [order?.status]);

  // AppState: show notification when backgrounded, dismiss when foregrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const current = orderRef.current;
      if (state === 'background' && current && ACTIVE_TRACK_STATUSES.includes(current.status)) {
        const content = getTrackNotifContent(current);
        if (content) {
          Notifications.scheduleNotificationAsync({
            identifier: TRACK_NOTIF_ID,
            content: { title: content.title, body: content.body, sound: false, data: { orderId } },
            trigger: null,
          }).catch(() => {});
        }
      } else if (state === 'active') {
        Notifications.dismissNotificationAsync(TRACK_NOTIF_ID).catch(() => {});
      }
    });
    return () => {
      sub.remove();
      Notifications.dismissNotificationAsync(TRACK_NOTIF_ID).catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoadRoute = useCallback(async () => {
    if (!order?.location || !medicLocation) return;
    if (order.location.latitude == null || order.location.longitude == null) return;
    // Only fetch road route when medic is actively on the way (not during dispatch search)
    if (order.status === 'CREATED') return;

    const now = Date.now();
    if (now - lastRouteFetchAtRef.current < 12_000) return;
    lastRouteFetchAtRef.current = now;

    const fromLng = medicLocation.longitude;
    const fromLat = medicLocation.latitude;
    const toLng = Number(order.location.longitude);
    const toLat = Number(order.location.latitude);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${OSRM_ROUTE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = await res.json() as {
        routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
      };
      const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
      if (!coordinates.length) return;
      setRouteCoords(
        coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
    } catch {
      clearTimeout(timer);
      // Keep previous route on network/API errors
    }
  }, [medicLocation, order?.location, order?.status]);

  useEffect(() => {
    fetchRoadRoute();
  }, [fetchRoadRoute]);

  // ── Pulse animation (while dispatching) ─────────────────────────────────────
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
  useEffect(() => {
    if (!medicLocation || !TrackMapComponent) return;

    if (!medicAnimCoordRef.current) {
      // First position — initialize at exact location (no animation needed)
      medicAnimCoordRef.current = new TrackMapComponent.AnimatedRegion({
        latitude: medicLocation.latitude,
        longitude: medicLocation.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      setMedicAnimReady(true);
    } else {
      // Subsequent positions — animate smoothly.
      // Socket events: 900 ms (frequent small deltas → silky motion).
      // REST polling:  0 ms (20 s gap → large jump, don't mislead with slow anim).
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

  // ── Elapsed timer (while order is CREATED) ───────────────────────────────────
  useEffect(() => {
    if (order?.status !== 'CREATED') {
      setElapsedSeconds(0);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }
    if (order?.created_at) {
      const startMs = new Date(order.created_at).getTime();
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      tick();
      elapsedTimerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [order?.status, order?.created_at]);

  // ── Rate order ───────────────────────────────────────────────────────────────
  const handleRate = async (stars: number) => {
    if (!orderId || !token || submittingRating) return;
    setSubmittingRating(true);
    try {
      const updated = await apiFetch<Order>(`/orders/${orderId}/rate`, {
        method: 'POST',
        token,
        body: JSON.stringify({ rating: stars }),
      });
      setOrder(updated);
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отправить оценку');
    } finally {
      setSubmittingRating(false);
    }
  };

  // ── Payment status check (when DONE) ─────────────────────────────────────────
  useEffect(() => {
    if (order?.status !== 'DONE' || !orderId || !token) return;
    apiFetch<{ status: string }>(`/payments/${orderId}/status`, { token })
      .then((p) => { if (p.status === 'paid') setPayStatus('paid'); })
      .catch(() => {});
  }, [order?.status, orderId, token]);

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

  // ── Cancel order ────────────────────────────────────────────────────────────
  const handleCancel = () => setCancelModal(true);

  const confirmCancel = async () => {
    setCancelModal(false);
    try {
      await apiFetch(`/orders/${orderId}/cancel`, {
        method: 'POST',
        token: token ?? undefined,
      });
      router.replace('/(tabs)/two');
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : 'Не удалось отменить');
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
        <Text style={styles.errorText}>Заказ не найден</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/two')}>
          <Text style={styles.backBtnText}>К заказам</Text>
        </Pressable>
      </View>
    );
  }

  const currentIdx = order.status === 'CANCELED' ? -1 : (STATUS_INDEX[order.status] ?? 0);
  const isDone = order.status === 'DONE';
  const isCanceled = order.status === 'CANCELED';
  const isActive = !isDone && !isCanceled;
  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
        <Text style={styles.priceText}>
          {finalPrice.toLocaleString('ru-RU')} UZS
        </Text>
      </View>

      {/* Dispatch status banner (shown while order is CREATED) */}
      {order.status === 'CREATED' && dispatchState && (
        <View style={[
          styles.dispatchBanner,
          dispatchState.status === 'no_medics' && styles.dispatchBannerWaiting,
        ]}>
          <ActivityIndicator
            size="small"
            color={dispatchState.status === 'no_medics' ? Theme.warning : Theme.primary}
          />
          <View style={styles.dispatchBannerText}>
            <FontAwesome
              name={dispatchState.status === 'no_medics' ? 'clock-o' : 'search'}
              size={13}
              color={dispatchState.status === 'no_medics' ? Theme.warning : Theme.primary}
            />
            <Text style={[
              styles.dispatchBannerLabel,
              dispatchState.status === 'no_medics' && { color: Theme.warning },
            ]}>
              {getDispatchStatusText(dispatchState)}
            </Text>
          </View>
          <Text style={styles.dispatchTimer}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
      )}

      {/* Canceled banner */}
      {isCanceled && (
        <View style={styles.canceledBanner}>
          <FontAwesome name="times-circle" size={18} color={Theme.error} />
          <Text style={styles.canceledText}>Заказ отменён</Text>
        </View>
      )}

      {/* Progress stepper */}
      {!isCanceled && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Статус заказа</Text>
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const future = idx > currentIdx;

            const lineColor = done ? Theme.primary : Theme.border;
            const circleColor = active
              ? Theme.primary
              : done
              ? Theme.primary
              : Theme.border;
            const labelColor = future ? Theme.textSecondary : Theme.text;

            return (
              <View key={step.status} style={styles.step}>
                {/* Left col: circle + connector */}
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepCircle,
                      { borderColor: circleColor, backgroundColor: (done || active) ? circleColor : 'transparent' },
                    ]}
                  >
                    {done ? (
                      <FontAwesome name="check" size={10} color="#fff" />
                    ) : (
                      <FontAwesome
                        name={step.icon as keyof typeof FontAwesome.glyphMap}
                        size={11}
                        color={active ? '#fff' : Theme.border}
                      />
                    )}
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: lineColor }]} />
                  )}
                </View>

                {/* Right col: label */}
                <View style={styles.stepRight}>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: labelColor, fontWeight: active ? '700' : '400' },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {active && (
                    <Text style={styles.stepActiveHint}>
                      {getStepHint(step.status)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Medic card */}
      {order.medic && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ваш медик</Text>
          <View style={styles.medicRow}>
            <View style={styles.medicAvatar}>
              {order.medic.profilePhotoUrl ? (
                <Image source={{ uri: order.medic.profilePhotoUrl }} style={styles.medicAvatarImg} />
              ) : (
                <FontAwesome name="user-md" size={22} color={Theme.primary} />
              )}
            </View>
            <View style={styles.medicInfo}>
              <Text style={styles.medicName}>{order.medic.name}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Live map */}
      {order.location?.latitude != null &&
        order.location?.longitude != null &&
        TrackMapComponent && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {order.status === 'CREATED' ? 'Поиск медика' : 'Медик на карте'}
            </Text>
            <View style={styles.mapWrap}>
              <TrackMapComponent.default
                style={styles.map}
                initialRegion={{
                  latitude: medicLocation
                    ? (Number(order.location.latitude) + medicLocation.latitude) / 2
                    : Number(order.location.latitude),
                  longitude: medicLocation
                    ? (Number(order.location.longitude) + medicLocation.longitude) / 2
                    : Number(order.location.longitude),
                  latitudeDelta: 0.025,
                  longitudeDelta: 0.025,
                }}
                region={medicLocation ? {
                  latitude: (Number(order.location.latitude) + medicLocation.latitude) / 2,
                  longitude: (Number(order.location.longitude) + medicLocation.longitude) / 2,
                  latitudeDelta: 0.025,
                  longitudeDelta: 0.025,
                } : undefined}
              >
                {/* Client marker — blue, pulsing during search */}
                <TrackMapComponent.Marker
                  coordinate={{
                    latitude: Number(order.location.latitude),
                    longitude: Number(order.location.longitude),
                  }}
                  title="Вы здесь"
                  description="Адрес вызова"
                  tracksViewChanges={order.status === 'CREATED' && !!dispatchState}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.clientMarkerWrap}>
                    {order.status === 'CREATED' && dispatchState && (
                      <Animated.View
                        style={[
                          styles.pulseRing,
                          {
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                          },
                        ]}
                      />
                    )}
                    <View style={styles.clientMarkerDot}>
                      <Text style={styles.markerEmoji}>🏠</Text>
                    </View>
                  </View>
                </TrackMapComponent.Marker>

                {/* Medic/candidate marker — smoothly interpolated via AnimatedRegion */}
                {medicLocation && medicAnimReady && medicAnimCoordRef.current && AnimatedMedicMarker && (
                  <AnimatedMedicMarker
                    coordinate={medicAnimCoordRef.current}
                    title={
                      order.status === 'CREATED' && dispatchState?.candidateName
                        ? dispatchState.candidateName
                        : 'Медик'
                    }
                    description={
                      order.status === 'CREATED'
                        ? 'Ожидаем подтверждения'
                        : 'Текущая позиция медика'
                    }
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={[
                      styles.medicMarkerDot,
                      order.status === 'CREATED' && { backgroundColor: '#f59e0b' },
                    ]}>
                      {order.medic?.profilePhotoUrl ? (
                        <Image source={{ uri: order.medic.profilePhotoUrl }} style={styles.medicMarkerImg} />
                      ) : (
                        <Text style={styles.markerEmoji}>🧑‍⚕️</Text>
                      )}
                    </View>
                  </AnimatedMedicMarker>
                )}

                {/* Route line */}
                {medicLocation && (
                  <TrackMapComponent.Polyline
                    coordinates={routeCoords.length > 1
                      ? routeCoords
                      : [
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

            {/* Legend + meta */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                <Text style={styles.legendText}>Вы</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: order.status === 'CREATED' ? '#f59e0b' : '#16a34a' }]} />
                <Text style={styles.legendText}>
                  {order.status === 'CREATED' ? 'Кандидат' : 'Медик'}
                </Text>
              </View>
              {medicLocation && (
                <Text style={styles.mapMeta}>
                  {new Date(medicLocation.updatedAt).toLocaleTimeString('ru-RU')}
                </Text>
              )}
            </View>
          </View>
        )}

      {/* Address */}
      {order.location && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Адрес</Text>
          <View style={styles.addressRow}>
            <FontAwesome name="map-marker" size={14} color={Theme.textSecondary} />
            <Text style={styles.addressText} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
              {order.location.house}
              {order.location.floor ? `, эт. ${order.location.floor}` : ''}
              {order.location.apartment ? `, кв. ${order.location.apartment}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Rating block — shown when DONE and not yet rated */}
      {isDone && order.clientRating === null && order.medic && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Оцените медика</Text>
          <Text style={styles.ratingHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
            Нажмите на звезду чтобы выбрать оценку
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.6 }]}
                onPress={() => setPendingRating(star)}
                disabled={submittingRating}
              >
                <FontAwesome
                  name={star <= pendingRating ? 'star' : 'star-o'}
                  size={38}
                  color={star <= pendingRating ? Theme.primary : Theme.border}
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.submitRatingBtn,
              pendingRating === 0 && styles.submitRatingDisabled,
              pressed && pendingRating > 0 && { opacity: 0.8 },
            ]}
            onPress={() => pendingRating > 0 && handleRate(pendingRating)}
            disabled={submittingRating || pendingRating === 0}
          >
            {submittingRating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitRatingText}>
                  {pendingRating === 0 ? 'Выберите оценку' : `Отправить — ${pendingRating} ★`}
                </Text>
            }
          </Pressable>
        </View>
      )}

      {/* Rating already submitted */}
      {isDone && order.clientRating !== null && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ваша оценка</Text>
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
        </View>
      )}

      {/* Buttons */}
      {isActive && (order.status === 'CREATED' || order.status === 'ASSIGNED') && (
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelBtnText}>Отменить заказ</Text>
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
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace('/(tabs)/two')}
        >
          <Text style={styles.doneBtnText}>К моим заказам</Text>
        </Pressable>
      )}
    </ScrollView>

    {/* Cancel confirm modal */}
    <AppModal
      visible={cancelModal}
      title="Отменить заказ?"
      message="Вы уверены, что хотите отменить заказ?"
      buttons={[
        { text: 'Нет', style: 'cancel', onPress: () => setCancelModal(false) },
        { text: 'Отменить', style: 'destructive', onPress: confirmCancel },
      ]}
      onClose={() => setCancelModal(false)}
    />

    {/* Cancel error modal */}
    <AppModal
      visible={cancelError !== null}
      title="Ошибка"
      message={cancelError ?? ''}
      buttons={[{ text: 'OK', style: 'default', onPress: () => setCancelError(null) }]}
      onClose={() => setCancelError(null)}
    />
    </>
  );
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

function getDispatchStatusText(dispatchState: {
  status: DispatchStatus;
  candidateName?: string;
} | null): string | null {
  if (!dispatchState) return null;
  switch (dispatchState.status) {
    case 'searching': return 'Ищем медика...';
    case 'contacting':
      return dispatchState.candidateName
        ? `Связываемся с ${dispatchState.candidateName}...`
        : 'Связываемся с медиком...';
    case 'no_medics': return 'Медики заняты, продолжаем поиск...';
    default: return null;
  }
}

function getStepHint(status: OrderStatus): string {
  switch (status) {
    case 'CREATED': return 'Ожидаем назначения медика...';
    case 'ASSIGNED': return 'Медик получил ваш заказ';
    case 'ACCEPTED': return 'Медик подтвердил выезд';
    case 'ON_THE_WAY': return 'Медик едет к вам';
    case 'ARRIVED': return 'Медик у вашей двери';
    case 'SERVICE_STARTED': return 'Услуга оказывается';
    case 'DONE': return 'Завершено';
    default: return '';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: Theme.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Theme.primary,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Header
  headerCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Theme.success}18`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.success,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.success,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.primary,
  },

  // Section card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stepper
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 26,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 3,
  },
  stepRight: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 12,
    gap: 3,
  },
  stepLabel: {
    fontSize: 15,
  },
  stepActiveHint: {
    fontSize: 13,
    color: Theme.textSecondary,
  },

  // Medic
  medicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medicAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medicAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  medicInfo: {
    flex: 1,
    gap: 3,
  },
  medicName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text,
  },
  medicPhone: {
    fontSize: 13,
  },

  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  mapWrap: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
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
  legendText: {
    fontSize: 12,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  mapMeta: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginLeft: 'auto',
  },

  // Marker styles
  clientMarkerWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
  },
  clientMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  medicMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  medicMarkerImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Dispatch status banner
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Theme.primary}10`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
  },
  dispatchBannerWaiting: {
    backgroundColor: `${Theme.warning}10`,
    borderColor: `${Theme.warning}25`,
  },
  dispatchBannerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dispatchBannerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.primary,
    flex: 1,
  },
  dispatchTimer: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    minWidth: 48,
    textAlign: 'right',
  },

  // Canceled banner
  canceledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Theme.error}12`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Theme.error}30`,
  },
  canceledText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },

  // Buttons
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Theme.error,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.error,
  },
  doneBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payBtn: {
    backgroundColor: Theme.success,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  payPaid: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.success,
    textAlign: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },

  // Rating
  ratingHint: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 4,
    color: '#6b7280',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  starBtn: {
    alignItems: 'center',
    padding: 4,
  },
  submitRatingBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitRatingDisabled: {
    backgroundColor: Theme.border,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  ratingDoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});

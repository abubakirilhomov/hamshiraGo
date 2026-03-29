import { Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import type { OrderStatus } from '@/types/order';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medic {
  id: string;
  name: string;
  phone: string;
  profilePhotoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Order {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  status: OrderStatus;
  dispatchStatus?: 'SEARCHING' | 'NO_MEDICS' | 'ASSIGNED' | 'FAILED' | null;
  cancelReason?: string | null;
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

export type MedicLocation = {
  latitude: number;
  longitude: number;
  updatedAt: string;
  source?: 'socket' | 'rest';
};

export type DispatchStatus = 'searching' | 'contacting' | 'no_medics';

export type DispatchState = {
  status: DispatchStatus;
  candidateName?: string;
  candidatePhoto?: string | null;
  candidateLat?: number | null;
  candidateLng?: number | null;
} | null;

type MedicLocationPayload = {
  orderId: string;
  medicId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  source?: 'socket' | 'rest';
};

type DispatchUpdatePayload = {
  orderId: string;
  status: DispatchStatus;
  medic?: {
    name: string;
    profilePhotoUrl?: string | null;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
  } | null;
};

// ─── Persistent notification helpers ─────────────────────────────────────────

const TRACK_NOTIF_ID = 'hamshirago-track';
const ACTIVE_TRACK_STATUSES: OrderStatus[] = [
  'CREATED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
];

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseOrderTrackingResult {
  order: Order | null;
  loading: boolean;
  wsConnected: boolean;
  dispatchState: DispatchState;
  medicLocation: MedicLocation | null;
  ratingSubmitting: boolean;
  cancelOrder: (reason?: string) => Promise<void>;
  submitRating: (stars: number, review?: string) => Promise<void>;
  fetchOrder: () => Promise<void>;
}

export function useOrderTracking(orderId: string | undefined): UseOrderTrackingResult {
  const router = useRouter();
  const { token } = useAuth();
  const { socket, connected: wsConnected } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchState, setDispatchState] = useState<DispatchState>(null);
  const [medicLocation, setMedicLocation] = useState<MedicLocation | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<Order | null>(null);
  const wsConnectedRef = useRef(false);
  const ratingSubmittingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { orderRef.current = order; }, [order]);
  useEffect(() => { wsConnectedRef.current = wsConnected; }, [wsConnected]);

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

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !token) return;
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [orderId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket: subscribe to events on the shared socket ────────────────────
  useEffect(() => {
    if (!orderId || !socket) return;

    // Subscribe when socket connects (or is already connected)
    if (socket.connected) {
      socket.emit('subscribe_order', orderId);
    }
    const onConnect = () => socket.emit('subscribe_order', orderId);
    socket.on('connect', onConnect);

    const onOrderStatus = (payload: { orderId: string; status: OrderStatus }) => {
      if (payload.orderId !== orderId) return;
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      if (payload.status === 'ASSIGNED') {
        setDispatchState(null);
      }
      if (payload.status === 'DONE' || payload.status === 'CANCELED') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        fetchOrder();
      }
    };

    const onDispatchUpdate = (payload: DispatchUpdatePayload) => {
      if (payload.orderId !== orderId) return;
      setDispatchState({
        status: payload.status,
        candidateName: payload.medic?.name,
        candidatePhoto: payload.medic?.profilePhotoUrl,
        candidateLat: payload.medic?.latitude,
        candidateLng: payload.medic?.longitude,
      });
      if (payload.medic?.latitude != null && payload.medic?.longitude != null) {
        setMedicLocation({
          latitude: Number(payload.medic.latitude),
          longitude: Number(payload.medic.longitude),
          updatedAt: new Date().toISOString(),
          source: 'socket',
        });
      }
    };

    const onMedicLocation = (payload: MedicLocationPayload) => {
      if (payload.orderId !== orderId) return;
      setMedicLocation({
        latitude: payload.latitude,
        longitude: payload.longitude,
        updatedAt: payload.updatedAt,
        source: payload.source,
      });
    };

    const onDispatchInvite = (payload: { orderId: string; medicName?: string }) => {
      if (payload.orderId !== orderId) return;
      setDispatchState((prev) => ({
        status: 'contacting',
        candidateName: payload.medicName,
        candidatePhoto: prev?.candidatePhoto,
        candidateLat: prev?.candidateLat,
        candidateLng: prev?.candidateLng,
      }));
    };

    const onDispatchInviteExpired = (payload: { orderId: string }) => {
      if (payload.orderId !== orderId) return;
      setDispatchState((prev) => (prev ? { ...prev, status: 'searching' } : prev));
    };

    socket.on('order_status', onOrderStatus);
    socket.on('dispatch_update', onDispatchUpdate);
    socket.on('medic_location', onMedicLocation);
    socket.on('dispatch_invite', onDispatchInvite);
    socket.on('dispatch_invite_expired', onDispatchInviteExpired);

    // Polling fallback every 20s (in case WS fails)
    pollingRef.current = setInterval(() => {
      if (!wsConnectedRef.current) fetchOrder();
    }, 20_000);

    return () => {
      socket.emit('unsubscribe_order', orderId);
      socket.off('connect', onConnect);
      socket.off('order_status', onOrderStatus);
      socket.off('dispatch_update', onDispatchUpdate);
      socket.off('medic_location', onMedicLocation);
      socket.off('dispatch_invite', onDispatchInvite);
      socket.off('dispatch_invite_expired', onDispatchInviteExpired);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dismiss notification when order ends ─────────────────────────────────────
  useEffect(() => {
    if (order?.status === 'DONE' || order?.status === 'CANCELED') {
      Notifications.dismissNotificationAsync(TRACK_NOTIF_ID).catch(() => {});
    }
  }, [order?.status]);

  // ── AppState: show notification when backgrounded, dismiss when foregrounded ──
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

  // ── Cancel order ──────────────────────────────────────────────────────────────
  const cancelOrder = useCallback(async (reason?: string) => {
    await apiFetch(`/orders/${orderId}/cancel`, {
      method: 'POST',
      token: token ?? undefined,
      ...(reason ? { body: JSON.stringify({ reason }) } : {}),
    });
    router.replace('/(tabs)/two');
  }, [orderId, token, router]);

  // ── Submit rating ─────────────────────────────────────────────────────────────
  const submitRating = useCallback(async (stars: number, review?: string) => {
    if (!orderId || !token || ratingSubmittingRef.current) return;
    ratingSubmittingRef.current = true;
    setRatingSubmitting(true);
    try {
      const updated = await apiFetch<Order>(`/orders/${orderId}/rate`, {
        method: 'POST',
        token,
        body: JSON.stringify({ rating: stars, ...(review ? { review } : {}) }),
      });
      setOrder(updated);
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отправить оценку');
    } finally {
      ratingSubmittingRef.current = false;
      setRatingSubmitting(false);
    }
  }, [orderId, token]);

  return {
    order,
    loading,
    wsConnected,
    dispatchState,
    medicLocation,
    ratingSubmitting,
    cancelOrder,
    submitRating,
    fetchOrder,
  };
}

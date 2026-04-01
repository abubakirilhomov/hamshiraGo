import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSharedSocket } from '@/context/SocketContext';
import type { DispatchInvitePayload } from '@/components/OrderInviteModal';
import type { OrderLocation } from '@/types/order';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AvailableOrder {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  location: OrderLocation | null;
  created_at: string;
}

export interface UseMedicOrderFeedReturn {
  orders: AvailableOrder[];
  loading: boolean;
  refreshing: boolean;
  wsConnected: boolean;
  bannerOrder: AvailableOrder | null;
  invite: DispatchInvitePayload | null;
  acceptModal: string | null;
  acceptError: string | null;
  fetchError: string | null;
  fetchOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  dismissBanner: () => void;
  setAcceptModal: (orderId: string | null) => void;
  setAcceptError: (error: string | null) => void;
  setInvite: (invite: DispatchInvitePayload | null) => void;
  onRefresh: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMedicOrderFeed(): UseMedicOrderFeedReturn {
  const { token } = useAuth();
  const { socket, connected: wsConnected } = useSharedSocket();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerOrder, setBannerOrder] = useState<AvailableOrder | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [invite, setInvite] = useState<DispatchInvitePayload | null>(null);
  const [acceptModal, setAcceptModal] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // ── Send location to backend (so dispatch can find this medic) ───────────────
  const pushLocation = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await apiFetch('/medics/location', {
        method: 'PATCH',
        token: tokenRef.current,
        body: JSON.stringify({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      });
    } catch {
      // silent — don't block UI
    }
  }, []);

  // ── Fetch orders ────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<AvailableOrder[]>('/orders/medic/available', {
        token: token ?? undefined,
      });
      setOrders(data);
      setFetchError(null);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : t('common.error'));
    }
  }, [token, t]);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // ── WebSocket (uses shared socket from SocketContext) ────────────────────────

  useEffect(() => {
    if (!token || !socket) return;

    // Request notification permission (for dev build / Android in Expo Go)
    Notifications.requestPermissionsAsync().catch(() => {});

    // Send location immediately so dispatch can find this medic
    if (wsConnected) pushLocation();

    const onNewOrder = (order: AvailableOrder) => {
      // Add to list if not already present
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      // 1) Haptic feedback — works in Expo Go on both platforms
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      // 2) Show in-app banner
      setBannerOrder(order);

      // 3) System notification with sound (works in dev build; partial in Expo Go Android)
      Notifications.scheduleNotificationAsync({
        content: {
          title: '\u{1F6A8} Новый заказ!',
          body: `${order.serviceTitle} — ${(order.priceAmount - (order.discountAmount ?? 0)).toLocaleString('ru-RU')} UZS`,
          sound: 'default',
          data: { orderId: order.id },
          ...(Platform.OS === 'android' ? { channelId: 'new_orders' } : {}),
        },
        trigger: null,
      }).catch(() => {}); // silently fail in Expo Go
    };

    // ── Dispatch invite (push-based assignment) ──────────────────────────────
    const onDispatchInvite = (payload: DispatchInvitePayload) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setInvite(payload);
    };

    const onDispatchExpired = (payload: { orderId: string }) => {
      setInvite((prev) => (prev?.orderId === payload.orderId ? null : prev));
    };

    socket.on('new_order', onNewOrder);
    socket.on('dispatch_invite', onDispatchInvite);
    socket.on('dispatch_invite_expired', onDispatchExpired);

    // Update location every 2 minutes so dispatch stays aware of medic position
    locationIntervalRef.current = setInterval(pushLocation, 2 * 60 * 1000);

    return () => {
      socket.off('new_order', onNewOrder);
      socket.off('dispatch_invite', onDispatchInvite);
      socket.off('dispatch_invite_expired', onDispatchExpired);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [token, socket, wsConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accept order ─────────────────────────────────────────────────────────────

  const acceptOrder = useCallback(async (orderId: string) => {
    // DON'T close modal/banner yet — wait for API response
    try {
      await apiFetch(`/orders/${orderId}/accept`, {
        method: 'POST',
        token: token ?? undefined,
      });
      // Only dismiss UI on success:
      setAcceptModal(null);
      setBannerOrder(null);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      // NOTE: Don't clear locationIntervalRef here — location pushes are useful
      // even during an active order (dispatch visibility, medic tracking).
    } catch (e: unknown) {
      setAcceptError(e instanceof Error ? e.message : t('common.error'));
      // DON'T throw — let UI stay open so medic can retry
    }
  }, [token, t]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // ── Dismiss banner ────────────────────────────────────────────────────────

  const dismissBanner = useCallback(() => {
    setBannerOrder(null);
  }, []);

  return {
    orders,
    loading,
    refreshing,
    wsConnected,
    bannerOrder,
    invite,
    acceptModal,
    acceptError,
    fetchError,
    fetchOrders,
    acceptOrder,
    dismissBanner,
    setAcceptModal,
    setAcceptError,
    setInvite,
    onRefresh,
  };
}

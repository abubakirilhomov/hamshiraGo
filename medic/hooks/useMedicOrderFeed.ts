import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
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
  const { t } = useTranslation();

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [bannerOrder, setBannerOrder] = useState<AvailableOrder | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [invite, setInvite] = useState<DispatchInvitePayload | null>(null);
  const [acceptModal, setAcceptModal] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

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

  // ── WebSocket ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    // Request notification permission (for dev build / Android in Expo Go)
    Notifications.requestPermissionsAsync().catch(() => {});

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('new_order', (order: AvailableOrder) => {
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
          title: '🚨 Новый заказ!',
          body: `${order.serviceTitle} — ${(order.priceAmount - (order.discountAmount ?? 0)).toLocaleString('ru-RU')} UZS`,
          sound: 'default',
          data: { orderId: order.id },
          ...(Platform.OS === 'android' ? { channelId: 'new_orders' } : {}),
        },
        trigger: null,
      }).catch(() => {}); // silently fail in Expo Go
    });

    // ── Dispatch invite (push-based assignment) ──────────────────────────────
    socket.on('dispatch_invite', (payload: DispatchInvitePayload) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setInvite(payload);
    });

    socket.on('dispatch_invite_expired', (payload: { orderId: string }) => {
      setInvite((prev) => (prev?.orderId === payload.orderId ? null : prev));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accept order ─────────────────────────────────────────────────────────────

  const acceptOrder = useCallback(async (orderId: string) => {
    setAcceptModal(null);
    setBannerOrder(null);
    try {
      await apiFetch(`/orders/${orderId}/accept`, {
        method: 'POST',
        token: token ?? undefined,
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e: unknown) {
      setAcceptError(e instanceof Error ? e.message : t('common.error'));
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

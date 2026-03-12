/**
 * useOrderStatus — handles initial order fetch, WebSocket subscription,
 * order state management, status update (medic-status), and persistent
 * background notifications for the medic.
 *
 * Returns: { order, loading, wsConnected, updateOrderStatus, fetchOrder }
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import type { OrderStatus, OrderLocation } from '@/types/order';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderDetail {
  id: string;
  serviceTitle: string;
  serviceId: string;
  priceAmount: number;
  discountAmount: number;
  platformFee: number;
  status: OrderStatus;
  location: OrderLocation | null;
  created_at: string;
}

// ── Notification helpers ───────────────────────────────────────────────────────

const MEDIC_NOTIF_ID = 'hamshirago-medic-order';
const ACTIVE_MEDIC_STATUSES: OrderStatus[] = [
  'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED',
];

function getMedicNotifContent(
  order: OrderDetail,
): { title: string; body: string } | null {
  const addr = order.location?.house ?? '';
  switch (order.status) {
    case 'ASSIGNED':
      return { title: '📋 Новый заказ назначен', body: `Услуга: ${order.serviceTitle}. Адрес: ${addr}` };
    case 'ACCEPTED':
      return { title: '✅ Заказ принят', body: `Вы приняли заказ. Адрес клиента: ${addr}` };
    case 'ON_THE_WAY':
      return { title: '🚗 Вы в пути', body: `Едете к клиенту. Адрес: ${addr}` };
    case 'ARRIVED':
      return { title: '📍 Вы прибыли', body: `Вы у клиента. Начните услугу.` };
    case 'SERVICE_STARTED':
      return { title: '🩺 Услуга идёт', body: `Оказываете услугу: ${order.serviceTitle}` };
    default:
      return null;
  }
}

// ── Next-status map ────────────────────────────────────────────────────────────

export const NEXT_STATUS_MAP: Partial<
  Record<OrderStatus, { status: OrderStatus; labelKey: string }>
> = {
  // ASSIGNED → ACCEPTED is handled automatically in [id].tsx (no button needed)
  ACCEPTED:        { status: 'ON_THE_WAY',      labelKey: 'orders.onTheWay' },
  ON_THE_WAY:      { status: 'ARRIVED',         labelKey: 'orders.arrived' },
  ARRIVED:         { status: 'SERVICE_STARTED', labelKey: 'orders.startService' },
  SERVICE_STARTED: { status: 'DONE',            labelKey: 'orders.completeOrder' },
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrderStatus(orderId: string | undefined) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const orderRef = useRef<OrderDetail | null>(null);

  // Keep orderRef in sync for AppState handler (avoids stale closure)
  useEffect(() => { orderRef.current = order; }, [order]);

  // ── Fetch order ──────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await apiFetch<OrderDetail>(`/orders/${orderId}`, {
        token: token ?? undefined,
      });
      setOrder(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить заказ');
      router.back();
    }
  }, [orderId, token, router]);

  useEffect(() => {
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !orderId) return;

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('order_status', (payload: { orderId: string; status: OrderStatus }) => {
      if (payload.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [token, orderId]);

  // ── Status update ────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(
    (updatingCb: (v: boolean) => void) => {
      if (!order) return;
      const next = NEXT_STATUS_MAP[order.status];
      if (!next) return;

      const isDone = next.status === 'DONE';

      const doUpdate = async () => {
        updatingCb(true);
        try {
          const updated = await apiFetch<OrderDetail>(
            `/orders/${order.id}/medic-status`,
            {
              method: 'PATCH',
              token: token ?? undefined,
              body: JSON.stringify({ status: next.status }),
            },
          );
          setOrder(updated);
          if (next.status === 'DONE') {
            const net = updated.priceAmount - (updated.discountAmount ?? 0);
            const fee = updated.platformFee ?? Math.round(net * 0.1);
            const earned = net - fee;
            Alert.alert(
              `${t('orders.completeOrder')} ✓`,
              `${t('orders.netEarnings')}:\n+${earned.toLocaleString('ru-RU')} ${t('common.sum')}`,
              [{ text: 'OK', onPress: () => router.replace('/(tabs)/my-orders') }],
            );
          }
        } catch (e: unknown) {
          Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
        } finally {
          updatingCb(false);
        }
      };

      if (isDone) {
        Alert.alert(t('common.save'), `${t('orders.completeOrder')}?`, [
          { text: t('common.back'), style: 'cancel' },
          { text: t('orders.completeOrder'), style: 'destructive', onPress: doUpdate },
        ]);
      } else {
        doUpdate();
      }
    },
    [order, token, t, router],
  );

  // ── Notifications: dismiss when done/canceled ─────────────────────────────────
  useEffect(() => {
    if (order?.status === 'DONE' || order?.status === 'CANCELED') {
      Notifications.dismissNotificationAsync(MEDIC_NOTIF_ID).catch(() => {});
    }
  }, [order?.status]);

  // ── Notifications: persistent background notification ─────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const current = orderRef.current;
      if (
        state === 'background' &&
        current &&
        ACTIVE_MEDIC_STATUSES.includes(current.status)
      ) {
        const content = getMedicNotifContent(current);
        if (content) {
          Notifications.scheduleNotificationAsync({
            identifier: MEDIC_NOTIF_ID,
            content: {
              title: content.title,
              body: content.body,
              sound: false,
              data: { orderId: current.id },
            },
            trigger: null,
          }).catch(() => {});
        }
      } else if (state === 'active') {
        Notifications.dismissNotificationAsync(MEDIC_NOTIF_ID).catch(() => {});
      }
    });

    return () => {
      sub.remove();
      Notifications.dismissNotificationAsync(MEDIC_NOTIF_ID).catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { order, loading, wsConnected, socketRef, updateOrderStatus, fetchOrder };
}

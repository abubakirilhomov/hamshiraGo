import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { OrderStatus, ACTIVE_STATUSES } from '@/types/order';
import { ORDERS_PAGE_LIMIT } from '@/constants/config';
import OrderCard, { OrderCardItem } from '@/components/OrderCard';

type Order = OrderCardItem;

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const subscribedRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (offset = 0) => {
    try {
      const res = await apiFetch<{ data: Order[]; total: number }>(
        `/orders?limit=${ORDERS_PAGE_LIMIT}&offset=${offset}`,
        { token: token ?? undefined },
      );
      const data = res.data;
      if (offset === 0) {
        setOrders(data);
      } else {
        setOrders((prev) => [...prev, ...data]);
      }
      setHasMore(offset + data.length < res.total);
      setError(null);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('orders.loadError'));
      return [];
    }
  }, [token]);

  // ── WebSocket: listen for order status updates on the shared socket ─────────
  useEffect(() => {
    if (!socket) return;

    const handler = ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    };
    socket.on('order_status', handler);

    return () => {
      socket.off('order_status', handler);
      subscribedRef.current.clear();
    };
  }, [socket]);

  // Subscribe to each active order once it appears in the list
  useEffect(() => {
    if (!socket) return;
    orders.forEach((o) => {
      if (ACTIVE_STATUSES.includes(o.status) && !subscribedRef.current.has(o.id)) {
        socket.emit('subscribe_order', o.id);
        subscribedRef.current.add(o.id);
      }
    });
  }, [orders, socket]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // Also refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(0);
    setRefreshing(false);
  }, [fetchOrders]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchOrders(orders.length);
    setLoadingMore(false);
  }, [loadingMore, hasMore, orders.length, fetchOrders]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('orders.myOrders')}</Text>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <FontAwesome name="sign-out" size={18} color={Theme.textSecondary} />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchOrders()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('orders.retry')}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <FontAwesome name="clipboard" size={48} color={Theme.border} />
              <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
              <Text style={styles.emptyHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
                {t('orders.emptyHint')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <OrderCard order={item} isActive={ACTIVE_STATUSES.includes(item.status)} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color={Theme.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.text,
  },
  logoutBtn: {
    padding: 8,
  },
  errorBox: {
    margin: 16,
    backgroundColor: `${Theme.error}12`,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Theme.error,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

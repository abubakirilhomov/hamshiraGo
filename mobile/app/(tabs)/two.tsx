import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { OrderStatus, ACTIVE_STATUSES } from '@/types/order';
import { ORDERS_PAGE_LIMIT } from '@/constants/config';
import OrderCard, { OrderCardItem } from '@/components/OrderCard';
import { SkeletonOrderCard } from '@/components/SkeletonLoader';
import { cacheSet, cacheGetStale } from '@/utils/cache';

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
  const [fromCache, setFromCache] = useState(false);
  const { socket } = useSocket();
  const subscribedRef = useRef<Set<string>>(new Set());

  const ORDERS_CACHE_KEY = 'orders';

  const fetchOrders = useCallback(async (offset = 0) => {
    try {
      const res = await apiFetch<{ data: Order[]; total: number }>(
        `/orders?limit=${ORDERS_PAGE_LIMIT}&offset=${offset}`,
        { token: token ?? undefined },
      );
      const data = res.data;
      if (offset === 0) {
        setOrders(data);
        setFromCache(false);
        await cacheSet(ORDERS_CACHE_KEY, data);
      } else {
        setOrders((prev) => [...prev, ...data]);
      }
      setHasMore(offset + data.length < res.total);
      setError(null);
      return data;
    } catch (e: unknown) {
      // On first page failure, try cache fallback
      if (offset === 0) {
        try {
          const cached = await cacheGetStale<Order[]>(ORDERS_CACHE_KEY);
          if (cached && cached.length > 0) {
            setOrders(cached);
            setFromCache(true);
            setHasMore(false);
            return cached;
          }
        } catch {
          // ignore cache read errors
        }
      }
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard order={item} isActive={ACTIVE_STATUSES.includes(item.status)} />
    ),
    [],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t('orders.myOrders')}</Text>
        </View>
        <View style={styles.listContent}>
          <SkeletonOrderCard />
          <SkeletonOrderCard />
          <SkeletonOrderCard />
        </View>
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

      {fromCache && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>{t('common.cachedData')}</Text>
        </View>
      )}

      <FlashList
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
        renderItem={renderItem}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.text,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  errorBox: {
    margin: Spacing.lg,
    backgroundColor: `${Theme.error}12`,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Theme.error,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.sm,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
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
  cacheBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: `${Theme.warning}20`,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Theme.warning}40`,
  },
  cacheBannerText: {
    fontSize: 13,
    color: '#854d0e',
    textAlign: 'center',
    fontWeight: '500',
  },
});

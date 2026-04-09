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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { OrderStatus, ACTIVE_STATUSES } from '@/types/order';
import { ORDERS_PAGE_LIMIT } from '@/constants/config';
import { SkeletonOrderCard } from '@/components/SkeletonLoader';
import { cacheSet, cacheGetStale } from '@/utils/cache';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface OrderLocation {
  house: string;
  floor: string | null;
  apartment: string | null;
  phone: string;
}

interface Order {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  status: OrderStatus;
  cancelReason?: string | null;
  location: OrderLocation | null;
  created_at: string;
  isUrgent?: boolean;
}

type FilterKey = 'ALL' | 'ACTIVE' | 'DONE';

/* ── Status helpers ────────────────────────────────────────────────────── */

const STATUS_BADGE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DONE:             { bg: Theme.successContainer, text: Theme.success, label: 'YAKUNLANDI' },
  CREATED:          { bg: Theme.surfaceContainerLow, text: Theme.textSecondary, label: 'YARATILGAN' },
  ASSIGNED:         { bg: Theme.warningContainer, text: Theme.warning, label: 'JARAYONDA' },
  ACCEPTED:         { bg: Theme.warningContainer, text: Theme.warning, label: 'JARAYONDA' },
  ON_THE_WAY:       { bg: Theme.warningContainer, text: Theme.warning, label: 'JARAYONDA' },
  ARRIVED:          { bg: Theme.warningContainer, text: Theme.warning, label: 'JARAYONDA' },
  SERVICE_STARTED:  { bg: Theme.warningContainer, text: Theme.warning, label: 'JARAYONDA' },
  CANCELED:         { bg: Theme.errorContainer, text: Theme.error, label: 'BEKOR QILINGAN' },
};

const SERVICE_ICON_COLOR: Record<number, string> = {
  0: '#006860',
  1: '#0284C7',
  2: '#8B5CF6',
  3: '#F59E0B',
};

/* ── Component ─────────────────────────────────────────────────────────── */

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const { socket } = useSocket();
  const subscribedRef = useRef<Set<string>>(new Set());

  const ORDERS_CACHE_KEY = 'orders';
  const fetchOrdersRef = useRef<(offset?: number) => Promise<Order[]>>(null!);

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
      if (offset === 0) {
        try {
          const cached = await cacheGetStale<Order[]>(ORDERS_CACHE_KEY);
          if (cached && cached.length > 0) {
            setOrders(cached);
            setFromCache(true);
            setHasMore(false);
            return cached;
          }
        } catch {}
      }
      setError(e instanceof Error ? e.message : t('orders.loadError'));
      return [];
    }
  }, [token]);

  fetchOrdersRef.current = fetchOrders;

  /* ── WebSocket ── */
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
      subscribedRef.current.forEach((id) => {
        socket.emit('unsubscribe_order', { orderId: id });
      });
      subscribedRef.current.clear();
    };
  }, [socket]);

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

  useFocusEffect(
    useCallback(() => {
      fetchOrdersRef.current?.(0);
    }, []),
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

  /* ── Filter logic ── */
  const filteredOrders = orders.filter((o) => {
    if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'DONE') return o.status === 'DONE' || o.status === 'CANCELED';
    return true;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'Barchasi' },
    { key: 'ACTIVE', label: 'Faol' },
    { key: 'DONE', label: 'Tugatilgan' },
  ];

  /* ── Render order card ── */
  const renderItem = useCallback(
    ({ item, index }: { item: Order; index: number }) => {
      const finalPrice = item.priceAmount - (item.discountAmount ?? 0);
      const badge = STATUS_BADGE_STYLE[item.status] ?? STATUS_BADGE_STYLE.CREATED;
      const iconColor = SERVICE_ICON_COLOR[index % 4] ?? Theme.primary;
      const date = new Date(item.created_at);
      const dateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <Pressable
          style={({ pressed }) => [styles.orderCard, pressed && { opacity: 0.85 }]}
          onPress={() => {
            const { router } = require('expo-router');
            router.push({ pathname: '/order/track', params: { orderId: item.id } });
          }}
        >
          {/* Left icon */}
          <View style={[styles.orderIconCircle, { backgroundColor: `${iconColor}15` }]}>
            <FontAwesome name="medkit" size={18} color={iconColor} />
          </View>

          {/* Middle */}
          <View style={styles.orderMiddle}>
            <Text style={styles.orderTitle} numberOfLines={1}>{item.serviceTitle}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>

          {/* Right */}
          <View style={styles.orderRight}>
            <Text style={styles.orderPrice}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
            <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusPillText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [],
  );

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>{t('orders.myOrders')}</Text>
          <Text style={styles.headerSubtitle}>
            Sizning barcha tibbiy xizmatlaringiz tarixi va joriy holati
          </Text>
        </View>
        <View style={{ paddingHorizontal: Spacing.lg, gap: 12 }}>
          <SkeletonOrderCard />
          <SkeletonOrderCard />
          <SkeletonOrderCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Buyurtmalar</Text>
        <Text style={styles.headerSubtitle}>
          Sizning barcha tibbiy xizmatlaringiz tarixi va joriy holati
        </Text>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterPill,
              filter === f.key && styles.filterPillActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === f.key && styles.filterPillTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
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
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredOrders.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <FontAwesome name="clipboard" size={48} color={Theme.textTertiary} />
              <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
              <Text style={styles.emptyHint}>
                {t('orders.emptyHint')}
              </Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} color={Theme.primary} /> : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  /* Header */
  headerSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  /* Filter pills */
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
  },
  filterPillActive: {
    backgroundColor: Theme.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  filterPillTextActive: {
    color: '#fff',
  },

  /* Error */
  errorBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.inter,
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
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },

  /* Cache banner */
  cacheBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Theme.warningContainer,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  cacheBannerText: {
    fontSize: 13,
    color: '#854d0e',
    textAlign: 'center',
    fontFamily: Fonts.interMd,
  },

  /* List */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },

  /* Order card */
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  orderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMiddle: {
    flex: 1,
    gap: 2,
  },
  orderTitle: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderPrice: {
    fontSize: 15,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: Fonts.interSb,
    letterSpacing: 0.3,
  },

  /* Empty state */
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

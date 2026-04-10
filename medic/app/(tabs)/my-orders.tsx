import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { type OrderStatus, ACTIVE_STATUSES } from '@/types/order';
import { SkeletonMyOrderCard } from '@/components/SkeletonLoader';
import { cacheSet, cacheGetStale } from '@/utils/cache';

interface Order {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  status: OrderStatus;
  location: { house: string; floor: string | null; apartment: string | null } | null;
  created_at: string;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED: Theme.statusCreated,
  ASSIGNED: Theme.statusAssigned,
  ACCEPTED: Theme.statusAccepted,
  ON_THE_WAY: Theme.statusOnTheWay,
  ARRIVED: Theme.statusArrived,
  SERVICE_STARTED: Theme.statusStarted,
  DONE: Theme.statusDone,
  CANCELED: Theme.statusCanceled,
};

type FilterTab = 'active' | 'done';

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('active');

  const MEDIC_ORDERS_CACHE_KEY = 'medic_orders';

  const fetchOrders = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await apiFetch<{ data: Order[] }>('/orders/medic/my?limit=50', {
        token: token ?? undefined,
      });
      setOrders(res.data);
      setFromCache(false);
      await cacheSet(MEDIC_ORDERS_CACHE_KEY, res.data);
    } catch (e: unknown) {
      // Try cache fallback on failure
      try {
        const cached = await cacheGetStale<Order[]>(MEDIC_ORDERS_CACHE_KEY);
        if (cached && cached.length > 0) {
          setOrders(cached);
          setFromCache(true);
          return;
        }
      } catch {
        // ignore cache read errors
      }
      setFetchError(e instanceof Error ? e.message : t('orders.fetchError'));
    }
  }, [token, t]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // Refetch when tab comes into focus (picks up status changes from order detail screen)
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const active = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)), [orders]);
  const history = useMemo(() => orders.filter((o) => !ACTIVE_STATUSES.includes(o.status)), [orders]);
  const filteredData = filter === 'active' ? active : history;

  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        onPress={() => router.push(`/order/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.serviceTitle} numberOfLines={1}>{item.serviceTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status]}18` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
              {t(`orders.status.${item.status}`)}
            </Text>
          </View>
        </View>
        {item.location && (
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={12} color={Theme.textTertiary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location.house}
              {item.location.floor ? `, ${t('orders.floor')} ${item.location.floor}` : ''}
            </Text>
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {(item.priceAmount - (item.discountAmount ?? 0)).toLocaleString('ru-RU')} UZS
          </Text>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </View>
      </Pressable>
    ),
    [t, router],
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>{t('orders.my')}</Text>
        </View>
        <View style={styles.listContent}>
          <SkeletonMyOrderCard />
          <SkeletonMyOrderCard />
          <SkeletonMyOrderCard />
          <SkeletonMyOrderCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.headerTitle}>{t('orders.my')}</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterPillText, filter === 'active' && styles.filterPillTextActive]}>
            {t('orders.active')} ({active.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, filter === 'done' && styles.filterPillActive]}
          onPress={() => setFilter('done')}
        >
          <Text style={[styles.filterPillText, filter === 'done' && styles.filterPillTextActive]}>
            {t('orders.history')} ({history.length})
          </Text>
        </Pressable>
      </View>

      <FlashList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredData.length === 0 && !fetchError ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListHeaderComponent={
          <>
            {fetchError && (
              <View style={styles.fetchErrorBox}>
                <Text style={styles.fetchErrorText}>{fetchError}</Text>
                <Pressable onPress={() => fetchOrders()} style={styles.fetchRetryBtn}>
                  <Text style={styles.fetchRetryText}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            )}
            {fromCache && (
              <View style={styles.cacheBanner}>
                <Text style={styles.cacheBannerText}>{t('common.cachedData')}</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !fetchError ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <FontAwesome6 name="clipboard-list" size={40} color={Theme.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>{t('orders.emptyMy')}</Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },

  headerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: Typography.h2.fontSize,
    color: Theme.text,
  },

  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
  },
  filterPillActive: {
    backgroundColor: Theme.primary,
  },
  filterPillText: {
    fontFamily: Fonts.interSb,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
  },
  filterPillTextActive: {
    color: Theme.textInverse,
  },

  listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.h3.fontSize,
    color: Theme.text,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  serviceTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: Fonts.interSb,
    fontSize: 11,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontFamily: Fonts.manropeBd,
    fontSize: Typography.body.fontSize,
    color: Theme.primary,
  },

  fetchErrorBox: {
    marginBottom: Spacing.md,
    padding: 14,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fetchErrorText: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.error,
  },
  fetchRetryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.full,
  },
  fetchRetryText: {
    fontFamily: Fonts.interSb,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textInverse,
  },
  cacheBanner: {
    marginBottom: Spacing.sm,
    backgroundColor: Theme.warningContainer,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  cacheBannerText: {
    fontFamily: Fonts.interMd,
    fontSize: Typography.bodySmall.fontSize,
    color: '#854d0e',
    textAlign: 'center',
  },
});

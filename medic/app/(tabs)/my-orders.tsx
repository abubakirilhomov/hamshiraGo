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
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
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

// STATUS_LABEL resolved via t() in the component

const STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED: Theme.primary,
  ASSIGNED: Theme.warning,
  ACCEPTED: Theme.warning,
  ON_THE_WAY: Theme.warning,
  ARRIVED: Theme.warning,
  SERVICE_STARTED: Theme.accent,
  DONE: Theme.success,
  CANCELED: Theme.error,
};

export default function MyOrdersScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

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
  const sortedData = useMemo(() => [...active, ...history], [active, history]);

  const renderItem = useCallback(
    ({ item, index }: { item: Order; index: number }) => (
      <>
        {index === active.length && history.length > 0 && (
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('orders.history')}</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(`/order/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.serviceTitle}>{item.serviceTitle}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status]}18` }]}>
              <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                {t(`orders.status.${item.status}`)}
              </Text>
            </View>
          </View>
          {item.location && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={12} color={Theme.textSecondary} />
              <Text style={styles.locationText}>
                {item.location.house}
                {item.location.floor ? `, ${t('orders.floor')} ${item.location.floor}` : ''}
              </Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.price}>
              {(item.priceAmount - (item.discountAmount ?? 0)).toLocaleString('ru-RU')} UZS
            </Text>
            <FontAwesome name="chevron-right" size={13} color={Theme.textSecondary} />
          </View>
        </Pressable>
      </>
    ),
    [active.length, history.length, t, router],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.listContent]}>
        <SkeletonMyOrderCard />
        <SkeletonMyOrderCard />
        <SkeletonMyOrderCard />
        <SkeletonMyOrderCard />
      </View>
    );
  }

  return (
    <FlashList
      data={sortedData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={orders.length === 0 && !fetchError ? styles.emptyContainer : styles.listContent}
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
          {active.length > 0 ? (
            <Text style={styles.sectionTitle}>{t('orders.active')}</Text>
          ) : null}
        </>
      }
      ListEmptyComponent={
        !fetchError ? (
          <View style={styles.empty}>
            <FontAwesome name="briefcase" size={48} color={Theme.border} />
            <Text style={styles.emptyTitle}>{t('orders.emptyMy')}</Text>
          </View>
        ) : null
      }
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  listContent: { padding: Spacing.lg, gap: Spacing.sm },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingTop: 80 },
  emptyTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },
  sectionTitle: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: Theme.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardPressed: { opacity: 0.9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  serviceTitle: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Theme.text, flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.xl },
  statusText: { fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  locationText: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.primary },
  fetchErrorBox: {
    marginBottom: Spacing.md,
    padding: 14,
    backgroundColor: '#fee2e220',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#ef444440',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fetchErrorText: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.error,
  },
  fetchRetryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.sm,
  },
  fetchRetryText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
  cacheBanner: {
    marginBottom: Spacing.sm,
    backgroundColor: `${Theme.warning}20`,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Theme.warning}40`,
  },
  cacheBannerText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#854d0e',
    textAlign: 'center',
    fontWeight: '500',
  },
});

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { type OrderStatus, ACTIVE_STATUSES } from '@/types/order';

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

  const fetchOrders = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await apiFetch<{ data: Order[] }>('/orders/medic/my?limit=50', {
        token: token ?? undefined,
      });
      setOrders(res.data);
    } catch (e: unknown) {
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

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const history = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={orders.length === 0 && !fetchError ? styles.emptyContainer : styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
      }
      data={[...active, ...history]}
      keyExtractor={(item) => item.id}
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
      renderItem={({ item, index }) => (
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
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: 14, color: Theme.textSecondary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardPressed: { opacity: 0.9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceTitle: { fontSize: 15, fontWeight: '600', color: Theme.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  locationText: { fontSize: 13, color: Theme.textSecondary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '700', color: Theme.primary },
  fetchErrorBox: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#fee2e220',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef444440',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fetchErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },
  fetchRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  fetchRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

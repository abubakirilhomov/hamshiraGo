import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface PrescriptionItem {
  id: string;
  serviceTitle: string;
  servicePrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';
  doctorNotes: string | null;
  createdAt: string;
  expiresAt: string;
  orderId: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  CONFIRMED: { bg: '#D1FAE5', text: '#065F46' },
  CANCELED: { bg: '#FEE2E2', text: '#991B1B' },
  EXPIRED: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function PrescriptionsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [data, setData] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPrescriptions = useCallback(
    async (p = 1) => {
      if (!token) return;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await apiFetch(
          `/consultations/prescriptions/my?page=${p}&limit=20`,
          token,
        );
        if (!res.ok) return;
        const json = await res.json();
        if (p === 1) setData(json.data);
        else setData((prev) => [...prev, ...json.data]);
        setTotal(json.total);
        setPage(p);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      fetchPrescriptions(1);
    }, [fetchPrescriptions]),
  );

  const handleLoadMore = () => {
    if (loadingMore || data.length >= total) return;
    fetchPrescriptions(page + 1);
  };

  const renderItem = ({ item }: { item: PrescriptionItem }) => {
    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.EXPIRED;
    const isExpired =
      item.status === 'PENDING' && new Date() > new Date(item.expiresAt);

    return (
      <Pressable
        style={[s.card, Shadow.sm]}
        onPress={() => {
          if (item.status === 'CONFIRMED' && item.orderId) {
            router.push({ pathname: '/order/track', params: { orderId: item.orderId } });
          } else if (item.status === 'PENDING' && !isExpired) {
            router.push({ pathname: '/prescription', params: { id: item.id } });
          }
        }}
      >
        <View style={s.cardHeader}>
          <FontAwesome name="stethoscope" size={18} color={Theme.primary} />
          <Text style={s.serviceTitle}>{item.serviceTitle}</Text>
          <View style={[s.badge, { backgroundColor: isExpired ? STATUS_COLORS.EXPIRED.bg : colors.bg }]}>
            <Text style={[s.badgeText, { color: isExpired ? STATUS_COLORS.EXPIRED.text : colors.text }]}>
              {isExpired
                ? t('prescription.statusExpired')
                : t(`prescription.status${item.status.charAt(0) + item.status.slice(1).toLowerCase()}`)}
            </Text>
          </View>
        </View>
        <Text style={s.price}>{item.servicePrice.toLocaleString()} UZS</Text>
        <Text style={s.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={s.flex}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={100}
        contentContainerStyle={{ padding: Spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={s.center}>
            <FontAwesome name="file-text-o" size={48} color="#D1D5DB" />
            <Text style={s.emptyText}>{t('prescription.noPrescriptions')}</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ paddingVertical: Spacing.md }} color={Theme.primary} />
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  serviceTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  price: { fontSize: 14, fontWeight: '600', color: Theme.primary, marginTop: 4 },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  emptyText: { fontSize: 16, color: '#6B7280' },
});

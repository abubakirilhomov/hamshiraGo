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
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

type ConsultationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'DECLINED';

interface Consultation {
  id: string;
  symptoms: string;
  priceAmount: number;
  status: ConsultationStatus;
  created_at: string;
  completedAt?: string;
  doctorNotes?: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: Theme.warning,
  ACCEPTED: Theme.info,
  IN_PROGRESS: Theme.accent,
  COMPLETED: Theme.success,
  CANCELED: Theme.error,
  DECLINED: Theme.textSecondary,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  ACCEPTED: 'Qabul qilingan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Yakunlangan',
  CANCELED: 'Bekor qilingan',
  DECLINED: 'Rad etilgan',
};

const ACTIVE_STATUSES: string[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

export default function MyPatientsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchConsultations = useCallback(async (pageNum = 1) => {
    try {
      setError(null);
      const res = await apiFetch<{ data: Consultation[]; total: number }>(
        `/consultations/doctor/my?page=${pageNum}&limit=20`,
        { token: token ?? undefined },
      );
      const data = Array.isArray(res) ? res : (res.data ?? []);
      if (pageNum === 1) {
        setConsultations(data);
      } else {
        setConsultations((prev) => [...prev, ...data]);
      }
      setHasMore(data.length >= 20);
      setPage(pageNum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchConsultations(1).finally(() => setLoading(false));
  }, [fetchConsultations]);

  useFocusEffect(
    useCallback(() => {
      fetchConsultations(1);
    }, [fetchConsultations]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConsultations(1);
    setRefreshing(false);
  }, [fetchConsultations]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchConsultations(page + 1);
    }
  }, [hasMore, loading, page, fetchConsultations]);

  const active = useMemo(
    () => consultations.filter((c) => ACTIVE_STATUSES.includes(c.status)),
    [consultations],
  );
  const history = useMemo(
    () => consultations.filter((c) => !ACTIVE_STATUSES.includes(c.status)),
    [consultations],
  );
  const sortedData = useMemo(() => [...active, ...history], [active, history]);

  const renderItem = useCallback(
    ({ item, index }: { item: Consultation; index: number }) => (
      <>
        {index === active.length && history.length > 0 && (
          <Text style={styles.sectionTitle}>Tarix</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          onPress={() => router.push(`/doctor-consultation/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.symptomsText} numberOfLines={2}>
                {item.symptoms || 'Simptomlar ko\'rsatilmagan'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status] ?? Theme.textSecondary}18` }]}>
              <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? Theme.textSecondary }]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
          </View>

          {item.client && (
            <View style={styles.infoRow}>
              <FontAwesome name="user-o" size={12} color={Theme.textSecondary} />
              <Text style={styles.infoText}>{item.client.name}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.price}>
              {(item.priceAmount ?? 0).toLocaleString('uz-UZ')} UZS
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('uz-UZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Pressable>
      </>
    ),
    [active.length, history.length, router],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <FlashList
      data={sortedData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={consultations.length === 0 && !error ? styles.emptyContainer : styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
      }
      ListHeaderComponent={
        <>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => fetchConsultations(1)} style={styles.retryBtn}>
                <Text style={styles.retryText}>Qayta urinish</Text>
              </Pressable>
            </View>
          )}
          {active.length > 0 && (
            <Text style={styles.sectionTitle}>Faol</Text>
          )}
        </>
      }
      ListEmptyComponent={
        !error ? (
          <View style={styles.empty}>
            <FontAwesome name="users" size={48} color={Theme.border} />
            <Text style={styles.emptyTitle}>Bemorlar yo'q</Text>
            <Text style={styles.emptyHint}>Konsultatsiyalar tarixi bu yerda ko'rinadi</Text>
          </View>
        ) : null
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      renderItem={renderItem}
      estimatedItemSize={130}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  listContent: { padding: Spacing.lg, gap: Spacing.sm },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  sectionTitle: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  symptomsText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Theme.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  infoText: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.primary },
  dateText: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary },

  errorBox: {
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
  errorText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: Theme.error },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.sm,
  },
  retryText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: '#fff' },
});

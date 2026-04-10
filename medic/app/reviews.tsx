import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface ReviewOrder {
  id: string;
  serviceTitle: string;
  clientRating: number;
  clientReview: string;
  created_at: string;
}

interface OrderListItem {
  id: string;
  serviceTitle: string;
  clientRating: number | null;
  clientReview: string | null;
  created_at: string;
}

export default function ReviewsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<ReviewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await apiFetch<{ data: OrderListItem[] }>('/orders/medic/my?status=DONE&limit=100', {
        token: token ?? undefined,
      });
      const withReviews = res.data.filter(
        (o): o is ReviewOrder =>
          o.clientReview != null && o.clientReview.trim().length > 0 && o.clientRating != null,
      );
      setReviews(withReviews);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : t('common.error'));
    }
  }, [token, t]);

  useEffect(() => {
    setLoading(true);
    fetchReviews().finally(() => setLoading(false));
  }, [fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  }, [fetchReviews]);

  /* ── Average rating ────────────────────────────────────────── */
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.clientRating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sharhlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={reviews.length === 0 && !fetchError ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        data={reviews}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          avgRating ? (
            <View style={styles.avgCard}>
              <Text style={styles.avgValue}>{avgRating}</Text>
              <View style={styles.avgStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name={star <= Math.round(Number(avgRating)) ? 'star' : 'star-o'}
                    size={18}
                    color={Theme.warning}
                  />
                ))}
              </View>
              <Text style={styles.avgCount}>{reviews.length} {t('review.reviews', { defaultValue: 'sharh' })}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !fetchError ? (
            <View style={styles.empty}>
              <FontAwesome name="star-o" size={48} color={Theme.surfaceContainerHigh} />
              <Text style={styles.emptyTitle}>{t('review.noReviews')}</Text>
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{fetchError}</Text>
              <Pressable onPress={fetchReviews} style={styles.retryBtn}>
                <Text style={styles.retryText}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              {/* Avatar circle */}
              <View style={styles.avatar}>
                <FontAwesome name="user" size={16} color={Theme.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome
                      key={star}
                      name={star <= item.clientRating ? 'star' : 'star-o'}
                      size={14}
                      color={star <= item.clientRating ? Theme.warning : Theme.surfaceContainerHigh}
                    />
                  ))}
                </View>
                <Text style={styles.serviceTitle}>{item.serviceTitle}</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </View>
            <Text style={styles.reviewText}>"{item.clientReview}"</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },

  /* ── Header ──────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...Typography.h3,
    color: Theme.text,
  },

  /* ── Average rating ──────────────────────────────────────────── */
  avgCard: {
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  avgValue: {
    ...Typography.display,
    color: Theme.primary,
    marginBottom: Spacing.xs,
  },
  avgStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  avgCount: {
    ...Typography.bodySmall,
    color: Theme.textSecondary,
  },

  /* ── List ─────────────────────────────────────────────────────── */
  list: { flex: 1 },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  emptyContainer: { flexGrow: 1 },

  /* ── Empty state ─────────────────────────────────────────────── */
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyTitle: {
    ...Typography.body,
    color: Theme.textSecondary,
  },

  /* ── Error ───────────────────────────────────────────────────── */
  errorBox: {
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
  },
  retryText: {
    ...Typography.bodySmall,
    fontFamily: Fonts.interSb,
    color: Theme.textInverse,
  },

  /* ── Review card ─────────────────────────────────────────────── */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 2,
  },
  serviceTitle: {
    ...Typography.caption,
    color: Theme.textTertiary,
    marginTop: 2,
  },
  dateText: {
    ...Typography.caption,
    color: Theme.textTertiary,
  },
  reviewText: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Theme.text,
    lineHeight: 22,
  },
});

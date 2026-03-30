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
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
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
      contentContainerStyle={reviews.length === 0 && !fetchError ? styles.emptyContainer : styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
      }
      data={reviews}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <FontAwesome name="arrow-left" size={16} color={Theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('review.myReviews')}</Text>
        </View>
      }
      ListEmptyComponent={
        !fetchError ? (
          <View style={styles.empty}>
            <FontAwesome name="star-o" size={48} color={Theme.border} />
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
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome
                  key={star}
                  name={star <= item.clientRating ? 'star' : 'star-o'}
                  size={16}
                  color={star <= item.clientRating ? Theme.primary : Theme.border}
                />
              ))}
            </View>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <Text style={styles.reviewText}>"{item.clientReview}"</Text>
          <Text style={styles.serviceTitle}>{item.serviceTitle}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    color: Theme.textSecondary,
  },
  errorBox: {
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Theme.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
  reviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Theme.text,
    lineHeight: 20,
  },
  serviceTitle: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
});

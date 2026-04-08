import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
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

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: Theme.warningContainer,  text: '#92400E', label: 'KUTILMOQDA' },
  CONFIRMED: { bg: Theme.successContainer,  text: '#065F46', label: 'TASDIQLANGAN' },
  CANCELED:  { bg: Theme.errorContainer,    text: '#991B1B', label: 'BEKOR QILINGAN' },
  EXPIRED:   { bg: Theme.surfaceContainerLow, text: Theme.textSecondary, label: "MUDDATI O'TGAN" },
};

export default function PrescriptionsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        const json = await apiFetch<{ data: PrescriptionItem[]; total: number }>(
          `/consultations/prescriptions/my?page=${p}&limit=20`,
          { token },
        );
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

  const thisMonthCount = data.filter((item) => {
    const d = new Date(item.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const renderItem = ({ item }: { item: PrescriptionItem }) => {
    const isExpired =
      item.status === 'PENDING' && new Date() > new Date(item.expiresAt);
    const statusKey = isExpired ? 'EXPIRED' : item.status;
    const status = STATUS_MAP[statusKey] || STATUS_MAP.EXPIRED;

    return (
      <Pressable
        style={[styles.card, Shadow.sm]}
        onPress={() => {
          if (item.status === 'CONFIRMED' && item.orderId) {
            router.push({ pathname: '/order/track', params: { orderId: item.orderId } });
          } else if (item.status === 'PENDING' && !isExpired) {
            router.push({ pathname: '/prescription', params: { id: item.id } });
          }
        }}
      >
        <View style={styles.cardRow}>
          <View style={styles.pillCircle}>
            <FontAwesome name="medkit" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName} numberOfLines={1}>
              {item.serviceTitle}
            </Text>
            <Text style={styles.doctorDate}>
              {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + Spacing.lg }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brand}>HamshiraGo</Text>
              <Pressable hitSlop={12}>
                <FontAwesome name="bell-o" size={22} color={Theme.text} />
              </Pressable>
            </View>

            {/* Title */}
            <Text style={styles.title}>Retseptlar</Text>
            <Text style={styles.subtitle}>
              {t('prescription.noPrescriptions', "Shifokor tomonidan yozilgan retseptlar")}
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, Shadow.sm]}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>JAMI</Text>
              </View>
              <View style={[styles.statCard, Shadow.sm]}>
                <Text style={styles.statValue}>{thisMonthCount}</Text>
                <Text style={styles.statLabel}>BU OYDA</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <FontAwesome name="file-text-o" size={48} color={Theme.surfaceContainerHigh} />
            <Text style={styles.emptyText}>{t('prescription.noPrescriptions')}</Text>
          </View>
        }
        ListFooterComponent={
          <>
            {loadingMore && (
              <ActivityIndicator style={{ paddingVertical: Spacing.md }} color={Theme.primary} />
            )}
            {/* Bottom banner */}
            {data.length > 0 && !loadingMore && (
              <View style={[styles.bannerCard, Shadow.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Yangi retsept kerakmi?</Text>
                  <Pressable style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                    <LinearGradient
                      colors={Theme.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bannerBtn}
                    >
                      <Text style={styles.bannerBtnText}>Konsultatsiya olish</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  brand: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.primary,
  },

  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: Spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.primary,
  },
  statLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 11,
    color: Theme.textSecondary,
    letterSpacing: 1,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pillCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.text,
    marginBottom: 2,
  },
  doctorDate: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: Fonts.interSb,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.textSecondary,
  },

  bannerCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  bannerTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  bannerBtn: {
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  bannerBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: Theme.textInverse,
  },
});

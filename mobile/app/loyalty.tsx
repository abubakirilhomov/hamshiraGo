import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cacheSet, cacheGetStale } from '@/utils/cache';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LoyaltyBalance {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  nextTierAt: number | null;
  nextTierName: string | null;
}

interface LoyaltyTransaction {
  id: string;
  type: 'EARNED' | 'SPENT' | 'MILESTONE' | 'BONUS';
  points: number;
  description: string;
  createdAt: string;
}

interface LoyaltyHistoryResponse {
  data: LoyaltyTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

interface RedeemResponse {
  discountAmount: number;
  remainingPoints: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  BRONZE: { emoji: '\uD83E\uDD49', color: '#CD7F32', label: 'bronze' },
  SILVER: { emoji: '\uD83E\uDD48', color: '#94A3B8', label: 'silver' },
  GOLD:   { emoji: '\uD83E\uDD47', color: '#F59E0B', label: 'gold' },
} as const;

const TYPE_ICONS: Record<LoyaltyTransaction['type'], string> = {
  EARNED: '\u2B06\uFE0F',
  SPENT: '\u2B07\uFE0F',
  MILESTONE: '\uD83C\uDFAF',
  BONUS: '\uD83C\uDF81',
};

const PRESET_POINTS = [100, 500, 1000];
const CACHE_KEY = 'loyalty_balance';
const PAGE_SIZE = 20;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoyaltyScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [loading, setLoading] = useState(true);

  // History
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Redeem modal
  const [redeemVisible, setRedeemVisible] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  // ── Fetch balance ──────────────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<LoyaltyBalance>('/loyalty/my', { token });
      setBalance(data);
      cacheSet(CACHE_KEY, data);
    } catch {
      const cached = await cacheGetStale<LoyaltyBalance>(CACHE_KEY);
      if (cached) setBalance(cached);
    }
  }, [token]);

  // ── Fetch history page ─────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (page: number, append: boolean) => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await apiFetch<LoyaltyHistoryResponse>(
        `/loyalty/history?page=${page}&limit=${PAGE_SIZE}`,
        { token },
      );
      setHistory((prev) => (append ? [...prev, ...res.data] : res.data));
      setHistoryPage(res.page);
      setHistoryTotalPages(res.totalPages);
    } catch {
      // silently ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.all([fetchBalance(), fetchHistory(1, false)]).finally(() =>
      setLoading(false),
    );
  }, [fetchBalance, fetchHistory]);

  // ── Load more history ──────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (historyLoading || historyPage >= historyTotalPages) return;
    fetchHistory(historyPage + 1, true);
  };

  // ── Redeem ─────────────────────────────────────────────────────────────────
  const handleRedeem = async () => {
    const pts = parseInt(redeemPoints, 10);
    if (!pts || pts <= 0 || !token) return;
    setRedeemLoading(true);
    try {
      const res = await apiFetch<RedeemResponse>('/loyalty/redeem', {
        method: 'POST',
        token,
        body: JSON.stringify({ points: pts }),
      });
      showToast(
        t('loyalty.redeemed', { amount: res.discountAmount.toLocaleString('ru-RU') }),
        'success',
      );
      setRedeemVisible(false);
      setRedeemPoints('');
      // Refresh balance and history
      fetchBalance();
      fetchHistory(1, false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      showToast(msg, 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const tier = balance?.tier ?? 'BRONZE';
  const tierCfg = TIER_CONFIG[tier];
  const points = balance?.points ?? 0;
  const nextTierAt = balance?.nextTierAt;
  const nextTierName = balance?.nextTierName;
  const progress =
    nextTierAt && nextTierAt > 0 ? Math.min(points / nextTierAt, 1) : 1;

  const redeemPointsNum = parseInt(redeemPoints, 10) || 0;
  // Approximate: 1 point = 100 UZS (display only, backend computes actual)
  const estimatedDiscount = redeemPointsNum * 100;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Points balance card */}
        <LinearGradient
          colors={Theme.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>{t('loyalty.yourPoints')}</Text>
          <Text style={styles.balanceValue}>{points.toLocaleString('ru-RU')}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierEmoji}>{tierCfg.emoji}</Text>
            <Text style={styles.tierText}>{t(`loyalty.${tierCfg.label}`)}</Text>
          </View>
        </LinearGradient>

        {/* Progress to next tier */}
        {nextTierAt !== null && nextTierName && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>
              {t('loyalty.nextTier', {
                tier: nextTierName,
                points: String(nextTierAt),
              })}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressCount}>
              {points} / {nextTierAt}
            </Text>
          </View>
        )}

        {/* Redeem button */}
        {points > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.redeemBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setRedeemVisible(true)}
          >
            <FontAwesome name="exchange" size={16} color="#fff" />
            <Text style={styles.redeemBtnText}>{t('loyalty.redeem')}</Text>
          </Pressable>
        )}

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{t('loyalty.history')}</Text>

          {history.length === 0 && !historyLoading && (
            <Text style={styles.emptyText}>{t('loyalty.noHistory')}</Text>
          )}

          {history.length > 0 && (
            <View style={{ minHeight: 200 }}>
              <FlashList
                data={history}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <HistoryItem item={item} t={t} />
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  historyLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={Theme.primary}
                      style={{ marginVertical: Spacing.md }}
                    />
                  ) : null
                }
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Redeem modal */}
      <Modal
        visible={redeemVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRedeemVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('loyalty.redeemPoints')}</Text>

            <Text style={styles.modalLabel}>{t('loyalty.pointsToRedeem')}</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={redeemPoints}
              onChangeText={setRedeemPoints}
              placeholder="0"
              placeholderTextColor={Theme.textTertiary}
              maxLength={7}
            />

            <View style={styles.presetRow}>
              {PRESET_POINTS.map((p) => (
                <Pressable
                  key={p}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    redeemPoints === String(p) && styles.presetBtnActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => setRedeemPoints(String(p))}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      redeemPoints === String(p) && styles.presetBtnTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {redeemPointsNum > 0 && (
              <Text style={styles.estimateText}>
                {t('loyalty.equalsDiscount', {
                  amount: estimatedDiscount.toLocaleString('ru-RU'),
                })}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.modalSubmitBtn,
                pressed && { opacity: 0.85 },
                (redeemPointsNum <= 0 || redeemLoading) && { opacity: 0.5 },
              ]}
              onPress={handleRedeem}
              disabled={redeemPointsNum <= 0 || redeemLoading}
            >
              {redeemLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>{t('loyalty.redeem')}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── History item ────────────────────────────────────────────────────────────

function HistoryItem({
  item,
  t,
}: {
  item: LoyaltyTransaction;
  t: (key: string) => string;
}) {
  const icon = TYPE_ICONS[item.type] ?? '\u2B06\uFE0F';
  const isPositive = item.type !== 'SPENT';
  const date = new Date(item.createdAt);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

  return (
    <View style={styles.historyItem}>
      <Text style={styles.historyIcon}>{icon}</Text>
      <View style={styles.historyTexts}>
        <Text style={styles.historyDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.historyDate}>{dateStr}</Text>
      </View>
      <Text
        style={[
          styles.historyPoints,
          { color: isPositive ? Theme.success : Theme.error },
        ]}
      >
        {isPositive ? '+' : ''}{item.points}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Balance card
  balanceCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  tierEmoji: { fontSize: 18 },
  tierText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },

  // Progress
  progressCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Theme.surfaceSecondary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
  },
  progressCount: {
    fontSize: 12,
    color: Theme.textTertiary,
    textAlign: 'right',
  },

  // Redeem button
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  redeemBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // History section
  historySection: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  // History item
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderLight,
    gap: Spacing.md,
  },
  historyIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  historyTexts: {
    flex: 1,
    gap: 2,
  },
  historyDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.text,
  },
  historyDate: {
    fontSize: 12,
    color: Theme.textTertiary,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: Spacing.sm,
  },
  modalInput: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.text,
    borderWidth: 1.5,
    borderColor: Theme.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.border,
    backgroundColor: Theme.background,
  },
  presetBtnActive: {
    borderColor: Theme.primary,
    backgroundColor: `${Theme.primary}15`,
  },
  presetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  presetBtnTextActive: {
    color: Theme.primary,
    fontWeight: '700',
  },
  estimateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.primary,
    textAlign: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
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

const TIER_ORDER: Array<LoyaltyBalance['tier']> = ['BRONZE', 'SILVER', 'GOLD'];

const TIER_CONFIG = {
  BRONZE: { color: '#CD7F32', label: 'BRONZE' },
  SILVER: { color: '#94A3B8', label: 'SILVER' },
  GOLD:   { color: '#F59E0B', label: 'GOLD' },
} as const;

const TYPE_ICON_NAME: Record<LoyaltyTransaction['type'], React.ComponentProps<typeof FontAwesome>['name']> = {
  EARNED: 'arrow-up',
  SPENT: 'arrow-down',
  MILESTONE: 'trophy',
  BONUS: 'gift',
};

const PRESET_POINTS = [100, 500, 1000];
const CACHE_KEY = 'loyalty_balance';
const PAGE_SIZE = 20;

// ─── Redemption offers (static for now) ──────────────────────────────────────

const REDEMPTION_OFFERS = [
  { id: '1', title: 'Uyga hamshira chaqirish', subtitle: '15% chegirma', points: 500, icon: 'medkit' as const },
  { id: '2', title: 'Analiz topshirish', subtitle: '10% chegirma', points: 300, icon: 'flask' as const },
  { id: '3', title: 'Maslahat olish', subtitle: '20% chegirma', points: 800, icon: 'stethoscope' as const },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoyaltyScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

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
  const points = balance?.points ?? 0;
  const nextTierAt = balance?.nextTierAt;
  const nextTierName = balance?.nextTierName;
  const pointsToNext = nextTierAt ? nextTierAt - points : 0;

  const redeemPointsNum = parseInt(redeemPoints, 10) || 0;
  const estimatedDiscount = redeemPointsNum * 100;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero gradient card ── */}
        <LinearGradient
          colors={['#006860', '#008379']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Tier badge pill */}
          <View style={styles.tierBadgePill}>
            <Text style={styles.tierBadgePillText}>{TIER_CONFIG[tier].label}</Text>
          </View>

          {/* Points large */}
          <Text style={styles.heroPoints}>{points.toLocaleString('ru-RU')}</Text>
          <Text style={styles.heroBallLabel}>ball</Text>

          {/* Next tier hint */}
          {nextTierAt !== null && nextTierName && (
            <Text style={styles.heroNextHint}>
              Keyingi bosqichga: {pointsToNext > 0 ? pointsToNext : 0} ball
            </Text>
          )}
        </LinearGradient>

        {/* ── Mening darajam section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mening darajam</Text>
        </View>

        <View style={styles.tierProgressRow}>
          {TIER_ORDER.map((t, i) => {
            const isCurrent = t === tier;
            const isPast = TIER_ORDER.indexOf(tier) > i;
            const isFuture = TIER_ORDER.indexOf(tier) < i;
            const cfg = TIER_CONFIG[t];

            return (
              <View key={t} style={styles.tierStepContainer}>
                {/* Connecting line (before circle, except first) */}
                {i > 0 && (
                  <View
                    style={[
                      styles.tierLine,
                      { backgroundColor: isPast || isCurrent ? Theme.primary : Theme.surfaceContainerHigh },
                    ]}
                  />
                )}
                {/* Circle */}
                <View
                  style={[
                    styles.tierCircle,
                    isCurrent && { backgroundColor: Theme.primary, borderColor: Theme.primary },
                    isPast && { backgroundColor: Theme.surfaceContainerHigh, borderColor: Theme.surfaceContainerHigh },
                    isFuture && { backgroundColor: 'transparent', borderColor: Theme.surfaceContainerHigh, borderWidth: 2 },
                  ]}
                >
                  {(isCurrent || isPast) && (
                    <FontAwesome name="check" size={12} color={isCurrent ? '#fff' : Theme.textTertiary} />
                  )}
                </View>
                {/* Label */}
                <Text
                  style={[
                    styles.tierStepLabel,
                    isCurrent && { color: Theme.primary, fontFamily: Fonts.manropeBd },
                  ]}
                >
                  {cfg.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Ballarni sarflash section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ballarni sarflash</Text>
          <Pressable onPress={() => setRedeemVisible(true)}>
            <Text style={styles.sectionLink}>Barchasi</Text>
          </Pressable>
        </View>

        {REDEMPTION_OFFERS.map((offer) => (
          <View key={offer.id} style={styles.redeemCard}>
            <View style={styles.redeemIconCircle}>
              <FontAwesome name={offer.icon} size={18} color={Theme.primary} />
            </View>
            <View style={styles.redeemCardBody}>
              <Text style={styles.redeemCardTitle}>{offer.title}</Text>
              <Text style={styles.redeemCardSubtitle}>{offer.subtitle}</Text>
            </View>
            <View style={styles.redeemCardRight}>
              <View style={styles.pointsPill}>
                <Text style={styles.pointsPillText}>{offer.points} ball</Text>
              </View>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setRedeemPoints(String(offer.points));
                  setRedeemVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#006860', '#008379']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.redeemSmallBtn}
                >
                  <Text style={styles.redeemSmallBtnText}>Sarflash</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ))}

        {/* ── Tarix section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tarix</Text>
        </View>

        {history.length === 0 && !historyLoading && (
          <Text style={styles.emptyText}>{t('loyalty.noHistory')}</Text>
        )}

        {history.length > 0 && (
          <View style={{ minHeight: 200 }}>
            <FlashList
              data={history}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => <HistoryItem item={item} />}
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Redeem modal ── */}
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
                pressed && { opacity: 0.85 },
                (redeemPointsNum <= 0 || redeemLoading) && { opacity: 0.5 },
              ]}
              onPress={handleRedeem}
              disabled={redeemPointsNum <= 0 || redeemLoading}
            >
              <LinearGradient
                colors={['#006860', '#008379']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSubmitBtn}
              >
                {redeemLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>{t('loyalty.redeem')}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── History item ────────────────────────────────────────────────────────────

function HistoryItem({ item }: { item: LoyaltyTransaction }) {
  const iconName = TYPE_ICON_NAME[item.type] ?? 'arrow-up';
  const isPositive = item.type !== 'SPENT';
  const date = new Date(item.createdAt);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

  return (
    <View style={styles.historyItem}>
      <View
        style={[
          styles.historyIconCircle,
          { backgroundColor: isPositive ? `${Theme.success}15` : `${Theme.error}15` },
        ]}
      >
        <FontAwesome
          name={iconName}
          size={14}
          color={isPositive ? Theme.success : Theme.error}
        />
      </View>
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background },

  // ── Hero card ──
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 2,
  },
  tierBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  tierBadgePillText: {
    fontSize: 12,
    fontFamily: Fonts.manropeBd,
    color: '#006860',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPoints: {
    fontSize: 48,
    fontFamily: Fonts.manropeXb,
    color: '#fff',
    letterSpacing: 1,
  },
  heroBallLabel: {
    fontSize: 16,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
  },
  heroNextHint: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.primary,
  },

  // ── Tier progress row ──
  tierProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  tierStepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  tierCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.surfaceContainerHigh,
  },
  tierLine: {
    position: 'absolute',
    top: 17,
    right: '50%',
    left: -20,
    height: 2,
    zIndex: -1,
  },
  tierStepLabel: {
    fontSize: 11,
    fontFamily: Fonts.interMd,
    color: Theme.textTertiary,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Redeem cards ──
  redeemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  redeemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Theme.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemCardBody: {
    flex: 1,
    gap: 2,
  },
  redeemCardTitle: {
    fontSize: 15,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  redeemCardSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  redeemCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pointsPill: {
    backgroundColor: `${Theme.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pointsPillText: {
    fontSize: 12,
    fontFamily: Fonts.manropeBd,
    color: Theme.success,
  },
  redeemSmallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  redeemSmallBtnText: {
    fontSize: 12,
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },

  // ── History ──
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderLight,
    gap: Spacing.md,
  },
  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTexts: {
    flex: 1,
    gap: 2,
  },
  historyDesc: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
  },
  historyPoints: {
    fontSize: 15,
    fontFamily: Fonts.manropeBd,
  },

  // ── Modal ──
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
    backgroundColor: Theme.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: Spacing.sm,
  },
  modalInput: {
    fontSize: 24,
    fontFamily: Fonts.manropeBd,
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
    borderRadius: Radius.full,
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
    fontFamily: Fonts.manropeSb,
    color: Theme.textSecondary,
  },
  presetBtnTextActive: {
    color: Theme.primary,
  },
  estimateText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    color: Theme.primary,
    textAlign: 'center',
  },
  modalSubmitBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitText: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },
});

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionTier {
  id: string;
  name: string;
  nameUz: string;
  description: string;
  descriptionUz: string;
  price: number;
  billingDays: number;
  maxOrders: number;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
}

interface Subscription {
  id: string;
  userId: string;
  tierId: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  ordersUsed: number;
  startDate: string;
  expiresAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU').replace(/,/g, ' ');
}

function daysUntil(iso: string): number {
  const now = new Date();
  const exp = new Date(iso);
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Tier feature map (static) ────────────────────────────────────────────────

interface TierFeature {
  label: string;
  tiers: Record<string, boolean>;
}

const COMPARISON_FEATURES: TierFeature[] = [
  { label: 'Chegirma', tiers: { basic: true, premium: true, vip: true } },
  { label: 'Buyurtmalar soni', tiers: { basic: true, premium: true, vip: true } },
  { label: 'Tezkor qabul', tiers: { basic: false, premium: true, vip: true } },
  { label: 'Shaxsiy menejer', tiers: { basic: false, premium: false, vip: true } },
  { label: 'Bepul konsultatsiya', tiers: { basic: false, premium: true, vip: true } },
  { label: 'VIP xizmatlar', tiers: { basic: false, premium: false, vip: true } },
];

// ── Tier icon names ──────────────────────────────────────────────────────────

const TIER_ICONS: Record<number, React.ComponentProps<typeof FontAwesome>['name']> = {
  0: 'star-o',
  1: 'star-half-full',
  2: 'star',
};

// ── Screen ───────────────────────────────────────────────────────────────────

export default function SubscriptionsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [tiersRes, subRes] = await Promise.all([
        apiFetch<SubscriptionTier[]>('/subscriptions/tiers'),
        token
          ? apiFetch<Subscription | null>('/subscriptions/my', { token })
          : Promise.resolve(null),
      ]);
      setTiers(tiersRes.filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      setSubscription(subRes ?? null);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Purchase ───────────────────────────────────────────────────────────────

  const handlePurchase = (tier: SubscriptionTier) => {
    const tierName = language === 'uz' && tier.nameUz ? tier.nameUz : tier.name;
    Alert.alert(
      t('subscription.title'),
      t('subscription.confirmBuy', { name: tierName, price: formatPrice(tier.price) }),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('subscription.buy'),
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiFetch<Subscription>('/subscriptions/purchase', {
                method: 'POST',
                token: token ?? undefined,
                body: JSON.stringify({ tierId: tier.id }),
              });
              showToast(t('subscription.activated'), 'success');
              await fetchData();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : t('common.error');
              showToast(msg, 'error');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────

  const handleCancel = () => {
    Alert.alert(
      t('subscription.cancel'),
      t('subscription.confirmCancel'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('subscription.cancel'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiFetch<Subscription>('/subscriptions/cancel', {
                method: 'POST',
                token: token ?? undefined,
              });
              showToast(t('subscription.canceledToast'), 'success');
              await fetchData();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : t('common.error');
              showToast(msg, 'error');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const activeSub =
    subscription && subscription.status === 'ACTIVE' ? subscription : null;

  const ordersLeft = activeSub
    ? activeSub.tier.maxOrders - activeSub.ordersUsed
    : 0;
  const daysLeft = activeSub ? daysUntil(activeSub.expiresAt) : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <Text style={styles.headerBrand}>Clinical Sanctuary</Text>
        <Pressable style={styles.headerBellBtn} onPress={() => router.push('/ai-chat')}>
          <FontAwesome name="bell-o" size={20} color={Theme.text} />
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>Mening obunalarim</Text>

      {/* ── Active subscription card ── */}
      {activeSub && (
        <View style={styles.activeCard}>
          <View style={styles.activeTopRow}>
            <Text style={styles.activeLabel}>HOZIRGI TARIF</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>FAOL</Text>
            </View>
          </View>

          <Text style={styles.activeTierName}>
            {language === 'uz' && activeSub.tier.nameUz
              ? activeSub.tier.nameUz
              : activeSub.tier.name}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>BUYURTMALAR</Text>
              <Text style={styles.statValue}>{ordersLeft} qoldi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>AMAL QILISH</Text>
              <Text style={styles.statValue}>{daysLeft} kun</Text>
            </View>
          </View>

          {/* Cancel link */}
          <Pressable
            onPress={handleCancel}
            disabled={actionLoading}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.cancelLink}>
              {actionLoading ? '...' : 'Bekor qilish'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Mavjud tariflar section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mavjud tariflar</Text>
        <Text style={styles.sectionLink}>Hammasi</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiersScroll}
      >
        {tiers.map((tier, index) => {
          const isCurrentTier = activeSub?.tierId === tier.id;
          const tierName =
            language === 'uz' && tier.nameUz ? tier.nameUz : tier.name;
          const tierDesc =
            language === 'uz' && tier.descriptionUz
              ? tier.descriptionUz
              : tier.description;
          const iconName = TIER_ICONS[index] ?? 'star';

          // Build benefits list from tier data
          const benefits: Array<{ text: string; available: boolean }> = [
            { text: `${tier.maxOrders} ta buyurtma/oy`, available: true },
            { text: `${tier.discountPercent}% chegirma`, available: true },
            { text: 'Tezkor qabul', available: index >= 1 },
            { text: 'Bepul konsultatsiya', available: index >= 1 },
            { text: 'Shaxsiy menejer', available: index >= 2 },
          ];

          return (
            <View key={tier.id} style={styles.tierCard}>
              {/* Icon + name */}
              <View style={styles.tierIconCircle}>
                <FontAwesome name={iconName} size={20} color="#fff" />
              </View>
              <Text style={styles.tierName}>{tierName}</Text>

              {tierDesc ? (
                <Text style={styles.tierDesc}>{tierDesc}</Text>
              ) : null}

              {/* Benefits */}
              <View style={styles.benefitsList}>
                {benefits.map((b, i) => (
                  <View key={i} style={styles.benefitRow}>
                    {b.available ? (
                      <FontAwesome name="check" size={13} color={Theme.primary} />
                    ) : (
                      <View style={styles.benefitUnavailCircle} />
                    )}
                    <Text
                      style={[
                        styles.benefitText,
                        !b.available && { color: Theme.textTertiary },
                      ]}
                    >
                      {b.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Price */}
              <View style={styles.tierPriceRow}>
                <Text style={styles.tierPrice}>
                  {formatPrice(tier.price)} UZS
                </Text>
                <Text style={styles.tierPriceUnit}>/oy</Text>
              </View>

              {/* Buy button */}
              {isCurrentTier ? (
                <View style={styles.currentBadge}>
                  <FontAwesome name="check" size={13} color={Theme.primary} />
                  <Text style={styles.currentBadgeText}>
                    {t('subscription.active')}
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    pressed && { opacity: 0.85 },
                    (actionLoading || !!activeSub) && { opacity: 0.5 },
                  ]}
                  onPress={() => handlePurchase(tier)}
                  disabled={actionLoading || !!activeSub}
                >
                  <LinearGradient
                    colors={['#006860', '#008379']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buyBtn}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buyBtnText}>
                        {activeSub
                          ? t('subscription.alreadySubscribed')
                          : 'Sotib olish'}
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          );
        })}

        {tiers.length === 0 && (
          <Text style={styles.emptyText}>{t('common.loading')}</Text>
        )}
      </ScrollView>

      {/* ── Comparison table ── */}
      {tiers.length > 0 && (
        <>
          <Text style={styles.comparisonTitle}>Imkoniyatlarni solishtirish</Text>

          {/* Table header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.tableFeatureCol]}>Xizmat</Text>
            {tiers.map((tier) => {
              const name = language === 'uz' && tier.nameUz ? tier.nameUz : tier.name;
              return (
                <Text key={tier.id} style={styles.tableHeaderCell} numberOfLines={1}>
                  {name}
                </Text>
              );
            })}
          </View>

          {/* Table rows */}
          {COMPARISON_FEATURES.map((feature, rowIdx) => {
            const isAlt = rowIdx % 2 === 0;
            return (
              <View
                key={feature.label}
                style={[
                  styles.tableRow,
                  isAlt && { backgroundColor: Theme.surfaceContainerLow },
                ]}
              >
                <Text style={[styles.tableCell, styles.tableFeatureCol]} numberOfLines={1}>
                  {feature.label}
                </Text>
                {tiers.map((tier, tIdx) => {
                  const tierKey = tIdx === 0 ? 'basic' : tIdx === 1 ? 'premium' : 'vip';
                  const available = feature.tiers[tierKey] ?? false;
                  return (
                    <View key={tier.id} style={styles.tableCell}>
                      {available ? (
                        <FontAwesome name="check" size={14} color={Theme.primary} />
                      ) : (
                        <FontAwesome name="times" size={14} color={Theme.textTertiary} />
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background },

  // ── Header ──
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerBrand: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  headerBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageTitle: {
    fontSize: 22,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    marginBottom: Spacing.sm,
  },

  // ── Active subscription card ──
  activeCard: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeLabel: {
    fontSize: 11,
    fontFamily: Fonts.interMd,
    color: Theme.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeBadge: {
    backgroundColor: `${Theme.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.manropeBd,
    color: Theme.success,
    letterSpacing: 0.5,
  },
  activeTierName: {
    fontSize: 20,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Theme.surfaceContainerHigh,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.interMd,
    color: Theme.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  cancelLink: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.error,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
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

  // ── Tier cards (horizontal scroll) ──
  tiersScroll: {
    gap: 12,
    paddingRight: Spacing.lg,
  },
  tierCard: {
    width: 260,
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  tierIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  tierDesc: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    lineHeight: 18,
  },
  benefitsList: {
    gap: 8,
    marginTop: Spacing.xs,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitUnavailCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Theme.surfaceContainerHigh,
  },
  benefitText: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.text,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: Spacing.sm,
  },
  tierPrice: {
    fontSize: 24,
    fontFamily: Fonts.manropeXb,
    color: Theme.text,
  },
  tierPriceUnit: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  buyBtn: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.full,
  },
  buyBtnText: {
    fontSize: 15,
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 13,
    borderRadius: Radius.full,
    backgroundColor: `${Theme.primary}10`,
  },
  currentBadgeText: {
    fontSize: 14,
    fontFamily: Fonts.manropeBd,
    color: Theme.primary,
  },

  // ── Comparison table ──
  comparisonTitle: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...Shadow.sm,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.manropeSb,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  tableFeatureCol: {
    flex: 1.5,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.text,
  },

  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});

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
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${d.getFullYear()}`;
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function SubscriptionsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguage();

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
      // silently ignore — tiers/sub may already be set
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Active subscription card */}
      {activeSub && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <FontAwesome name="check-circle" size={20} color={Theme.primary} />
            <Text style={styles.activeTitle}>
              {language === 'uz' && activeSub.tier.nameUz
                ? activeSub.tier.nameUz
                : activeSub.tier.name}
            </Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t('subscription.active')}</Text>
            </View>
          </View>

          <View style={styles.activeDetails}>
            <Text style={styles.activeDetailText}>
              {t('subscription.discountPercent', {
                percent: String(activeSub.tier.discountPercent),
              })}
            </Text>
            <Text style={styles.activeDetailText}>
              {formatPrice(activeSub.tier.price)} UZS/{t('subscription.perMonth')}
            </Text>
          </View>

          {/* Progress bar */}
          <Text style={styles.progressLabel}>
            {t('subscription.ordersUsed', {
              used: String(activeSub.ordersUsed),
              max: String(activeSub.tier.maxOrders),
            })}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    Math.round(
                      (activeSub.ordersUsed / activeSub.tier.maxOrders) * 100,
                    ),
                    100,
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.expiresText}>
            {t('subscription.expiresAt', { date: formatDate(activeSub.expiresAt) })}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.8 },
              actionLoading && { opacity: 0.5 },
            ]}
            onPress={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={Theme.error} />
            ) : (
              <Text style={styles.cancelBtnText}>{t('subscription.cancel')}</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Tiers list */}
      <Text style={styles.sectionTitle}>{t('subscription.title')}</Text>

      {tiers.map((tier) => {
        const isCurrentTier = activeSub?.tierId === tier.id;
        const tierName =
          language === 'uz' && tier.nameUz ? tier.nameUz : tier.name;
        const tierDesc =
          language === 'uz' && tier.descriptionUz
            ? tier.descriptionUz
            : tier.description;

        return (
          <View
            key={tier.id}
            style={[styles.tierCard, isCurrentTier && styles.tierCardActive]}
          >
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tierName}</Text>
              <Text style={styles.tierPrice}>
                {formatPrice(tier.price)} UZS
              </Text>
            </View>

            <View style={styles.tierFeatures}>
              <View style={styles.featureRow}>
                <FontAwesome
                  name="shopping-cart"
                  size={13}
                  color={Theme.textSecondary}
                />
                <Text style={styles.featureText}>
                  {t('subscription.ordersPerMonth', {
                    count: tier.maxOrders,
                  })}
                </Text>
              </View>
              <View style={styles.featureRow}>
                <FontAwesome
                  name="percent"
                  size={13}
                  color={Theme.textSecondary}
                />
                <Text style={styles.featureText}>
                  {t('subscription.discountPercent', {
                    percent: String(tier.discountPercent),
                  })}
                </Text>
              </View>
            </View>

            {tierDesc ? (
              <Text style={styles.tierDescription}>{tierDesc}</Text>
            ) : null}

            {isCurrentTier ? (
              <View style={styles.activeTierBadge}>
                <FontAwesome name="check" size={13} color={Theme.primary} />
                <Text style={styles.activeTierBadgeText}>
                  {t('subscription.active')}
                </Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.buyBtn,
                  pressed && { opacity: 0.85 },
                  (actionLoading || !!activeSub) && styles.buyBtnDisabled,
                ]}
                onPress={() => handlePurchase(tier)}
                disabled={actionLoading || !!activeSub}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buyBtnText}>
                    {activeSub
                      ? t('subscription.alreadySubscribed')
                      : t('subscription.buy')}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        );
      })}

      {tiers.length === 0 && (
        <Text style={styles.emptyText}>{t('common.loading')}</Text>
      )}
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Active subscription
  activeCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Theme.primary,
    gap: Spacing.sm,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
  },
  activeBadge: {
    backgroundColor: `${Theme.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.primary,
    textTransform: 'uppercase',
  },
  activeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  activeDetailText: {
    fontSize: 13,
    color: Theme.textSecondary,
    fontWeight: '500',
  },
  progressLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: Spacing.sm,
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
  expiresText: {
    fontSize: 12,
    color: Theme.textTertiary,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Theme.error}40`,
    backgroundColor: `${Theme.error}08`,
    marginTop: Spacing.sm,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.error,
  },

  // Section title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },

  // Tier card
  tierCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  tierCardActive: {
    borderColor: Theme.primary,
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.primary,
  },
  tierFeatures: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: Theme.textSecondary,
  },
  tierDescription: {
    fontSize: 13,
    color: Theme.textTertiary,
    marginTop: Spacing.xs,
  },
  activeTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: `${Theme.primary}10`,
    marginTop: Spacing.xs,
  },
  activeTierBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.primary,
  },
  buyBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Theme.primary,
    marginTop: Spacing.xs,
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: Theme.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});

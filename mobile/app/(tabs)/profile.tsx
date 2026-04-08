import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import AppModal from '@/components/AppModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { cacheSet, cacheGetStale } from '@/utils/cache';
import type { Language } from '@/i18n';

interface LoyaltyBalance {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  nextTierAt: number | null;
  nextTierName: string | null;
}

interface SubscriptionTier {
  id: string;
  name: string;
  nameUz: string;
  discountPercent: number;
  maxOrders: number;
}

interface Subscription {
  id: string;
  tierId: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  ordersUsed: number;
  expiresAt: string;
}

interface OrderSummary {
  id: string;
  status: string;
}

interface PagedOrders {
  data: OrderSummary[];
  total: number;
}

const STATUS_DONE = ['DONE'];
const STATUS_ACTIVE = ['CREATED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED'];

const TIER_LABEL: Record<string, string> = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
};

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [totalOrders, setTotalOrders] = useState(0);
  const [doneOrders, setDoneOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loyalty, setLoyalty] = useState<LoyaltyBalance | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!token) return;
    const LOYALTY_CACHE_KEY = 'profile_loyalty';
    apiFetch<LoyaltyBalance>('/loyalty/my', { token })
      .then((data) => {
        setLoyalty(data);
        cacheSet(LOYALTY_CACHE_KEY, data);
      })
      .catch(async () => {
        try {
          const cached = await cacheGetStale<LoyaltyBalance>(LOYALTY_CACHE_KEY);
          if (cached) setLoyalty(cached);
        } catch {}
      });

    apiFetch<Subscription | null>('/subscriptions/my', { token })
      .then((data) => {
        if (data) setSubscription(data);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const STATS_CACHE_KEY = 'profile_stats';
    Promise.all([
      apiFetch<PagedOrders>('/orders?limit=1', { token }),
      apiFetch<PagedOrders>('/orders?limit=1&status=DONE', { token }).catch(() => null),
      apiFetch<PagedOrders>('/orders?limit=1&status=CREATED,ASSIGNED,ACCEPTED,ON_THE_WAY,ARRIVED,SERVICE_STARTED', { token }).catch(() => null),
    ]).then(([allRes, doneRes, activeRes]) => {
      const stats = {
        total: allRes.total ?? allRes.data.length,
        done: doneRes?.total ?? doneRes?.data.length ?? 0,
        active: activeRes?.total ?? activeRes?.data.length ?? 0,
      };
      setTotalOrders(stats.total);
      setDoneOrders(stats.done);
      setActiveOrders(stats.active);
      cacheSet(STATS_CACHE_KEY, stats);
    }).catch(async () => {
      try {
        const cached = await cacheGetStale<{ total: number; done: number; active: number }>(STATS_CACHE_KEY);
        if (cached) {
          setTotalOrders(cached.total);
          setDoneOrders(cached.done);
          setActiveOrders(cached.active);
        }
      } catch {}
    });
  }, [token]);

  const handleLogout = () => setLogoutModal(true);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = useCallback(async () => {
    if (!token || !newName.trim()) return;
    setSavingName(true);
    try {
      await apiFetch('/auth/profile', {
        token,
        method: 'PATCH',
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (user) (user as any).name = newName.trim();
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSavingName(false);
    }
  }, [token, newName, user]);

  if (!user) return null;

  const langLabel = language === 'uz' ? "O'zbekcha" : 'Русский';

  const menuItems: {
    icon: string;
    title: string;
    onPress: () => void;
    badge?: string;
    isLogout?: boolean;
  }[] = [
    { icon: 'medkit', title: t('medcard.title'), onPress: () => router.push('/medical-card') },
    { icon: 'heart', title: t('favorites.myMedics'), onPress: () => router.push('/favorites') },
    { icon: 'stethoscope', title: t('consultation.myConsultations'), onPress: () => router.push('/consultations') },
    { icon: 'book', title: t('courses.title'), onPress: () => router.push('/courses') },
    { icon: 'gift', title: t('referral.title'), onPress: () => router.push('/referral') },
    { icon: 'globe', title: t('language.title'), onPress: () => {
      const next: Language = language === 'uz' ? 'ru' : 'uz';
      setLanguage(next);
    }, badge: langLabel },
  ];

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header bar ── */}
      <View style={styles.headerBar}>
        <Text style={styles.headerBrand}>HamshiraGo</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.headerIconBtn} onPress={() => router.push('/ai-chat')}>
            <FontAwesome name="bell-o" size={20} color={Theme.text} />
          </Pressable>
          <Pressable style={styles.headerIconBtn} onPress={() => router.push('/prescriptions')}>
            <FontAwesome name="cog" size={20} color={Theme.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Avatar + Name + Phone ── */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={Theme.textTertiary} />
        </View>

        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.editNameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={t('editProfile.name')}
              autoFocus
            />
            <Pressable style={styles.editNameSave} onPress={handleSaveName} disabled={savingName}>
              <Text style={styles.editNameSaveText}>{t('editProfile.save')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => { setNewName(user.name ?? ''); setEditingName(true); }}>
            <Text style={styles.userName}>{user.name ?? t('profile.client')}</Text>
          </Pressable>
        )}

        <Text style={styles.userPhone}>{user.phone}</Text>
      </View>

      {/* ── Loyalty card ── */}
      {loyalty && (
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/loyalty')}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyCard}
          >
            {/* Tier badge */}
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{TIER_LABEL[loyalty.tier] ?? loyalty.tier}</Text>
            </View>

            <View style={styles.loyaltyBody}>
              <View style={styles.loyaltyLeft}>
                <View style={styles.loyaltyPointsRow}>
                  <Text style={styles.loyaltyPoints}>{loyalty.points.toLocaleString('ru-RU')}</Text>
                  <Text style={styles.loyaltyBallLabel}>ball</Text>
                </View>
                <Text style={styles.loyaltyHint}>
                  Sizning sodiqlik darajangiz yaqinlashdi
                </Text>
              </View>
              <View style={styles.loyaltyRight}>
                <Text style={styles.loyaltyMoreText}>Ko'proq bilish</Text>
                <FontAwesome name="arrow-right" size={12} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* ── Subscription card (kept compact) ── */}
      {subscription && subscription.status === 'ACTIVE' && (
        <Pressable
          style={({ pressed }) => [styles.subscriptionCard, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/subscriptions')}
        >
          <View style={styles.menuRow}>
            <View style={styles.menuIconCircle}>
              <FontAwesome name="id-card" size={18} color={Theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>
                {language === 'uz' && subscription.tier.nameUz ? subscription.tier.nameUz : subscription.tier.name}
              </Text>
              <Text style={styles.subscriptionDetail}>
                {t('subscription.discountPercent', { percent: String(subscription.tier.discountPercent) })} | {subscription.ordersUsed}/{subscription.tier.maxOrders}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.textTertiary} />
          </View>
        </Pressable>
      )}

      {/* ── Menu list ── */}
      <View style={styles.menuCard}>
        {menuItems.map((item, idx) => (
          <Pressable
            key={idx}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && { opacity: 0.7 },
              idx < menuItems.length - 1 && styles.menuRowSeparator,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuIconCircle}>
              <FontAwesome
                name={item.icon as keyof typeof FontAwesome.glyphMap}
                size={18}
                color={Theme.primary}
              />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            {item.badge && (
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>{item.badge}</Text>
              </View>
            )}
            <FontAwesome name="chevron-right" size={14} color={Theme.textTertiary} />
          </Pressable>
        ))}
      </View>

      {/* ── Logout ── */}
      <Pressable
        style={({ pressed }) => [styles.logoutRow, pressed && { opacity: 0.7 }]}
        onPress={handleLogout}
      >
        <View style={[styles.menuIconCircle, { backgroundColor: Theme.errorContainer }]}>
          <FontAwesome name="sign-out" size={18} color={Theme.error} />
        </View>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        <FontAwesome name="chevron-right" size={14} color={Theme.textTertiary} />
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>

    <AppModal
      visible={logoutModal}
      title={t('profile.logoutConfirmTitle')}
      message={t('profile.logoutConfirmMessage')}
      buttons={[
        { text: t('profile.cancel'), style: 'cancel', onPress: () => setLogoutModal(false) },
        { text: t('profile.logout'), style: 'destructive', onPress: logout },
      ]}
      onClose={() => setLogoutModal(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { paddingHorizontal: Spacing.lg },

  /* Header bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  headerBrand: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Avatar + name */
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: 20,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Radius.sm,
    padding: 10,
    fontSize: 15,
    fontFamily: Fonts.inter,
    backgroundColor: Theme.surface,
  },
  editNameSave: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editNameSaveText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
  },

  /* Loyalty card */
  loyaltyCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  tierBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.interSb,
    color: '#fff',
    letterSpacing: 1,
  },
  loyaltyBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  loyaltyLeft: {
    flex: 1,
  },
  loyaltyPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  loyaltyPoints: {
    fontSize: 36,
    fontFamily: Fonts.manropeXb,
    color: '#fff',
  },
  loyaltyBallLabel: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.7)',
  },
  loyaltyHint: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loyaltyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loyaltyMoreText: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    color: '#fff',
  },

  /* Subscription card */
  subscriptionCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  subscriptionDetail: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  /* Menu list */
  menuCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  menuRowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.surfaceContainerLow,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
  langBadge: {
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
  },
  langBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },

  /* Logout */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.interMd,
    color: Theme.error,
  },
});

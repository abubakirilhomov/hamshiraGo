import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import AppModal from '@/components/AppModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { cacheSet, cacheGetStale } from '@/utils/cache';
import type { Language } from '@/i18n';

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

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [totalOrders, setTotalOrders] = useState(0);
  const [doneOrders, setDoneOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    if (!token) return;
    const STATS_CACHE_KEY = 'profile_stats';
    // Fetch minimal data: limit=1 just to get `total` from pagination metadata
    // TODO: replace with dedicated `/orders/stats` endpoint when available (see BE ideas)
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
      // Network failure — try cached stats as fallback
      try {
        const cached = await cacheGetStale<{ total: number; done: number; active: number }>(STATS_CACHE_KEY);
        if (cached) {
          setTotalOrders(cached.total);
          setDoneOrders(cached.done);
          setActiveOrders(cached.active);
        }
      } catch {
        // ignore cache read errors
      }
    });
  }, [token]);

  const handleLogout = () => setLogoutModal(true);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user.phone.slice(-2);

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient
        colors={Theme.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name ?? t('profile.client')}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalOrders}</Text>
          <Text style={styles.statLabel}>{t('profile.totalOrders')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{doneOrders}</Text>
          <Text style={styles.statLabel}>{t('profile.completed')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, activeOrders > 0 && { color: Theme.warning }]}>
            {activeOrders}
          </Text>
          <Text style={styles.statLabel}>{t('profile.active')}</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.accountInfo')}</Text>
        <InfoRow icon="phone" label={t('profile.phone')} value={user.phone} />
        {user.name && <InfoRow icon="user" label={t('profile.name')} value={user.name} />}
      </View>

      {/* Language picker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('language.title')}</Text>
        <View style={styles.langRow}>
          {(['ru', 'uz'] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langBtn, language === lang && styles.langBtnActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                {lang === 'ru' ? '🇷🇺 Русский' : '🇺🇿 O\'zbekcha'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Quick links */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.features')}</Text>
        <Pressable style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]} onPress={() => router.push('/referral')}>
          <FontAwesome name="gift" size={15} color={Theme.primary} style={styles.linkIcon} />
          <Text style={styles.linkText}>{t('referral.title')} 🎁</Text>
          <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]} onPress={() => router.push('/courses')}>
          <FontAwesome name="calendar-check-o" size={15} color={Theme.primary} style={styles.linkIcon} />
          <Text style={styles.linkText}>{t('courses.title')}</Text>
          <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]} onPress={() => router.push('/favorites')}>
          <FontAwesome name="heart" size={15} color={Theme.primary} style={styles.linkIcon} />
          <Text style={styles.linkText}>{t('favorites.myMedics')}</Text>
          <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]} onPress={() => router.push('/medical-card')}>
          <FontAwesome name="medkit" size={15} color={Theme.primary} style={styles.linkIcon} />
          <Text style={styles.linkText}>{t('medcard.title')}</Text>
          <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
        </Pressable>
      </View>

      {/* App info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.about')}</Text>
        <InfoRow icon="heartbeat" label="HamshiraGo" value={t('profile.aboutDesc')} />
        <InfoRow icon="star" label={t('profile.discount')} value={t('profile.discountDesc')} />
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        onPress={handleLogout}
      >
        <FontAwesome name="sign-out" size={16} color={Theme.error} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </Pressable>

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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <FontAwesome name={icon as keyof typeof FontAwesome.glyphMap} size={15} color={Theme.textSecondary} style={styles.infoIcon} />
      <View style={styles.infoTexts}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    margin: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: Theme.primary },
  statLabel: { fontSize: 11, color: Theme.textSecondary, marginTop: 3, textAlign: 'center' },

  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: { width: 20, textAlign: 'center' },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 12, color: Theme.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '500', color: Theme.text, marginTop: 1 },

  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.border,
    backgroundColor: Theme.background,
  },
  langBtnActive: {
    borderColor: Theme.primary,
    backgroundColor: `${Theme.primary}15`,
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.textSecondary,
  },
  langBtnTextActive: {
    color: Theme.primary,
    fontWeight: '700',
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkIcon: { width: 20, textAlign: 'center', marginRight: Spacing.md },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Theme.text,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Theme.error}40`,
    backgroundColor: `${Theme.error}08`,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Theme.error },
});

import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppModal from '@/components/AppModal';
import { SkeletonProfileHeader, SkeletonLine } from '@/components/SkeletonLoader';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { apiFetch, API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n';
import {
  hasBackgroundLocationPermission,
  requestBackgroundLocationPermission,
  setBackgroundLocationToken,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '@/utils/backgroundLocation';
import { cacheSet, cacheGetStale } from '@/utils/cache';
import { trackEvent } from '@/utils/analytics';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { VerificationCard } from '@/components/profile/VerificationCard';
import { OnlineToggle } from '@/components/profile/OnlineToggle';
import { StatsSection } from '@/components/profile/StatsSection';

const TELEGRAM_BOT = 'hamshirago_medic_bot';
const TELEGRAM_CHANNEL = 'https://t.me/hamshirago_medics'; // канал для медиков

interface OrderCount { id: string; status: string; }

export default function ProfileScreen() {
  const { medic, token, updateOnlineStatus, refreshProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [disconnectingTg, setDisconnectingTg] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [tgDisconnectModal, setTgDisconnectModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasAlwaysLocation, setHasAlwaysLocation] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: OrderCount[]; total: number }>('/orders/medic/my?status=DONE&limit=1', { token })
      .then(async (res) => {
        const count = res.total ?? res.data.length;
        setCompletedCount(count);
        await cacheSet('medic_completed_count', count);
      })
      .catch(async () => {
        try {
          const cached = await cacheGetStale<number>('medic_completed_count');
          if (cached != null) setCompletedCount(cached);
        } catch {
          // ignore cache read errors
        }
      });
  }, [token]);

  // Cache medic profile whenever it changes
  useEffect(() => {
    if (medic) {
      cacheSet('medic_profile', medic).catch(() => {});
    }
  }, [medic]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!medic?.isOnline) {
        setHasAlwaysLocation(true);
        return () => {};
      }
      hasBackgroundLocationPermission()
        .then((ok) => {
          if (!cancelled) setHasAlwaysLocation(ok);
        })
        .catch(() => {
          if (!cancelled) setHasAlwaysLocation(false);
        });
      return () => {
        cancelled = true;
      };
    }, [medic?.isOnline]),
  );

  const ratingDisplay = useMemo(() => {
    if (medic?.rating == null) return null;
    return Number(medic.rating).toFixed(1);
  }, [medic?.rating]);

  if (!medic) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonProfileHeader />
        <View style={{ marginHorizontal: 16, gap: 16 }}>
          <View style={[styles.card, { margin: 0 }]}>
            <SkeletonLine width="40%" height={12} />
            <SkeletonLine width="100%" height={44} style={{ marginTop: 10 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.statCard, { gap: 6 }]}>
              <SkeletonLine width={40} height={20} />
              <SkeletonLine width={60} height={12} />
            </View>
            <View style={[styles.statCard, { gap: 6 }]}>
              <SkeletonLine width={40} height={20} />
              <SkeletonLine width={60} height={12} />
            </View>
            <View style={[styles.statCard, { gap: 6 }]}>
              <SkeletonLine width={40} height={20} />
              <SkeletonLine width={60} height={12} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  const handleToggleOnline = async (value: boolean) => {
    setTogglingOnline(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      let shouldStopBgAfterSuccess = false;

      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showToast(`${t('profile.noLocationAccess')}. ${t('profile.allowLocationOnline')}`, 'warning', 5000);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;

        setBackgroundLocationToken(token ?? null);
        try {
          await startBackgroundLocationUpdates();
        } catch {
          // Do not block online mode if background tracking isn't available on this runtime/build.
          showToast(`${t('profile.bgLocationUnavailable')}. ${t('profile.bgLocationUnavailableMsg')}`, 'warning', 5000);
        }
      } else {
        shouldStopBgAfterSuccess = true;
      }

      await apiFetch('/medics/location', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ isOnline: value, latitude, longitude }),
      });
      if (shouldStopBgAfterSuccess) {
        await stopBackgroundLocationUpdates();
      }
      updateOnlineStatus(value);
      trackEvent('toggle_online', { isOnline: value }).catch(() => {});
      if (value) setHasAlwaysLocation(true);
    } catch (e: unknown) {
      if (value) {
        stopBackgroundLocationUpdates().catch(() => {});
        setHasAlwaysLocation(false);
      }
      showToast(e instanceof Error ? e.message : t('profile.errorUpdateStatus'), 'error');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleEnableAlwaysLocation = async () => {
    try {
      const granted = await requestBackgroundLocationPermission();
      setHasAlwaysLocation(granted);
      if (!granted) {
        Alert.alert(
          t('profile.permissionNotGranted'),
          t('profile.permissionNotGrantedMsg'),
        );
      }
    } catch {
      showToast(t('profile.errorPermission'), 'error');
    }
  };

  const handlePickPhoto = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain) {
        showToast(`${t('profile.noGalleryAccess')}. ${t('profile.allowGalleryAccess')}`, 'warning');
      } else {
        Alert.alert(
          t('profile.noGalleryAccessTitle'),
          t('profile.noGalleryAccessMsg'),
          [
            { text: t('profile.cancel'), style: 'cancel' },
            { text: t('profile.openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, name: `photo.${ext}`, type: `image/${ext}` } as any);

      const res = await fetch(`${API_BASE}/medics/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(t('profile.photoUploadError'));
      await refreshProfile();
    } catch {
      showToast(t('profile.photoUploadError'), 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => setLogoutModal(true);

  const handleConnectTelegram = () => {
    // Deep link: opens bot with /start {medicId} pre-filled — bot auto-links account
    const deepLink = `tg://resolve?domain=${TELEGRAM_BOT}&start=${medic?.id ?? ''}`;
    const webFallback = `https://t.me/${TELEGRAM_BOT}?start=${medic?.id ?? ''}`;
    Linking.canOpenURL(deepLink)
      .then((ok) => Linking.openURL(ok ? deepLink : webFallback))
      .catch(() => Linking.openURL(webFallback));
  };

  const handleDisconnectTelegram = () => setTgDisconnectModal(true);

  const confirmDisconnectTelegram = async () => {
    setTgDisconnectModal(false);
    setDisconnectingTg(true);
    try {
      await apiFetch('/medics/telegram-chat-id', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ chatId: null }),
      });
      await refreshProfile();
    } catch {
      showToast(t('profile.errorTelegramDisconnect'), 'error');
    } finally {
      setDisconnectingTg(false);
    }
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <ProfileHeader
        medic={medic}
        ratingDisplay={ratingDisplay}
        uploadingPhoto={uploadingPhoto}
        onPickPhoto={handlePickPhoto}
        reviewLabel={t('review.reviews')}
        noReviewsLabel={t('review.noReviews')}
      />

      {/* Verification status card */}
      <VerificationCard
        verificationStatus={medic.verificationStatus}
        onPress={() => router.push('/verification')}
        t={t}
      />

      {/* Online toggle */}
      <OnlineToggle
        isOnline={medic.isOnline}
        onToggle={handleToggleOnline}
        loading={togglingOnline}
        onlineLabel={t('profile.online')}
        offlineLabel={t('profile.offline')}
        onlineHint={t('profile.onlineHint')}
        offlineHint={t('profile.offlineHint')}
        hasAlwaysLocation={hasAlwaysLocation}
        alwaysLocationOffLabel={t('profile.alwaysLocationOff')}
        alwaysLocationMsg={t('profile.alwaysLocationMsg')}
        allowAlwaysLabel={t('profile.allowAlways')}
        onEnableAlwaysLocation={handleEnableAlwaysLocation}
      />

      {/* Stats */}
      <StatsSection
        experienceYears={medic.experienceYears}
        completedCount={completedCount}
        ratingDisplay={ratingDisplay}
        reviewCount={medic.reviewCount}
        balance={medic.balance}
        earnings={medic.earnings ?? 0}
        onRatingPress={() => router.push('/reviews')}
        t={t}
      />

      {/* Telegram */}
      <View style={styles.card}>
        <View style={styles.tgHeader}>
          <View style={styles.tgIconWrap}>
            <Text style={styles.tgIcon}>✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tgTitle}>{t('profile.telegramNotifications')}</Text>
            <Text style={styles.tgSubtitle}>
              {medic.telegramChatId
                ? t('profile.telegramNotificationsOn')
                : t('profile.telegramNotificationsOff')}
            </Text>
          </View>
          {medic.telegramChatId ? (
            <View style={styles.tgBadge}>
              <Text style={styles.tgBadgeText}>✓ {t('profile.telegramActive')}</Text>
            </View>
          ) : null}
        </View>

        {medic.telegramChatId ? (
          <Pressable
            style={({ pressed }) => [styles.tgDisconnectBtn, pressed && { opacity: 0.8 }]}
            onPress={handleDisconnectTelegram}
            disabled={disconnectingTg}
          >
            {disconnectingTg
              ? <ActivityIndicator color={Theme.textSecondary} size="small" />
              : <Text style={styles.tgDisconnectText}>{t('profile.telegramDisconnect')}</Text>}
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.tgConnectBtn, pressed && { opacity: 0.85 }]}
            onPress={handleConnectTelegram}
          >
            <Text style={styles.tgConnectText}>{t('profile.telegramConnectVia')}</Text>
          </Pressable>
        )}
      </View>

      {/* Channel banner — shown once Telegram is connected */}
      {medic.telegramChatId && (
        <Pressable
          style={({ pressed }) => [styles.channelBanner, pressed && { opacity: 0.88 }]}
          onPress={() => Linking.openURL(TELEGRAM_CHANNEL)}
        >
          <Text style={styles.channelEmoji}>📢</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.channelTitle}>{t('profile.channelTitle')}</Text>
            <Text style={styles.channelSub}>{t('profile.channelSub')}</Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color="#0e7490" />
        </Pressable>
      )}

      {/* Work zone */}
      <Pressable
        style={({ pressed }) => [styles.workZoneCard, pressed && { opacity: 0.88 }]}
        onPress={() => router.push('/work-zone')}
      >
        <View style={styles.workZoneIconWrap}>
          <FontAwesome name="map-o" size={18} color={Theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workZoneTitle}>{t('geofence.workZone')}</Text>
          <Text style={styles.workZoneSubtitle}>
            {medic.workZoneRadius != null
              ? `${t('geofence.zoneActive')} — ${medic.workZoneRadius} ${t('geofence.km')}`
              : t('geofence.noZone')}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={13} color={Theme.textSecondary} />
      </Pressable>

      {/* Language picker */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>{t('language.title')}</Text>
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

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
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

    <AppModal
      visible={tgDisconnectModal}
      title={t('profile.telegramDisconnectTitle')}
      message={t('profile.telegramDisconnectMessage')}
      buttons={[
        { text: t('profile.cancel'), style: 'cancel', onPress: () => setTgDisconnectModal(false) },
        { text: t('profile.telegramDisconnect'), style: 'destructive', onPress: confirmDisconnectTelegram },
      ]}
      onClose={() => setTgDisconnectModal(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  content: { paddingBottom: 40 },
  card: {
    margin: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
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
  channelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#e0f2fe',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 14,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  channelEmoji: { fontSize: 20 },
  channelTitle: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: '#0c4a6e' },
  channelSub: { fontSize: Typography.caption.fontSize, color: '#0e7490', marginTop: 1 },
  tgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 14,
  },
  tgIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgIcon: { fontSize: 20 },
  tgTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.text },
  tgSubtitle: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2 },
  tgBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  tgBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  tgConnectBtn: {
    backgroundColor: '#229ED9',
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tgConnectText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fff' },
  tgDisconnectBtn: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tgDisconnectText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.textSecondary },
  workZoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  workZoneIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workZoneTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.text },
  workZoneSubtitle: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Theme.error}40`,
    backgroundColor: `${Theme.error}08`,
  },
  logoutBtnPressed: { opacity: 0.8 },
  logoutText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Theme.error },
  cardSectionTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  langBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
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
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: Theme.textSecondary,
  },
  langBtnTextActive: {
    color: Theme.primary,
    fontWeight: '700',
  },
});

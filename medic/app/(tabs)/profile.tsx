import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AppModal from '@/components/AppModal';
import { SkeletonProfileHeader, SkeletonLine } from '@/components/SkeletonLoader';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
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
import { TELEGRAM_CHANNEL, getMedicDeepLink } from '@/constants/telegram';

interface OrderCount { id: string; status: string; }

export default function ProfileScreen() {
  const { medic, token, updateOnlineStatus, refreshProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [disconnectingTg, setDisconnectingTg] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [tgDisconnectModal, setTgDisconnectModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCard, setWithdrawCard] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
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
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
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
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, name: `photo.${ext}`, type: mimeType } as any);

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

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) { showToast("Summani kiriting", 'error'); return; }
    if (amount > Number(medic.balance ?? 0)) { showToast("Balans yetarli emas", 'error'); return; }
    setWithdrawSubmitting(true);
    try {
      await apiFetch('/medics/me/withdrawal-request', {
        token,
        method: 'POST',
        body: JSON.stringify({ amount, cardNumber: withdrawCard.trim() || undefined }),
      });
      showToast("So'rov yuborildi", 'success');
      setWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawCard('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Xatolik", 'error');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleLogout = () => setLogoutModal(true);

  const handleConnectTelegram = () => {
    const { deepLink, webFallback } = getMedicDeepLink(medic?.id ?? '');
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      {/* Header */}
      <ProfileHeader
        medic={medic}
        ratingDisplay={ratingDisplay}
        uploadingPhoto={uploadingPhoto}
        onPickPhoto={handlePickPhoto}
        reviewLabel={t('review.reviews')}
        noReviewsLabel={t('review.noReviews')}
        onSaveName={async (name: string) => {
          await apiFetch('/medics/profile', { token, method: 'PATCH', body: JSON.stringify({ name }) });
          (medic as any).name = name;
        }}
        editNameLabel={t('editProfile.title', { defaultValue: 'Tahrirlash' })}
        saveLabel={t('editProfile.save', { defaultValue: 'Saqlash' })}
      />

      {/* Earnings / Balance gradient card */}
      <View style={styles.earningsCardWrap}>
        <LinearGradient
          colors={Theme.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsRow}>
            <View style={styles.earningsCol}>
              <Text style={styles.earningsLabel}>{t('profile.balance', { defaultValue: 'Balans' })}</Text>
              <Text style={styles.earningsValue}>{(medic.balance ?? 0).toLocaleString('ru-RU')} UZS</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsCol}>
              <Text style={styles.earningsLabel}>{t('profile.earnings', { defaultValue: 'Daromad' })}</Text>
              <Text style={styles.earningsValue}>{(medic.earnings ?? 0).toLocaleString('ru-RU')} UZS</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Withdraw button */}
      {Number(medic.balance ?? 0) > 0 && (
        <Pressable
          style={({ pressed }) => [wdStyles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => setWithdrawModal(true)}
        >
          <FontAwesome name="credit-card" size={16} color="#fff" />
          <Text style={wdStyles.btnText}>Mablag' yechish</Text>
        </Pressable>
      )}

      {/* Withdraw modal */}
      <Modal visible={withdrawModal} transparent animationType="fade">
        <View style={wdStyles.overlay}>
          <View style={wdStyles.modal}>
            <Text style={wdStyles.title}>Mablag' yechish</Text>
            <Text style={wdStyles.sub}>Balans: {Number(medic.balance ?? 0).toLocaleString()} UZS</Text>
            <TextInput
              style={wdStyles.input}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Summa (UZS)"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="numeric"
            />
            <TextInput
              style={wdStyles.input}
              value={withdrawCard}
              onChangeText={setWithdrawCard}
              placeholder="Karta raqami (ixtiyoriy)"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="numeric"
              maxLength={16}
            />
            <Pressable
              style={[wdStyles.submit, withdrawSubmitting && { opacity: 0.6 }]}
              onPress={handleWithdraw}
              disabled={withdrawSubmitting}
            >
              {withdrawSubmitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={wdStyles.submitText}>Yuborish</Text>
              }
            </Pressable>
            <Pressable onPress={() => setWithdrawModal(false)} style={wdStyles.cancel}>
              <Text style={wdStyles.cancelText}>Bekor qilish</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

      {/* Menu items */}
      <View style={styles.menuSection}>
        {/* Schedule */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/schedule')}
        >
          <View style={styles.menuIconWrap}>
            <FontAwesome name="calendar" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('profile.schedule', { defaultValue: 'Ish jadvali' })}</Text>
            <Text style={styles.menuSubtitle}>
              {t('profile.scheduleDesc', { defaultValue: 'Ish kunlari va soatlarini sozlash' })}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>

        {/* Work zone */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/work-zone')}
        >
          <View style={styles.menuIconWrap}>
            <FontAwesome name="map-o" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('geofence.workZone')}</Text>
            <Text style={styles.menuSubtitle}>
              {medic.workZoneRadius != null
                ? `${t('geofence.zoneActive')} - ${medic.workZoneRadius} ${t('geofence.km')}`
                : t('geofence.noZone')}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>

        {/* Reviews */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/reviews')}
        >
          <View style={styles.menuIconWrap}>
            <FontAwesome name="star" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('review.reviews')}</Text>
            <Text style={styles.menuSubtitle}>
              {ratingDisplay ? `${ratingDisplay} / 5.0` : t('review.noReviews')}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>

        {/* Documents / Verification */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/verification')}
        >
          <View style={styles.menuIconWrap}>
            <FontAwesome name="file-text-o" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('profile.documents', { defaultValue: 'Hujjatlar' })}</Text>
            <Text style={styles.menuSubtitle}>
              {t(`profile.verStatus_${medic.verificationStatus}`, { defaultValue: medic.verificationStatus })}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>

        {/* Language */}
        <View style={styles.menuItem}>
          <View style={styles.menuIconWrap}>
            <FontAwesome name="globe" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('language.title')}</Text>
          </View>
          <View style={styles.langToggle}>
            {(['uz', 'ru'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                style={[styles.langPill, language === lang && styles.langPillActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langPillText, language === lang && styles.langPillTextActive]}>
                  {lang.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Telegram */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.88 }]}
          onPress={medic.telegramChatId ? handleDisconnectTelegram : handleConnectTelegram}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <FontAwesome6 name="telegram" size={18} color="#229ED9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('profile.telegramNotifications')}</Text>
            <Text style={styles.menuSubtitle}>
              {medic.telegramChatId
                ? t('profile.telegramNotificationsOn')
                : t('profile.telegramNotificationsOff')}
            </Text>
          </View>
          {medic.telegramChatId ? (
            <View style={styles.tgBadge}>
              <Text style={styles.tgBadgeText}>{t('profile.telegramActive')}</Text>
            </View>
          ) : (
            <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
          )}
        </Pressable>
      </View>

      {/* Channel banner */}
      {medic.telegramChatId && (
        <Pressable
          style={({ pressed }) => [styles.channelBanner, pressed && { opacity: 0.88 }]}
          onPress={() => Linking.openURL(TELEGRAM_CHANNEL)}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <FontAwesome name="bullhorn" size={16} color="#0e7490" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('profile.channelTitle')}</Text>
            <Text style={styles.menuSubtitle}>{t('profile.channelSub')}</Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>
      )}

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
  content: { paddingBottom: 100 },

  earningsCardWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  earningsCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    fontFamily: Fonts.inter,
    fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  earningsValue: {
    fontFamily: Fonts.manropeBd,
    fontSize: Typography.numeric.fontSize,
    color: Theme.textInverse,
  },
  earningsDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  card: {
    margin: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    ...Shadow.sm,
  },

  menuSection: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    ...Shadow.sm,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
  },
  menuSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: Typography.caption.fontSize,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  langToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.full,
    padding: 3,
  },
  langPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  langPillActive: {
    backgroundColor: Theme.primary,
  },
  langPillText: {
    fontFamily: Fonts.interSb,
    fontSize: Typography.caption.fontSize,
    color: Theme.textSecondary,
  },
  langPillTextActive: {
    color: Theme.textInverse,
  },

  tgBadge: {
    backgroundColor: Theme.successContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  tgBadgeText: {
    fontFamily: Fonts.interSb,
    fontSize: 11,
    color: Theme.success,
  },

  channelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: Theme.errorContainer,
    marginBottom: Spacing.xxl,
  },
  logoutText: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.body.fontSize,
    color: Theme.error,
  },
});

const wdStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginHorizontal: Spacing.lg,
  },
  btnText: { color: '#fff', fontFamily: Fonts.manropeSb, fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: Theme.surface, borderRadius: Radius.lg, padding: 24, gap: 14 },
  title: { fontFamily: Fonts.manropeBd, fontSize: 18, color: Theme.text, textAlign: 'center' },
  sub: { fontFamily: Fonts.inter, fontSize: 14, color: Theme.textSecondary, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: Theme.border, borderRadius: Radius.md,
    padding: 12, fontSize: 16, fontFamily: Fonts.inter, color: Theme.text,
    backgroundColor: Theme.background,
  },
  submit: { backgroundColor: Theme.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontFamily: Fonts.manropeSb, fontSize: 15 },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontFamily: Fonts.inter, fontSize: 14, color: Theme.textSecondary },
});

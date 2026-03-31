import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppModal from '@/components/AppModal';
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { apiFetch, API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n';
import {
  hasBackgroundLocationPermission,
  requestBackgroundLocationPermission,
  setBackgroundLocationToken,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '@/utils/backgroundLocation';

const TELEGRAM_BOT = 'hamshirago_medic_bot';
const TELEGRAM_CHANNEL = 'https://t.me/hamshirago_medics'; // канал для медиков

interface OrderCount { id: string; status: string; }

const VERIFICATION_CONFIG = {
  PENDING:  { labelKey: 'verification.statusPending',  color: '#f59e0b', icon: 'clock-o' as const,     bg: '#fef3c720', border: '#f59e0b40' },
  APPROVED: { labelKey: 'verification.statusApproved',  color: '#10b981', icon: 'check-circle' as const, bg: '#d1fae520', border: '#10b98140' },
  REJECTED: { labelKey: 'verification.statusRejected',  color: '#ef4444', icon: 'times-circle' as const, bg: '#fee2e220', border: '#ef444440' },
};

export default function ProfileScreen() {
  const { medic, token, updateOnlineStatus, refreshProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
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
      .then((res) => setCompletedCount(res.total ?? res.data.length))
      .catch(() => {});
  }, [token]);

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

  if (!medic) return null;

  const handleToggleOnline = async (value: boolean) => {
    setTogglingOnline(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      let shouldStopBgAfterSuccess = false;

      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('profile.noLocationAccess'), t('profile.allowLocationOnline'));
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
          Alert.alert(
            t('profile.bgLocationUnavailable'),
            t('profile.bgLocationUnavailableMsg'),
          );
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
      if (value) setHasAlwaysLocation(true);
    } catch (e: unknown) {
      if (value) {
        stopBackgroundLocationUpdates().catch(() => {});
        setHasAlwaysLocation(false);
      }
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.errorUpdateStatus'));
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
      Alert.alert(t('common.error'), t('profile.errorPermission'));
    }
  };

  const handlePickPhoto = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain) {
        Alert.alert(t('profile.noGalleryAccess'), t('profile.allowGalleryAccess'));
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
      Alert.alert(t('common.error'), t('profile.photoUploadError'));
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
      Alert.alert(t('common.error'), t('profile.errorTelegramDisconnect'));
    } finally {
      setDisconnectingTg(false);
    }
  };

  const vStatus = (medic.verificationStatus ?? 'PENDING') as keyof typeof VERIFICATION_CONFIG;
  const vConfig = VERIFICATION_CONFIG[vStatus];

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={Theme.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable style={styles.avatarWrap} onPress={handlePickPhoto} disabled={uploadingPhoto}>
          {medic.profilePhotoUrl ? (
            <Image source={{ uri: medic.profilePhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{medic.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {uploadingPhoto ? (
            <View style={styles.avatarBadge}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarBadge}>
              <FontAwesome name="camera" size={10} color="#fff" />
            </View>
          )}
        </Pressable>
        <Text style={styles.name}>{medic.name}</Text>
        <Text style={styles.phone}>{medic.phone}</Text>
        {medic.rating != null && (
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={14} color="#fde68a" />
            <Text style={styles.ratingText}>{Number(medic.rating).toFixed(1)}</Text>
            {medic.reviewCount > 0 ? (
              <Text style={styles.reviewCountText}>
                ({medic.reviewCount} {t('review.reviews')})
              </Text>
            ) : (
              <Text style={styles.reviewCountText}>{t('review.noReviews')}</Text>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Verification status card */}
      <Pressable
        style={[styles.verifyCard, { backgroundColor: vConfig.bg, borderColor: vConfig.border }]}
        onPress={() => router.push('/verification')}
      >
        <FontAwesome name={vConfig.icon} size={20} color={vConfig.color} />
        <View style={styles.verifyTexts}>
          <Text style={[styles.verifyTitle, { color: vConfig.color }]}>{t(vConfig.labelKey)}</Text>
          <Text style={styles.verifyHint}>
            {vStatus === 'APPROVED'
              ? t('profile.verifiedHint')
              : t('profile.verifyHint')}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={13} color={vConfig.color} />
      </Pressable>

      {/* Online toggle */}
      <View style={styles.card}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineInfo}>
            <View style={[styles.dot, { backgroundColor: medic.isOnline ? Theme.success : Theme.textSecondary }]} />
            <View>
              <Text style={styles.onlineLabel}>
                {medic.isOnline ? t('profile.online') : t('profile.offline')}
              </Text>
              <Text style={styles.onlineHint}>
                {medic.isOnline
                  ? t('profile.onlineHint')
                  : t('profile.offlineHint')}
              </Text>
            </View>
          </View>
          {togglingOnline ? (
            <ActivityIndicator color={Theme.primary} />
          ) : (
            <Switch
              value={medic.isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: Theme.border, true: `${Theme.primary}80` }}
              thumbColor={medic.isOnline ? Theme.primary : Theme.textSecondary}
            />
          )}
        </View>
      </View>

      {medic.isOnline && !hasAlwaysLocation && (
        <View style={[styles.card, styles.locationWarningCard]}>
          <View style={styles.warningRow}>
            <FontAwesome name="exclamation-triangle" size={16} color="#92400e" />
            <Text style={styles.warningTitle}>{t('profile.alwaysLocationOff')}</Text>
          </View>
          <Text style={styles.warningText}>
            {t('profile.alwaysLocationMsg')}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.warningBtn, pressed && { opacity: 0.85 }]}
            onPress={handleEnableAlwaysLocation}
          >
            <Text style={styles.warningBtnText}>{t('profile.allowAlways')}</Text>
          </Pressable>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{medic.experienceYears}</Text>
          <Text style={styles.statLabel}>{t('profile.statExperience')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount ?? '—'}</Text>
          <Text style={styles.statLabel}>{t('profile.statCompleted')}</Text>
        </View>
        {medic.rating != null && (
          <Pressable style={styles.statCard} onPress={() => router.push('/reviews')}>
            <Text style={styles.statValue}>{Number(medic.rating).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('profile.statRating')}</Text>
            <Text style={styles.statReviewCount}>{medic.reviewCount} {t('review.reviews')}</Text>
          </Pressable>
        )}
      </View>

      {/* Balances — always visible */}
      <View style={styles.balancesRow}>
        <View style={[styles.walletCard, styles.balanceHalf]}>
          <Text style={styles.walletLabel}>{t('profile.balance')}</Text>
          <Text style={styles.walletValue}>
            {Number(medic.balance).toLocaleString('ru-RU')} UZS
          </Text>
          <Text style={styles.walletHint}>{t('profile.workDeposit')}</Text>
        </View>
        <View style={[styles.walletCard, styles.balanceHalf, styles.earningsCard]}>
          <Text style={styles.walletLabel}>{t('profile.earnings')}</Text>
          <Text style={[styles.walletValue, styles.earningsValue]}>
            {Number(medic.earnings ?? 0).toLocaleString('ru-RU')} UZS
          </Text>
          <Text style={styles.walletHint}>{t('profile.totalEarned')}</Text>
        </View>
      </View>

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
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    marginBottom: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 15, fontWeight: '700', color: '#fde68a' },
  reviewCountText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  verifyTexts: { flex: 1 },
  verifyTitle: { fontSize: 15, fontWeight: '700' },
  verifyHint: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },

  card: {
    margin: 16,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  onlineLabel: { fontSize: 16, fontWeight: '700', color: Theme.text },
  onlineHint: { fontSize: 13, color: Theme.textSecondary, marginTop: 2 },
  locationWarningCard: {
    marginTop: -4,
    backgroundColor: '#fef3c720',
    borderColor: '#f59e0b40',
  },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  warningText: { fontSize: 13, lineHeight: 18, color: '#78350f', marginBottom: 12 },
  warningBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  warningBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: Theme.primary },
  statLabel: { fontSize: 12, color: Theme.textSecondary, marginTop: 2, textAlign: 'center' },
  statReviewCount: { fontSize: 10, color: Theme.textSecondary, textAlign: 'center', marginTop: 1 },
  balancesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  balanceHalf: { flex: 1, marginBottom: 0, marginHorizontal: 0, paddingHorizontal: 12, paddingVertical: 12 },
  earningsCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac40',
  },
  walletCard: {
    backgroundColor: `${Theme.primary}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  walletLabel: { fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 4 },
  walletValue: { fontSize: 17, fontWeight: '700', color: Theme.primary },
  walletHint: { fontSize: 11, color: Theme.textSecondary, marginTop: 2 },
  earningsValue: { color: '#16a34a' },
  channelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  channelEmoji: { fontSize: 20 },
  channelTitle: { fontSize: 14, fontWeight: '700', color: '#0c4a6e' },
  channelSub: { fontSize: 12, color: '#0e7490', marginTop: 1 },
  tgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  tgTitle: { fontSize: 15, fontWeight: '700', color: Theme.text },
  tgSubtitle: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },
  tgBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tgBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  tgConnectBtn: {
    backgroundColor: '#229ED9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tgConnectText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  tgDisconnectBtn: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tgDisconnectText: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  workZoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
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
  workZoneTitle: { fontSize: 15, fontWeight: '700', color: Theme.text },
  workZoneSubtitle: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Theme.error}40`,
    backgroundColor: `${Theme.error}08`,
  },
  logoutBtnPressed: { opacity: 0.8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: Theme.error },

  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
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
});

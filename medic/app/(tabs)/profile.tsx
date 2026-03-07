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
import { apiFetch } from '@/constants/api';
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

const TELEGRAM_BOT_LINK = 'https://t.me/hamshirago_medic_bot?start=connect';

interface OrderCount { id: string; status: string; }

const VERIFICATION_CONFIG = {
  PENDING:  { label: 'Ожидает проверки', color: '#f59e0b', icon: 'clock-o' as const,     bg: '#fef3c720', border: '#f59e0b40' },
  APPROVED: { label: 'Верифицирован',    color: '#10b981', icon: 'check-circle' as const, bg: '#d1fae520', border: '#10b98140' },
  REJECTED: { label: 'Отклонено',        color: '#ef4444', icon: 'times-circle' as const, bg: '#fee2e220', border: '#ef444440' },
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
    apiFetch<{ data: OrderCount[] }>('/orders/medic/my?limit=100', { token })
      .then((res) => setCompletedCount(res.data.filter((o) => o.status === 'DONE').length))
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
          Alert.alert('Нет доступа к геолокации', 'Разрешите геолокацию, чтобы перейти в онлайн.');
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
            'Фоновая геолокация недоступна',
            'Онлайн-режим включён, но фоновое отслеживание пока неактивно. Откройте настройки и разрешите доступ "Всегда".',
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
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось обновить статус');
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
          'Разрешение не выдано',
          'Нужно выбрать "Всегда", иначе клиент может видеть устаревшее местоположение.',
        );
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось запросить разрешение на фоновую геолокацию');
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках.');
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

      const API_BASE = (await import('@/constants/api')).API_BASE;
      const res = await fetch(`${API_BASE}/medics/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Ошибка загрузки фото');
      await refreshProfile();
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить фото. Попробуйте ещё раз.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => setLogoutModal(true);

  const handleConnectTelegram = () => {
    Linking.openURL(TELEGRAM_BOT_LINK);
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
      Alert.alert('Ошибка', 'Не удалось отключить Telegram');
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
          <Text style={[styles.verifyTitle, { color: vConfig.color }]}>{vConfig.label}</Text>
          <Text style={styles.verifyHint}>
            {vStatus === 'APPROVED'
              ? 'Аккаунт подтверждён — вы можете принимать заказы'
              : 'Нажмите чтобы загрузить документы'}
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
                {medic.isOnline ? 'Онлайн' : 'Офлайн'}
              </Text>
              <Text style={styles.onlineHint}>
                {medic.isOnline
                  ? 'Вы получаете новые заказы'
                  : 'Включите чтобы принимать заказы'}
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
            <Text style={styles.warningTitle}>Выключено "Всегда"</Text>
          </View>
          <Text style={styles.warningText}>
            Чтобы клиент видел ваше актуальное местоположение, включите доступ к геолокации «Всегда».
          </Text>
          <Pressable
            style={({ pressed }) => [styles.warningBtn, pressed && { opacity: 0.85 }]}
            onPress={handleEnableAlwaysLocation}
          >
            <Text style={styles.warningBtnText}>Разрешить всегда</Text>
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
          <Text style={styles.statValue}>
            {completedCount ?? '—'}
          </Text>
          <Text style={styles.statLabel}>{t('profile.statCompleted')}</Text>
        </View>
        {medic.rating != null ? (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Number(medic.rating).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('profile.statRating')}</Text>
          </View>
        ) : (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Number(medic.balance).toLocaleString('ru-RU')}
            </Text>
            <Text style={styles.statLabel}>{t('profile.statBalance')}</Text>
          </View>
        )}
      </View>

      {/* Telegram */}
      <View style={styles.card}>
        <View style={styles.tgHeader}>
          <View style={styles.tgIconWrap}>
            <Text style={styles.tgIcon}>✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tgTitle}>Telegram уведомления</Text>
            <Text style={styles.tgSubtitle}>
              {medic.telegramChatId
                ? 'Уведомления о новых заказах включены'
                : 'Получайте заказы даже когда приложение закрыто'}
            </Text>
          </View>
          {medic.telegramChatId ? (
            <View style={styles.tgBadge}>
              <Text style={styles.tgBadgeText}>✓ Активно</Text>
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
              : <Text style={styles.tgDisconnectText}>Отключить</Text>}
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.tgConnectBtn, pressed && { opacity: 0.85 }]}
            onPress={handleConnectTelegram}
          >
            <Text style={styles.tgConnectText}>Подключить через Telegram</Text>
          </Pressable>
        )}
      </View>

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
      title="Отключить Telegram?"
      message="Вы больше не будете получать уведомления о новых заказах в Telegram."
      buttons={[
        { text: 'Отмена', style: 'cancel', onPress: () => setTgDisconnectModal(false) },
        { text: 'Отключить', style: 'destructive', onPress: confirmDisconnectTelegram },
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

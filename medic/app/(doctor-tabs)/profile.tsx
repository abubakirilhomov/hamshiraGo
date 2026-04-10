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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch, API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { VerificationCard } from '@/components/profile/VerificationCard';
import { getDoctorDeepLink } from '@/constants/telegram';

export default function DoctorProfileScreen() {
  const { medic, token, refreshProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [logoutModal, setLogoutModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [consultationCount, setConsultationCount] = useState<number | null>(null);
  const [disconnectingTg, setDisconnectingTg] = useState(false);
  const [tgDisconnectModal, setTgDisconnectModal] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: unknown[]; total: number }>('/consultations/doctor/my?status=COMPLETED&limit=1', { token })
      .then((res) => {
        setConsultationCount(res.total ?? res.data?.length ?? 0);
      })
      .catch(() => {});
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const ratingDisplay = useMemo(() => {
    if (medic?.rating == null) return null;
    return Number(medic.rating).toFixed(1);
  }, [medic?.rating]);

  const handlePickPhoto = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Ruxsat kerak',
          'Galereya uchun ruxsat bering',
          [
            { text: 'Bekor qilish', style: 'cancel' },
            { text: 'Sozlamalar', onPress: () => Linking.openSettings() },
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

      const res = await fetch(`${API_BASE}/doctors/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Rasm yuklab bo\'lmadi');
      await refreshProfile();
    } catch {
      showToast('Rasm yuklab bo\'lmadi', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleConnectTelegram = () => {
    const { deepLink, webFallback } = getDoctorDeepLink(medic?.id ?? '');
    Linking.canOpenURL(deepLink)
      .then((ok) => Linking.openURL(ok ? deepLink : webFallback))
      .catch(() => Linking.openURL(webFallback));
  };

  const handleDisconnectTelegram = () => setTgDisconnectModal(true);

  const confirmDisconnectTelegram = async () => {
    setTgDisconnectModal(false);
    setDisconnectingTg(true);
    try {
      await apiFetch('/doctors/telegram-chat-id', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ chatId: null }),
      });
      await refreshProfile();
    } catch {
      showToast('Telegram uzib bo\'lmadi', 'error');
    } finally {
      setDisconnectingTg(false);
    }
  };

  if (!medic) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ProfileHeader
          medic={medic}
          ratingDisplay={ratingDisplay}
          uploadingPhoto={uploadingPhoto}
          onPickPhoto={handlePickPhoto}
          reviewLabel="Sharhlar"
          noReviewsLabel="Sharhlar yo'q"
          onSaveName={async (name: string) => {
            await apiFetch('/doctors/profile', { token: token ?? undefined, method: 'PATCH', body: JSON.stringify({ name }) });
            (medic as any).name = name;
          }}
          editNameLabel="Tahrirlash"
          saveLabel="Saqlash"
        />

        {/* Verification */}
        <View style={styles.section}>
          <VerificationCard
            verificationStatus={medic.verificationStatus}
            onPress={() => router.push('/verification')}
            t={(key: string) => {
              const labels: Record<string, string> = {
                'profile.verified': 'Tasdiqlangan',
                'profile.pendingVerification': 'Tekshirilmoqda',
                'profile.rejected': 'Rad etilgan',
                'profile.verificationPending': 'Akkaunt tekshirilmoqda',
                'profile.verificationApproved': 'Akkaunt tasdiqlangan',
                'profile.verificationRejected': 'Akkaunt rad etilgan',
                'profile.tapToVerify': 'Hujjatlarni yuborish',
              };
              return labels[key] ?? key;
            }}
          />
        </View>

        {/* Specialization */}
        {medic.specialization && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Mutaxassislik</Text>
            <View style={styles.specRow}>
              <View style={styles.specIconWrap}>
                <FontAwesome name="stethoscope" size={16} color={Theme.primary} />
              </View>
              <Text style={styles.specText}>{medic.specialization}</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consultationCount ?? '-'}</Text>
            <Text style={styles.statLabel}>Konsultatsiyalar</Text>
          </View>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/reviews')}
          >
            <Text style={styles.statValue}>{ratingDisplay ?? '-'}</Text>
            <Text style={styles.statLabel}>Reyting</Text>
            {medic.reviewCount > 0 && (
              <Text style={styles.statSub}>{medic.reviewCount} sharh</Text>
            )}
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(medic.balance ?? 0).toLocaleString('uz-UZ')}
            </Text>
            <Text style={styles.statLabel}>Balans (UZS)</Text>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Daromad</Text>
          <Text style={styles.earningsValue}>
            {(medic.earnings ?? 0).toLocaleString('uz-UZ')} UZS
          </Text>
        </View>

        {/* Telegram */}
        <View style={styles.card}>
          <View style={styles.tgHeader}>
            <View style={styles.tgIconWrap}>
              <FontAwesome name="paper-plane" size={16} color={Theme.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tgTitle}>Telegram bildirishnomalar</Text>
              <Text style={styles.tgSubtitle}>
                {medic.telegramChatId ? 'Ulangan' : 'Ulanmagan'}
              </Text>
            </View>
            {medic.telegramChatId && (
              <View style={styles.tgBadge}>
                <Text style={styles.tgBadgeText}>Faol</Text>
              </View>
            )}
          </View>

          {medic.telegramChatId ? (
            <Pressable
              style={({ pressed }) => [styles.tgDisconnectBtn, pressed && { opacity: 0.8 }]}
              onPress={handleDisconnectTelegram}
              disabled={disconnectingTg}
            >
              {disconnectingTg
                ? <ActivityIndicator color={Theme.textSecondary} size="small" />
                : <Text style={styles.tgDisconnectText}>Uzish</Text>}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.tgConnectBtn, pressed && { opacity: 0.85 }]}
              onPress={handleConnectTelegram}
            >
              <Text style={styles.tgConnectText}>Telegram orqali ulash</Text>
            </Pressable>
          )}
        </View>

        {/* Schedule link */}
        <Pressable
          style={({ pressed }) => [styles.menuCard, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/doctor-schedule')}
        >
          <View style={styles.menuIconWrap}>
            <FontAwesome name="calendar" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Jadval</Text>
            <Text style={styles.menuSubtitle}>Qabul vaqtlarini sozlash</Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textTertiary} />
        </Pressable>

        {/* Language */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Til</Text>
          <View style={styles.langRow}>
            {(['ru', 'uz'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                style={[styles.langBtn, language === lang && styles.langBtnActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                  {lang === 'ru' ? 'Russkiy' : 'O\'zbekcha'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setLogoutModal(true)}
        >
          <FontAwesome name="sign-out" size={16} color={Theme.error} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </Pressable>
      </ScrollView>

      <AppModal
        visible={logoutModal}
        title="Chiqishni tasdiqlang"
        message="Haqiqatan ham chiqmoqchimisiz?"
        buttons={[
          { text: 'Bekor qilish', style: 'cancel', onPress: () => setLogoutModal(false) },
          { text: 'Chiqish', style: 'destructive', onPress: logout },
        ]}
        onClose={() => setLogoutModal(false)}
      />

      <AppModal
        visible={tgDisconnectModal}
        title="Telegram uzish"
        message="Telegram bildirishnomalarni o'chirmoqchimisiz?"
        buttons={[
          { text: 'Bekor qilish', style: 'cancel', onPress: () => setTgDisconnectModal(false) },
          { text: 'Uzish', style: 'destructive', onPress: confirmDisconnectTelegram },
        ]}
        onClose={() => setTgDisconnectModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },
  content: { gap: 0 },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },

  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardSectionTitle: {
    ...Typography.caption,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  specIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specText: {
    ...Typography.body,
    fontFamily: Fonts.interSb,
    color: Theme.text,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statValue: {
    ...Typography.h3,
    color: Theme.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Theme.textSecondary,
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    marginTop: 2,
  },

  earningsValue: {
    ...Typography.h3,
    color: Theme.success,
  },

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
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgTitle: {
    ...Typography.body,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  tgSubtitle: {
    ...Typography.caption,
    color: Theme.textSecondary,
    marginTop: 2,
  },
  tgBadge: {
    backgroundColor: Theme.successContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  tgBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.manropeBd,
    color: Theme.success,
  },
  tgConnectBtn: {
    backgroundColor: '#229ED9',
    borderRadius: Radius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tgConnectText: {
    ...Typography.body,
    fontFamily: Fonts.manropeBd,
    color: Theme.textInverse,
  },
  tgDisconnectBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
  },
  tgDisconnectText: {
    ...Typography.bodySmall,
    fontFamily: Fonts.interSb,
    color: Theme.textSecondary,
  },

  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    ...Typography.body,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  langRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
  },
  langBtnActive: {
    backgroundColor: Theme.primaryLight,
  },
  langBtnText: {
    ...Typography.bodySmall,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  langBtnTextActive: {
    color: Theme.primary,
    fontFamily: Fonts.manropeBd,
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
  },
  logoutText: {
    ...Typography.body,
    fontFamily: Fonts.interSb,
    color: Theme.error,
  },
});

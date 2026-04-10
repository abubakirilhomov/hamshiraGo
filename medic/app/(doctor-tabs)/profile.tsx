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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <ProfileHeader
          medic={medic}
          ratingDisplay={ratingDisplay}
          uploadingPhoto={uploadingPhoto}
          onPickPhoto={handlePickPhoto}
          reviewLabel="Sharhlar"
          noReviewsLabel="Sharhlar yo'q"
          onSaveName={async (name: string) => {
            await apiFetch('/doctors/profile', { token, method: 'PATCH', body: JSON.stringify({ name }) });
            (medic as any).name = name;
          }}
          editNameLabel="Tahrirlash"
          saveLabel="Saqlash"
        />

        {/* Verification */}
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

        {/* Specialization */}
        {medic.specialization && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Mutaxassislik</Text>
            <View style={styles.specRow}>
              <FontAwesome name="stethoscope" size={16} color={Theme.primary} />
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
              <Text style={styles.tgIcon}>✈️</Text>
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
          style={({ pressed }) => [styles.scheduleCard, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/doctor-schedule')}
        >
          <View style={styles.scheduleIconWrap}>
            <FontAwesome name="calendar" size={18} color={Theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scheduleTitle}>Jadval</Text>
            <Text style={styles.scheduleSubtitle}>Qabul vaqtlarini sozlash</Text>
          </View>
          <FontAwesome name="chevron-right" size={13} color={Theme.textSecondary} />
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
                  {lang === 'ru' ? 'Русский' : 'O\'zbekcha'}
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
  content: { paddingBottom: 40 },

  card: {
    margin: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
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
  specText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
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
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Theme.primary,
  },
  statLabel: {
    fontSize: Typography.caption.fontSize,
    color: Theme.textSecondary,
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    color: Theme.textTertiary,
    marginTop: 2,
  },

  earningsValue: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
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

  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Theme.surface,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.text },
  scheduleSubtitle: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginTop: 2 },

  langRow: { flexDirection: 'row', gap: Spacing.sm },
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
  logoutText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Theme.error },
});

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type PhotoType = 'facePhoto' | 'licensePhoto';

export default function VerificationScreen() {
  const { medic, token, refreshProfile, logout } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [faceUri, setFaceUri] = useState<string | null>(medic?.facePhotoUrl ?? null);
  const [licenseUri, setLicenseUri] = useState<string | null>(medic?.licensePhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (medic?.facePhotoUrl) setFaceUri(medic.facePhotoUrl);
  }, [medic?.facePhotoUrl]);

  useEffect(() => {
    if (medic?.licensePhotoUrl) setLicenseUri(medic.licensePhotoUrl);
  }, [medic?.licensePhotoUrl]);

  const pickImage = async (type: PhotoType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast(`${t('verification.noGalleryAccess')}. ${t('verification.allowGalleryAccess')}`, 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'facePhoto') setFaceUri(result.assets[0].uri);
      else setLicenseUri(result.assets[0].uri);
    }
  };

  const takePhoto = async (type: PhotoType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast(`${t('verification.noCameraAccess')}. ${t('verification.allowCameraAccess')}`, 'warning');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'facePhoto') setFaceUri(result.assets[0].uri);
      else setLicenseUri(result.assets[0].uri);
    }
  };

  const showPickerOptions = (type: PhotoType, label: string) => {
    Alert.alert(t('verification.uploadSourceTitle', { label }), undefined, [
      { text: t('verification.camera'), onPress: () => takePhoto(type) },
      { text: t('verification.fromGallery'), onPress: () => pickImage(type) },
      { text: t('profile.cancel'), style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    const hasNewFace = faceUri && !faceUri.startsWith('http');
    const hasNewLicense = licenseUri && !licenseUri.startsWith('http');

    if (!hasNewFace && !hasNewLicense) {
      showToast(t('verification.photoRequired'), 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      if (hasNewFace && faceUri) {
        const ext = faceUri.split('.').pop() ?? 'jpg';
        formData.append('facePhoto', {
          uri: faceUri,
          name: `face.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as unknown as Blob);
      }

      if (hasNewLicense && licenseUri) {
        const ext = licenseUri.split('.').pop() ?? 'jpg';
        formData.append('licensePhoto', {
          uri: licenseUri,
          name: `license.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as unknown as Blob);
      }

      const controller = new AbortController();
      const uploadTimeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const res = await fetch(`${API_BASE}/medics/documents`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          signal: controller.signal,
        });

        if (res.status === 401) {
          logout();
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `HTTP ${res.status}`);
        }

        await refreshProfile();
        showToast(t('verification.submit'), 'success');
      } finally {
        clearTimeout(uploadTimeout);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        showToast(t('common.timeout') || 'Upload timed out', 'error');
      } else {
        showToast(e instanceof Error ? e.message : t('common.error'), 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const status = medic?.verificationStatus ?? 'PENDING';

  const statusConfig = {
    PENDING: { bg: Theme.warningContainer, color: Theme.warning, icon: 'clock-o' as const },
    APPROVED: { bg: Theme.successContainer, color: Theme.success, icon: 'check-circle' as const },
    REJECTED: { bg: Theme.errorContainer, color: Theme.error, icon: 'times-circle' as const },
  };
  const sc = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Verifikatsiya</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status badge ─────────────────────────────────────── */}
        <View style={[styles.statusCard, { backgroundColor: sc.bg }]}>
          <FontAwesome name={sc.icon} size={22} color={sc.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: sc.color }]}>
              {status === 'APPROVED' ? t('verification.statusApproved') : status === 'REJECTED' ? t('verification.statusRejected') : t('verification.statusPending')}
            </Text>
            <Text style={styles.statusDesc}>
              {status === 'PENDING' ? t('verification.descPending') : status === 'APPROVED' ? t('verification.descApproved') : t('verification.descRejected')}
            </Text>
          </View>
        </View>

        {/* ── Rejection reason ─────────────────────────────────── */}
        {status === 'REJECTED' && medic?.verificationRejectedReason && (
          <View style={styles.rejectedCard}>
            <Text style={styles.rejectedLabel}>{t('verification.rejectedReason')}:</Text>
            <Text style={styles.rejectedText}>{medic.verificationRejectedReason}</Text>
          </View>
        )}

        {/* ── Instructions ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('verification.whatToUpload')}</Text>
          <InstructionRow icon="user" text={t('verification.facePhotoHint')} />
          <InstructionRow icon="id-card" text={t('verification.licensePhotoHint')} />
        </View>

        {/* ── Face photo upload ─────────────────────────────────── */}
        <Text style={styles.uploadLabel}>{t('verification.uploadPhoto')}</Text>
        <PhotoBlock
          uri={faceUri}
          onPress={() => showPickerOptions('facePhoto', t('verification.uploadPhoto'))}
          t={t}
        />

        {/* ── License photo upload ─────────────────────────────── */}
        <Text style={styles.uploadLabel}>{t('verification.uploadDiploma')}</Text>
        <PhotoBlock
          uri={licenseUri}
          onPress={() => showPickerOptions('licensePhoto', t('verification.uploadDiploma'))}
          t={t}
        />

        {/* ── Submit CTA ───────────────────────────────────────── */}
        {status !== 'APPROVED' && (
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9 }, uploading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={uploading}
          >
            <LinearGradient
              colors={Theme.primaryGradient as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {uploading ? (
                <ActivityIndicator color={Theme.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>Yuborish</Text>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoBlock({ uri, onPress, t }: { uri: string | null; onPress: () => void; t: (k: string) => string }) {
  const isRemote = uri?.startsWith('http');
  return (
    <Pressable
      style={({ pressed }) => [styles.photoBlock, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.photoPreview} contentFit="cover" transition={200} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <FontAwesome name="camera" size={28} color={Theme.textTertiary} />
          <Text style={styles.photoPlaceholderText}>{t('verification.tapToSelect')}</Text>
        </View>
      )}
      {uri && (
        <View style={styles.photoOverlayBadge}>
          <FontAwesome name="check" size={12} color={Theme.success} />
          <Text style={styles.photoOverlayText}>
            {isRemote ? t('verification.uploaded') : t('verification.selected')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function InstructionRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.instructionRow}>
      <View style={styles.instructionIconWrap}>
        <FontAwesome name={icon as keyof typeof FontAwesome.glyphMap} size={14} color={Theme.primary} />
      </View>
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg },

  /* ── Header ──────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...Typography.h3,
    color: Theme.text,
  },

  /* ── Status card ─────────────────────────────────────────────── */
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  statusTitle: {
    ...Typography.h4,
  },
  statusDesc: {
    ...Typography.bodySmall,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  /* ── Rejection reason ────────────────────────────────────────── */
  rejectedCard: {
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  rejectedLabel: {
    ...Typography.caption,
    fontFamily: Fonts.interSb,
    color: Theme.error,
  },
  rejectedText: {
    ...Typography.bodySmall,
    color: Theme.text,
  },

  /* ── Card ─────────────────────────────────────────────────────── */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },

  /* ── Instructions ────────────────────────────────────────────── */
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  instructionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Theme.text,
    lineHeight: 20,
  },

  /* ── Photo upload ────────────────────────────────────────────── */
  uploadLabel: {
    ...Typography.label,
    color: Theme.textSecondary,
    marginBottom: -Spacing.sm,
  },
  photoBlock: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Theme.surfaceContainerLow,
    ...Shadow.sm,
  },
  photoPreview: {
    width: 120,
    height: 120,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  photoPlaceholderText: {
    ...Typography.caption,
    color: Theme.textTertiary,
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  photoOverlayText: {
    fontSize: 10,
    fontFamily: Fonts.interSb,
    color: Theme.success,
  },

  /* ── Submit CTA ──────────────────────────────────────────────── */
  submitBtn: {
    borderRadius: Radius.full,
    paddingVertical: 17,
    alignItems: 'center',
  },
  submitBtnText: {
    ...Typography.button,
    color: Theme.textInverse,
  },
});

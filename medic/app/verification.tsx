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
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type PhotoType = 'facePhoto' | 'licensePhoto';

export default function VerificationScreen() {
  const { medic, token, refreshProfile, logout } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={[styles.statusBanner, statusBannerStyle(status)]}>
        <FontAwesome
          name={status === 'APPROVED' ? 'check-circle' : status === 'REJECTED' ? 'times-circle' : 'clock-o'}
          size={20}
          color={statusIconColor(status)}
        />
        <View style={styles.statusTexts}>
          <Text style={[styles.statusTitle, { color: statusIconColor(status) }]}>
            {status === 'APPROVED' ? t('verification.statusApproved') : status === 'REJECTED' ? t('verification.statusRejected') : t('verification.statusPending')}
          </Text>
          <Text style={styles.statusDesc}>
            {status === 'PENDING' ? t('verification.descPending') : status === 'APPROVED' ? t('verification.descApproved') : t('verification.descRejected')}
          </Text>
        </View>
      </View>

      {/* Rejection reason */}
      {status === 'REJECTED' && medic?.verificationRejectedReason && (
        <View style={styles.rejectedReason}>
          <Text style={styles.rejectedReasonLabel}>{t('verification.rejectedReason')}:</Text>
          <Text style={styles.rejectedReasonText}>{medic.verificationRejectedReason}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>{t('verification.whatToUpload')}</Text>
        <InstructionRow icon="user" text={t('verification.facePhotoHint')} />
        <InstructionRow icon="id-card" text={t('verification.licensePhotoHint')} />
      </View>

      {/* Face photo */}
      <PhotoBlock
        label={t('verification.uploadPhoto')}
        uri={faceUri}
        onPress={() => showPickerOptions('facePhoto', t('verification.uploadPhoto'))}
      />

      {/* License photo */}
      <PhotoBlock
        label={t('verification.uploadDiploma')}
        uri={licenseUri}
        onPress={() => showPickerOptions('licensePhoto', t('verification.uploadDiploma'))}
      />

      {/* Submit */}
      {status !== 'APPROVED' && (
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.85 },
            uploading && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('verification.submit')}</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoBlock({ label, uri, onPress }: { label: string; uri: string | null; onPress: () => void }) {
  const { t } = useTranslation();
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
          <FontAwesome name="camera" size={28} color={Theme.textSecondary} />
        </View>
      )}
      <View style={styles.photoLabelRow}>
        <Text style={styles.photoLabel}>{label}</Text>
        <View style={[styles.photoBadge, { backgroundColor: uri ? `${Theme.success}20` : `${Theme.primary}15` }]}>
          <Text style={[styles.photoBadgeText, { color: uri ? Theme.success : Theme.primary }]}>
            {uri ? (isRemote ? `${t('verification.uploaded')} ✓` : t('verification.selected')) : t('verification.tapToSelect')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function InstructionRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.instructionRow}>
      <FontAwesome name={icon as keyof typeof FontAwesome.glyphMap} size={15} color={Theme.primary} style={styles.instructionIcon} />
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// STATUS_TITLE and STATUS_DESC moved to i18n (verification.statusPending, etc.)

function statusBannerStyle(status: string) {
  if (status === 'APPROVED') return { backgroundColor: `${Theme.success}15`, borderColor: `${Theme.success}40` };
  if (status === 'REJECTED') return { backgroundColor: `${Theme.error}12`, borderColor: `${Theme.error}40` };
  return { backgroundColor: `${Theme.warning}12`, borderColor: `${Theme.warning}40` };
}

function statusIconColor(status: string) {
  if (status === 'APPROVED') return Theme.success;
  if (status === 'REJECTED') return Theme.error;
  return Theme.warning;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  statusTexts: { flex: 1 },
  statusTitle: { fontSize: Typography.body.fontSize, fontWeight: '700' },
  statusDesc: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary, marginTop: 2 },

  rejectedReason: {
    backgroundColor: `${Theme.error}08`,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Theme.error}30`,
    gap: Spacing.xs,
  },
  rejectedReasonLabel: { fontSize: Typography.caption.fontSize, fontWeight: '700', color: Theme.error },
  rejectedReasonText: { fontSize: Typography.bodySmall.fontSize, color: Theme.text },

  instructionCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  instructionTitle: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: Theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  instructionIcon: { width: 20, marginTop: 2 },
  instructionText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: Theme.text, lineHeight: 20 },

  photoBlock: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  photoPreview: { width: '100%', height: 180 },
  photoPlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Theme.primary}08`,
  },
  photoLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  photoLabel: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Theme.text },
  photoBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  photoBadgeText: { fontSize: Typography.caption.fontSize, fontWeight: '600' },

  submitBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.lg,
    padding: 17,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fff' },
});

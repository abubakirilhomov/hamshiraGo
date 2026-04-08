import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface PrescriptionData {
  id: string;
  consultationId: string;
  clientId: string;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';
  orderId: string | null;
  doctorNotes: string | null;
  createdAt: string;
  expiresAt: string;
}

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:    { bg: Theme.warningContainer,    text: '#92400E', label: 'KUTILMOQDA' },
  CONFIRMED:  { bg: Theme.successContainer,    text: '#065F46', label: 'TASDIQLANGAN' },
  CANCELED:   { bg: Theme.errorContainer,      text: '#991B1B', label: 'BEKOR QILINGAN' },
  EXPIRED:    { bg: Theme.surfaceContainerLow, text: Theme.textSecondary, label: "MUDDATI O'TGAN" },
};

export default function PrescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Location state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [address, setAddress] = useState({ house: '', floor: '', apartment: '', phone: '' });

  // Fetch prescription
  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        const json = await apiFetch<{ data: PrescriptionData[] }>(`/consultations/prescriptions/my?limit=50`, { token });
        const found = json?.data?.find((p: PrescriptionData) => p.id === id);
        if (found) setPrescription(found);
      } catch {
        toast.showToast(t('home.loading'), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // Get location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoadingLocation(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        // fallback
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!prescription || !token || !coords) return;
    if (!address.house.trim() || !address.phone.trim()) {
      Alert.alert('', t('prescription.house') + ' / ' + t('prescription.phone'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<PrescriptionData>(`/consultations/prescriptions/${prescription.id}/confirm`, {
        token,
        method: 'POST',
        body: JSON.stringify({
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            house: address.house.trim(),
            floor: address.floor.trim() || undefined,
            apartment: address.apartment.trim() || undefined,
            phone: address.phone.trim(),
          },
        }),
      });
      toast.showToast(t('prescription.confirmed'), 'success');

      if (result.orderId) {
        router.replace({ pathname: '/order/track', params: { orderId: result.orderId } });
      } else {
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  }, [prescription, token, coords, address]);

  const handleCancel = useCallback(async () => {
    if (!prescription || !token) return;
    Alert.alert(t('prescription.cancel'), t('prescription.cancelConfirm'), [
      { text: t('prescription.cancel'), style: 'cancel' },
      {
        text: 'OK',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/consultations/prescriptions/${prescription.id}/cancel`, {
              token,
              method: 'POST',
            });
            toast.showToast(t('prescription.canceled'), 'success');
            router.back();
          } catch {
            toast.showToast('Error', 'error');
          }
        },
      },
    ]);
  }, [prescription, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('prescription.noPrescriptions')}</Text>
      </View>
    );
  }

  const isExpired = new Date() > new Date(prescription.expiresAt);
  const isPending = prescription.status === 'PENDING' && !isExpired;
  const statusKey = isExpired && prescription.status === 'PENDING' ? 'EXPIRED' : prescription.status;
  const status = STATUS_MAP[statusKey] || STATUS_MAP.EXPIRED;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <FontAwesome name="arrow-left" size={20} color={Theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Retsept</Text>
          <Pressable hitSlop={12}>
            <FontAwesome name="ellipsis-v" size={20} color={Theme.text} />
          </Pressable>
        </View>

        {/* Medication name */}
        <Text style={styles.medName}>{prescription.serviceTitle}</Text>

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.label}
          </Text>
        </View>

        {/* Doctor card placeholder */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.doctorRow}>
            <View style={styles.doctorAvatar}>
              <FontAwesome name="user-md" size={22} color={Theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>Shifokor</Text>
              <Text style={styles.doctorSpec}>Umumiy amaliyot</Text>
            </View>
          </View>
        </View>

        {/* Dosage section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DOZASI</Text>
          <Text style={styles.sectionValue}>
            {prescription.servicePrice.toLocaleString()} UZS
          </Text>
          <Text style={styles.sectionHint}>
            {t('prescription.service', 'Xizmat narxi')}
          </Text>
        </View>

        {/* Duration section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAVOMIYLIGI</Text>
          <Text style={styles.durationValue}>
            {Math.ceil(
              (new Date(prescription.expiresAt).getTime() - new Date(prescription.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
            )}{' '}
            Kun
          </Text>
          <Text style={styles.sectionHint}>
            {new Date(prescription.expiresAt).toLocaleDateString('ru-RU')}gacha davom etadi
            {isExpired ? ` - ${t('prescription.expired', "Muddati o'tgan")}` : ''}
          </Text>
        </View>

        {/* Doctor notes / instructions */}
        {prescription.doctorNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ko'rsatmalar</Text>
            <Text style={styles.instructionsText}>{prescription.doctorNotes}</Text>
          </View>
        )}

        {/* Location form for PENDING */}
        {isPending && (
          <>
            <Text style={styles.formTitle}>{t('prescription.confirmAddress')}</Text>

            {loadingLocation ? (
              <ActivityIndicator style={{ marginVertical: Spacing.lg }} color={Theme.primary} />
            ) : (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder={t('prescription.house')}
                  placeholderTextColor={Theme.textTertiary}
                  value={address.house}
                  onChangeText={(v) => setAddress((a) => ({ ...a, house: v }))}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.half]}
                    placeholder={t('prescription.floor')}
                    placeholderTextColor={Theme.textTertiary}
                    value={address.floor}
                    onChangeText={(v) => setAddress((a) => ({ ...a, floor: v }))}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.input, styles.half]}
                    placeholder={t('prescription.apartment')}
                    placeholderTextColor={Theme.textTertiary}
                    value={address.apartment}
                    onChangeText={(v) => setAddress((a) => ({ ...a, apartment: v }))}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('prescription.phone')}
                  placeholderTextColor={Theme.textTertiary}
                  value={address.phone}
                  onChangeText={(v) => setAddress((a) => ({ ...a, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom buttons */}
      {isPending && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Pressable
            style={({ pressed }) => [
              pressed && { opacity: 0.9 },
              (!coords || submitting) && { opacity: 0.5 },
            ]}
            onPress={handleConfirm}
            disabled={!coords || submitting}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              {submitting ? (
                <ActivityIndicator color={Theme.textInverse} />
              ) : (
                <Text style={styles.confirmBtnText}>Tasdiqlash</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>Bekor qilish</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontFamily: Fonts.inter,
    fontSize: 16,
    color: Theme.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
  },

  medName: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
    marginBottom: Spacing.sm,
  },

  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
  },
  statusText: {
    fontFamily: Fonts.interSb,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
  },
  doctorSpec: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 11,
    color: Theme.textTertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  sectionValue: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
    marginBottom: 2,
  },
  sectionHint: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  durationValue: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.text,
    marginBottom: 2,
  },
  instructionsText: {
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.text,
    lineHeight: 24,
  },

  formTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  form: { gap: Spacing.sm },
  input: {
    fontFamily: Fonts.inter,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Theme.text,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.background,
    gap: Spacing.sm,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },
  cancelBtn: {
    backgroundColor: Theme.errorContainer,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.error,
  },
});

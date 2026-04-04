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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
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

export default function PrescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

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
        toast.show(t('home.loading'), 'error');
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
      toast.show(t('prescription.confirmed'), 'success');

      // Navigate to order tracking
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
            toast.show(t('prescription.canceled'), 'success');
            router.back();
          } catch {
            toast.show('Error', 'error');
          }
        },
      },
    ]);
  }, [prescription, token]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>{t('prescription.noPrescriptions')}</Text>
      </View>
    );
  }

  const isExpired = new Date() > new Date(prescription.expiresAt);
  const isPending = prescription.status === 'PENDING' && !isExpired;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.flex} contentContainerStyle={s.content}>
        {/* Service info card */}
        <View style={[s.card, Shadow.sm]}>
          <FontAwesome name="stethoscope" size={24} color={Theme.primary} />
          <View style={s.cardBody}>
            <Text style={s.label}>{t('prescription.service')}</Text>
            <Text style={s.serviceTitle}>{prescription.serviceTitle}</Text>
            <Text style={s.price}>
              {prescription.servicePrice.toLocaleString()} UZS
            </Text>
          </View>
        </View>

        {/* Doctor notes */}
        {prescription.doctorNotes && (
          <View style={[s.card, Shadow.sm]}>
            <FontAwesome name="file-text-o" size={20} color="#6B7280" />
            <View style={s.cardBody}>
              <Text style={s.label}>{t('prescription.doctorNotes')}</Text>
              <Text style={s.notes}>{prescription.doctorNotes}</Text>
            </View>
          </View>
        )}

        {/* Expiry */}
        <View style={[s.card, Shadow.sm]}>
          <FontAwesome name="clock-o" size={20} color={isExpired ? '#EF4444' : '#6B7280'} />
          <View style={s.cardBody}>
            <Text style={s.label}>{t('prescription.expires')}</Text>
            <Text style={[s.notes, isExpired && { color: '#EF4444' }]}>
              {new Date(prescription.expiresAt).toLocaleDateString()}
              {isExpired ? ` — ${t('prescription.expired')}` : ''}
            </Text>
          </View>
        </View>

        {/* Status badge for non-pending */}
        {!isPending && (
          <View style={[s.statusBadge, statusColors[prescription.status] || statusColors.EXPIRED]}>
            <Text style={s.statusText}>
              {t(`prescription.status${prescription.status.charAt(0) + prescription.status.slice(1).toLowerCase()}`)}
            </Text>
          </View>
        )}

        {/* Location form — only for PENDING */}
        {isPending && (
          <>
            <Text style={s.sectionTitle}>{t('prescription.confirmAddress')}</Text>

            {loadingLocation ? (
              <ActivityIndicator style={{ marginVertical: Spacing.lg }} color={Theme.primary} />
            ) : (
              <View style={s.form}>
                <TextInput
                  style={s.input}
                  placeholder={t('prescription.house')}
                  placeholderTextColor="#9CA3AF"
                  value={address.house}
                  onChangeText={(v) => setAddress((a) => ({ ...a, house: v }))}
                />
                <View style={s.row}>
                  <TextInput
                    style={[s.input, s.half]}
                    placeholder={t('prescription.floor')}
                    placeholderTextColor="#9CA3AF"
                    value={address.floor}
                    onChangeText={(v) => setAddress((a) => ({ ...a, floor: v }))}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[s.input, s.half]}
                    placeholder={t('prescription.apartment')}
                    placeholderTextColor="#9CA3AF"
                    value={address.apartment}
                    onChangeText={(v) => setAddress((a) => ({ ...a, apartment: v }))}
                  />
                </View>
                <TextInput
                  style={s.input}
                  placeholder={t('prescription.phone')}
                  placeholderTextColor="#9CA3AF"
                  value={address.phone}
                  onChangeText={(v) => setAddress((a) => ({ ...a, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                s.confirmBtn,
                pressed && { opacity: 0.9 },
                (!coords || submitting) && { opacity: 0.5 },
              ]}
              onPress={handleConfirm}
              disabled={!coords || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.confirmBtnText}>{t('prescription.confirmAddress')}</Text>
              )}
            </Pressable>

            <Pressable style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelBtnText}>{t('prescription.cancel')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const statusColors: Record<string, { backgroundColor: string }> = {
  CONFIRMED: { backgroundColor: '#D1FAE5' },
  CANCELED: { backgroundColor: '#FEE2E2' },
  EXPIRED: { backgroundColor: '#F3F4F6' },
};

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  emptyText: { fontSize: 16, color: '#6B7280' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  cardBody: { flex: 1 },
  label: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  serviceTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  price: { fontSize: 16, fontWeight: '600', color: Theme.primary, marginTop: 4 },
  notes: { fontSize: 14, color: '#374151', lineHeight: 20 },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: Spacing.md,
  },
  form: { gap: Spacing.sm },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: '#111827',
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
  confirmBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#EF4444' },
});

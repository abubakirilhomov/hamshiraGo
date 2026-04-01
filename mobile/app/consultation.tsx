import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
  nameUz: string | null;
  specialization: string;
  specializationUz: string | null;
  bio: string | null;
  photoUrl: string | null;
  pricePerConsultation: number;
  rating: number;
  consultationCount: number;
  isActive: boolean;
}

interface ConsultationResponse {
  id: string;
  clientId: string;
  doctorId: string;
  status: string;
  symptoms: string | null;
  suggestedSpecialization: string | null;
  price: number;
  platformFee: number;
  createdAt: string;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ConsultationScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    doctorId: string;
    symptoms?: string;
    spec?: string;
  }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctor = useCallback(async () => {
    if (!token || !params.doctorId) return;
    setLoading(true);
    try {
      const data = await apiFetch<Doctor>(
        `/consultations/doctors/${params.doctorId}`,
        { token },
      );
      setDoctor(data);
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [token, params.doctorId, t, showToast]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const getName = (d: Doctor) =>
    language === 'uz' && d.nameUz ? d.nameUz : d.name;

  const getSpec = (d: Doctor) =>
    language === 'uz' && d.specializationUz ? d.specializationUz : d.specialization;

  const handleConfirm = useCallback(async () => {
    if (!token || !params.doctorId || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, string> = { doctorId: params.doctorId };
      if (params.symptoms) body.symptoms = params.symptoms;
      if (params.spec) body.suggestedSpecialization = params.spec;

      const res = await apiFetch<ConsultationResponse>('/consultations', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });

      showToast(t('consultation.booked'), 'success');
      router.replace('/consultations');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [token, params.doctorId, params.symptoms, params.spec, submitting, t, showToast]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Doctor card */}
      <View style={styles.doctorCard}>
        <View style={styles.doctorTop}>
          {doctor.photoUrl ? (
            <Image
              source={{ uri: doctor.photoUrl }}
              style={styles.photo}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              transition={200}
            />
          ) : (
            <View style={styles.photoFallback}>
              <FontAwesome name="user-md" size={28} color={Theme.textTertiary} />
            </View>
          )}

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{getName(doctor)}</Text>
            <Text style={styles.doctorSpec}>{getSpec(doctor)}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={13} color={Theme.warning} />
              <Text style={styles.ratingText}>
                {(doctor.rating?.toFixed(1) ?? '0.0')} ({doctor.consultationCount ?? 0})
              </Text>
            </View>
          </View>
        </View>

        {doctor.bio && (
          <Text style={styles.bioText}>{doctor.bio}</Text>
        )}
      </View>

      {/* Symptoms summary */}
      {params.symptoms && (
        <View style={styles.symptomsCard}>
          <Text style={styles.symptomsLabel}>{t('consultation.symptoms')}</Text>
          <Text style={styles.symptomsText}>{params.symptoms}</Text>
        </View>
      )}

      {/* Price info */}
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <FontAwesome name="money" size={15} color={Theme.primary} />
          <Text style={styles.priceText}>
            {t('consultation.price', {
              price: doctor.pricePerConsultation.toLocaleString('ru-RU'),
            })}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <FontAwesome name="info-circle" size={15} color={Theme.textTertiary} />
          <Text style={styles.feeText}>
            {t('consultation.fee', {
              fee: Math.round(doctor.pricePerConsultation * 0.15).toLocaleString('ru-RU'),
            })}
          </Text>
        </View>
      </View>

      {/* Confirm button */}
      <Pressable
        style={({ pressed }) => [
          styles.confirmBtn,
          pressed && { opacity: 0.85 },
          submitting && { opacity: 0.5 },
        ]}
        onPress={handleConfirm}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="check-circle" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>{t('consultation.confirm')}</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Doctor card
  doctorCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  doctorTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
  },
  photoFallback: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
    gap: 3,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
  },
  doctorSpec: {
    fontSize: 14,
    color: Theme.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: Theme.textSecondary,
  },
  bioText: {
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.borderLight,
    paddingTop: Spacing.md,
  },

  // Symptoms card
  symptomsCard: {
    backgroundColor: `${Theme.info}08`,
    borderWidth: 1,
    borderColor: `${Theme.info}25`,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  symptomsText: {
    fontSize: 14,
    color: Theme.text,
    lineHeight: 20,
  },

  // Price card
  priceCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.primary,
  },
  feeText: {
    fontSize: 13,
    color: Theme.textTertiary,
  },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Error
  errorText: {
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
  },
});

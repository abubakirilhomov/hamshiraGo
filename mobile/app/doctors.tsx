import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DoctorsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ spec?: string; symptoms?: string }>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const query = params.spec
        ? `?specialization=${encodeURIComponent(params.spec)}`
        : '';
      const data = await apiFetch<Doctor[]>(
        `/consultations/doctors${query}`,
        { token },
      );
      setDoctors(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [token, params.spec, t]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const getName = (d: Doctor) =>
    language === 'uz' && d.nameUz ? d.nameUz : d.name;

  const getSpec = (d: Doctor) =>
    language === 'uz' && d.specializationUz ? d.specializationUz : d.specialization;

  const handleBook = useCallback(
    (doctor: Doctor) => {
      const qs = new URLSearchParams({ doctorId: doctor.id });
      if (params.symptoms) qs.set('symptoms', params.symptoms);
      if (params.spec) qs.set('spec', params.spec);
      router.push(`/consultation?${qs.toString()}`);
    },
    [params.symptoms, params.spec],
  );

  const renderDoctor = useCallback(
    ({ item }: { item: Doctor }) => (
      <DoctorCard
        doctor={item}
        name={getName(item)}
        specialization={getSpec(item)}
        onBook={() => handleBook(item)}
        t={t}
      />
    ),
    [language, handleBook, t],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchDoctors} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('home.errorRetry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {doctors.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="user-md" size={48} color={Theme.textTertiary} />
          <Text style={styles.emptyText}>{t('doctors.noResults')}</Text>
        </View>
      ) : (
        <FlashList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Doctor Card ─────────────────────────────────────────────────────────────

function DoctorCard({
  doctor,
  name,
  specialization,
  onBook,
  t,
}: {
  doctor: Doctor;
  name: string;
  specialization: string;
  onBook: () => void;
  t: (key: string, opts?: Record<string, string>) => string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
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
            <FontAwesome name="user-md" size={24} color={Theme.textTertiary} />
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.doctorName}>{name}</Text>
          <Text style={styles.doctorSpec}>{specialization}</Text>

          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={13} color={Theme.warning} />
            <Text style={styles.ratingText}>
              {(doctor.rating?.toFixed(1) ?? '0.0')} ({doctor.consultationCount ?? 0})
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.priceText}>
          {t('doctors.price', {
            price: doctor.pricePerConsultation.toLocaleString('ru-RU'),
          })}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.8 }]}
          onPress={onBook}
        >
          <Text style={styles.bookBtnText}>{t('doctors.book')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  listContent: {
    padding: Spacing.lg,
  },

  // Card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  photoFallback: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
  },
  doctorSpec: {
    fontSize: 13,
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

  // Bottom row
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.borderLight,
    paddingTop: Spacing.md,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.primary,
  },
  bookBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Error
  errorText: {
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Theme.primary,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Empty
  emptyText: {
    fontSize: 15,
    color: Theme.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

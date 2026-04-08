import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
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

// ─── Filter categories ──────────────────────────────────────────────────────

const FILTER_CATEGORIES = [
  'Barchasi',
  'Terapevt',
  'Kardiolog',
  'Nevropatolog',
  'Dermatolog',
  'Pediatr',
  'Ginekolog',
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DoctorsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ spec?: string; symptoms?: string }>();
  const insets = useSafeAreaInsets();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(
    params.spec ?? 'Barchasi',
  );

  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const spec = selectedFilter !== 'Barchasi' ? selectedFilter : params.spec;
      const query = spec
        ? `?specialization=${encodeURIComponent(spec)}`
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
  }, [token, selectedFilter, params.spec, t]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const getName = (d: Doctor) =>
    language === 'uz' && d.nameUz ? d.nameUz : d.name;

  const getSpec = (d: Doctor) =>
    language === 'uz' && d.specializationUz ? d.specializationUz : d.specialization;

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter(
      (d) =>
        getName(d).toLowerCase().includes(q) ||
        getSpec(d).toLowerCase().includes(q),
    );
  }, [doctors, searchQuery, language]);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={18} color={Theme.text} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Shifokorlar</Text>
          <Text style={styles.headerSubtitle}>Mutaxassisni tanlang</Text>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <FontAwesome
          name="search"
          size={16}
          color={Theme.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Shifokor qidirish..."
          placeholderTextColor={Theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Filter pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = selectedFilter === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.filterPill,
                isActive && styles.filterPillActive,
              ]}
              onPress={() => setSelectedFilter(cat)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchDoctors} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('home.errorRetry')}</Text>
          </Pressable>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="user-md" size={48} color={Theme.textTertiary} />
          <Text style={styles.emptyText}>{t('doctors.noResults')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
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
      <View style={styles.cardRow}>
        {/* Avatar */}
        {doctor.photoUrl ? (
          <Image
            source={{ uri: doctor.photoUrl }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <FontAwesome name="user-md" size={24} color={Theme.textTertiary} />
          </View>
        )}

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.doctorName}>{name}</Text>
          <Text style={styles.doctorSpec}>{specialization}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingScore}>
              {doctor.rating?.toFixed(1) ?? '0.0'}
            </Text>
            <Text style={styles.ratingCount}>
              ({doctor.consultationCount ?? 0} sharh)
            </Text>
          </View>

          {/* Price row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>NARXI</Text>
              <Text style={styles.priceValue}>
                {doctor.pricePerConsultation.toLocaleString('ru-RU')} UZS
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.bookBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onBook}
            >
              <Text style={styles.bookBtnText}>Yozilish</Text>
            </Pressable>
          </View>
        </View>
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

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
  },
  headerSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  /* ── Search ── */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.text,
  },

  /* ── Filters ── */
  filtersScroll: {
    maxHeight: 44,
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
  },
  filterPillActive: {
    backgroundColor: Theme.primary,
  },
  filterPillText: {
    fontFamily: Fonts.interMd,
    fontSize: 13,
    color: Theme.text,
  },
  filterPillTextActive: {
    color: '#fff',
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },

  /* ── Card ── */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: 12,
    ...Shadow.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
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
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingScore: {
    fontFamily: Fonts.interSb,
    fontSize: 13,
    color: Theme.text,
  },
  ratingCount: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 10,
    color: Theme.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontFamily: Fonts.manropeBd,
    fontSize: 16,
    color: Theme.text,
    marginTop: 1,
  },
  bookBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  bookBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 13,
    color: '#fff',
  },

  /* ── Error / Empty ── */
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
  },
  retryText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: '#fff',
  },
  emptyText: {
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow, Typography } from '@/constants/Theme';
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
  photoUrl?: string | null;
}

interface Consultation {
  id: string;
  clientId: string;
  doctorId: string;
  doctor: Doctor;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  symptoms: string | null;
  suggestedSpecialization: string | null;
  doctorNotes: string | null;
  createdOrderId: string | null;
  price: number;
  platformFee: number;
  clientRating: number | null;
  clientComment: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: Consultation[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Consultation['status'],
  { bg: string; color: string; label: string; icon: string }
> = {
  PENDING: {
    bg: Theme.warningContainer,
    color: Theme.warning,
    label: 'KUTILMOQDA',
    icon: 'clock-o',
  },
  ACTIVE: {
    bg: '#006860',
    color: '#ffffff',
    label: 'FAOL',
    icon: 'spinner',
  },
  COMPLETED: {
    bg: Theme.successContainer,
    color: Theme.success,
    label: 'YAKUNLANGAN',
    icon: 'check-circle',
  },
  CANCELED: {
    bg: Theme.errorContainer,
    color: Theme.error,
    label: 'BEKOR QILINGAN',
    icon: 'times-circle',
  },
};

const PAGE_SIZE = 20;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ConsultationsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Rating state
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const submitRating = useCallback(async (consultationId: string) => {
    if (!token || stars === 0) return;
    setSubmittingRating(true);
    try {
      await apiFetch(`/consultations/${consultationId}/rate`, {
        token,
        method: 'POST',
        body: { rating: stars, comment: comment.trim() || undefined },
      });
      setConsultations((prev) =>
        prev.map((c) => c.id === consultationId ? { ...c, clientRating: stars, clientComment: comment.trim() || null } : c),
      );
      setRatingId(null);
      setStars(0);
      setComment('');
    } catch {
      Alert.alert('Xatolik', "Bahoni yuborib bo'lmadi");
    } finally {
      setSubmittingRating(false);
    }
  }, [token, stars, comment]);

  const fetchConsultations = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!token) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await apiFetch<PaginatedResponse>(
          `/consultations/my?page=${pageNum}&limit=${PAGE_SIZE}`,
          { token },
        );
        setConsultations((prev) =>
          append ? [...prev, ...res.data] : res.data,
        );
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchConsultations(1, false);
  }, [fetchConsultations]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    fetchConsultations(page + 1, true);
  }, [loadingMore, page, totalPages, fetchConsultations]);

  const getDoctorName = (d: Doctor) =>
    language === 'uz' && d.nameUz ? d.nameUz : d.name;

  const getDoctorSpec = (d: Doctor) =>
    language === 'uz' && d.specializationUz ? d.specializationUz : d.specialization;

  const handleTap = useCallback(
    (item: Consultation) => {
      if (item.doctorNotes) {
        Alert.alert(
          t('consultation.doctorNotes'),
          item.doctorNotes,
          [{ text: 'OK' }],
        );
      }
    },
    [t],
  );

  // ─── Format date & time ─────────────────────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // ─── Avatar initials ───────────────────────────────────────────────
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderItem = useCallback(
    ({ item }: { item: Consultation }) => {
      const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
      const doctorName = item.doctor ? getDoctorName(item.doctor) : '---';
      const doctorSpec = item.doctor ? getDoctorSpec(item.doctor) : '';

      return (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
          onPress={() => handleTap(item)}
        >
          {/* Status pill top-right */}
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>

          {/* Doctor row */}
          <View style={styles.doctorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(doctorName)}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.doctorSpec}>{doctorSpec}</Text>
            </View>
          </View>

          {/* Date & time row */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <FontAwesome name="calendar" size={12} color={Theme.textTertiary} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.dateItem}>
              <FontAwesome name="clock-o" size={12} color={Theme.textTertiary} />
              <Text style={styles.dateText}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>

          {/* View notes link */}
          {item.status === 'COMPLETED' && item.doctorNotes && (
            <Pressable
              style={({ pressed }) => [styles.notesLink, pressed && { opacity: 0.7 }]}
              onPress={() => handleTap(item)}
            >
              <Text style={styles.notesLinkText}>Xulosani ko'rish</Text>
              <FontAwesome name="chevron-right" size={11} color={Theme.primary} />
            </Pressable>
          )}

          {/* Rating section for completed consultations */}
          {item.status === 'COMPLETED' && item.clientRating == null && ratingId !== item.id && (
            <Pressable
              style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { setRatingId(item.id); setStars(0); setComment(''); }}
            >
              <FontAwesome name="star" size={14} color={Theme.primary} />
              <Text style={styles.rateBtnText}>Shifokorni baholang</Text>
            </Pressable>
          )}

          {item.status === 'COMPLETED' && item.clientRating != null && (
            <View style={styles.ratedRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <FontAwesome key={s} name={s <= item.clientRating! ? 'star' : 'star-o'} size={14} color={s <= item.clientRating! ? '#f59e0b' : Theme.border} />
              ))}
              <Text style={styles.ratedText}>Baholangan</Text>
            </View>
          )}

          {ratingId === item.id && (
            <View style={styles.ratingCard}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStars(s); }}>
                    <FontAwesome name={s <= stars ? 'star' : 'star-o'} size={32} color={s <= stars ? '#f59e0b' : Theme.border} />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Izoh (ixtiyoriy)"
                placeholderTextColor={Theme.textTertiary}
                multiline
                maxLength={500}
              />
              <Pressable
                style={[styles.submitRatingBtn, stars === 0 && { backgroundColor: Theme.border }]}
                onPress={() => submitRating(item.id)}
                disabled={submittingRating || stars === 0}
              >
                {submittingRating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitRatingText}>{stars === 0 ? 'Baho tanlang' : `Yuborish (${stars} ★)`}</Text>
                }
              </Pressable>
            </View>
          )}

          {/* Active: call button */}
          {item.status === 'ACTIVE' && (
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/video-call', params: { consultationId: item.id } })}
            >
              <FontAwesome name="video-camera" size={14} color="#fff" />
              <Text style={styles.callBtnText}>{t('videoCall.callDoctor')}</Text>
            </Pressable>
          )}
        </Pressable>
      );
    },
    [language, t, handleTap],
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Konsultatsiyalar</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Title + subtitle */}
      <View style={styles.titleBlock}>
        <Text style={styles.pageTitle}>Mening Tarixim</Text>
        <Text style={styles.pageSubtitle}>
          Barcha o'tkazilgan va rejalashtirilgan tibbiy maslahatlar ro'yxati.
        </Text>
      </View>

      {consultations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FontAwesome name="stethoscope" size={40} color={Theme.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>{t('consultation.noConsultations')}</Text>
          <Text style={styles.emptySubtitle}>
            Hozircha konsultatsiyalar yo'q
          </Text>
        </View>
      ) : (
        <FlatList
          data={consultations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Theme.primary}
                style={{ marginVertical: Spacing.md }}
              />
            ) : <View style={{ height: 100 }} />
          }
        />
      )}
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
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 17,
    color: Theme.text,
  },

  /* Title block */
  titleBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: 6,
  },
  pageTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
  },
  pageSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 20,
  },

  /* List */
  listContent: {
    paddingHorizontal: Spacing.lg,
  },

  /* Card */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },

  /* Status pill */
  statusPill: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontFamily: Fonts.interSb,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Doctor row */
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.primary,
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.text,
  },
  doctorSpec: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },

  /* Date row */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textTertiary,
  },

  /* Notes link */
  notesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesLinkText: {
    fontFamily: Fonts.interMd,
    fontSize: 14,
    color: Theme.primary,
  },

  /* Call button */
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  callBtnText: {
    fontFamily: Fonts.manropeSb,
    color: '#fff',
    fontSize: 14,
  },

  /* Rating */
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Theme.primaryLight,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  rateBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 13,
    color: Theme.primary,
  },
  ratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratedText: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textTertiary,
    marginLeft: 6,
  },
  ratingCard: {
    gap: 12,
    padding: 12,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Theme.text,
    minHeight: 56,
    textAlignVertical: 'top',
    backgroundColor: Theme.surface,
  },
  submitRatingBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 17,
    color: Theme.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textTertiary,
    textAlign: 'center',
  },
});

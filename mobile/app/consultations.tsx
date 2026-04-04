import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
  createdAt: string;
}

interface PaginatedResponse {
  data: Consultation[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Consultation['status'],
  { color: string; i18nKey: string; icon: string }
> = {
  PENDING: { color: Theme.warning, i18nKey: 'consultation.pending', icon: 'clock-o' },
  ACTIVE: { color: Theme.info, i18nKey: 'consultation.active', icon: 'spinner' },
  COMPLETED: { color: Theme.success, i18nKey: 'consultation.completed', icon: 'check-circle' },
  CANCELED: { color: Theme.error, i18nKey: 'consultation.canceled', icon: 'times-circle' },
};

const PAGE_SIZE = 20;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ConsultationsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const renderItem = useCallback(
    ({ item }: { item: Consultation }) => {
      const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
      const date = new Date(item.createdAt);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

      return (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          onPress={() => handleTap(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.doctorName}>
                {item.doctor ? getDoctorName(item.doctor) : '---'}
              </Text>
              <Text style={styles.doctorSpec}>
                {item.doctor ? getDoctorSpec(item.doctor) : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusCfg.color}15` }]}>
              <FontAwesome
                name={statusCfg.icon as keyof typeof FontAwesome.glyphMap}
                size={11}
                color={statusCfg.color}
              />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {t(statusCfg.i18nKey)}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.priceText}>
              {item.price?.toLocaleString('ru-RU') ?? '---'} UZS
            </Text>
          </View>

          {item.doctorNotes && (
            <View style={styles.notesHint}>
              <FontAwesome name="file-text-o" size={12} color={Theme.textTertiary} />
              <Text style={styles.notesHintText}>{t('consultation.doctorNotes')}</Text>
            </View>
          )}

          {item.status === 'ACTIVE' && (
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {consultations.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="calendar-o" size={48} color={Theme.textTertiary} />
          <Text style={styles.emptyText}>{t('consultation.noConsultations')}</Text>
        </View>
      ) : (
        <FlashList
          data={consultations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Theme.primary}
                style={{ marginVertical: Spacing.md }}
              />
            ) : null
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
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  listContent: {
    padding: Spacing.lg,
  },

  // Card
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 2,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: Theme.textTertiary,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.primary,
  },

  // Notes hint
  notesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Theme.borderLight,
    paddingTop: Spacing.sm,
  },
  notesHintText: {
    fontSize: 12,
    color: Theme.textTertiary,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty
  emptyText: {
    fontSize: 15,
    color: Theme.textTertiary,
    textAlign: 'center',
  },
});

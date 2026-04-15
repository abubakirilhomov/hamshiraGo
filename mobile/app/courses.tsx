import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface TreatmentCourse {
  id: string;
  title: string;
  totalProcedures: number;
  completedProcedures: number;
  intervalDays: number;
  nextDate: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
}

interface CreateForm {
  title: string;
  totalProcedures: string;
  intervalDays: string;
  nextDate: string;
}

const EMPTY_FORM: CreateForm = { title: '', totalProcedures: '', intervalDays: '', nextDate: '' };

const STATUS_CONFIG: Record<TreatmentCourse['status'], { bg: string; text: string; i18nKey: string }> = {
  ACTIVE:    { bg: Theme.warningContainer,  text: '#92400E', i18nKey: 'courses.statusActive' },
  COMPLETED: { bg: Theme.successContainer,  text: '#065F46', i18nKey: 'courses.statusDone' },
  CANCELED:  { bg: Theme.errorContainer,    text: '#991B1B', i18nKey: 'courses.statusCanceled' },
};

export default function CoursesScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = useCallback(() => {
    if (!token) return;
    apiFetch<TreatmentCourse[]>('/treatment-courses/my', { token })
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.totalProcedures || !form.intervalDays) {
      showToast(t('courses.fillRequired'), 'warning');
      return;
    }

    const totalProcedures = parseInt(form.totalProcedures, 10);
    const intervalDays = parseInt(form.intervalDays, 10);
    if (isNaN(totalProcedures) || totalProcedures <= 0 || isNaN(intervalDays) || intervalDays <= 0) {
      showToast(t('courses.invalidNumbers', { defaultValue: 'Введите корректные числа' }), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/treatment-courses', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: form.title.trim(),
          totalProcedures,
          intervalDays,
          ...(form.nextDate ? { nextDate: form.nextDate } : {}),
        }),
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
      fetchCourses();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardPress = (course: TreatmentCourse) => {
    if (course.status !== 'ACTIVE') return;
    Alert.alert(course.title, '', [
      {
        text: t('courses.complete'),
        onPress: async () => {
          try {
            await apiFetch(`/treatment-courses/${course.id}`, {
              method: 'PATCH',
              token: token ?? undefined,
              body: JSON.stringify({ markComplete: true }),
            });
            fetchCourses();
          } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : t('common.error'), 'error');
          }
        },
      },
      {
        text: t('courses.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/treatment-courses/${course.id}`, {
              method: 'DELETE',
              token: token ?? undefined,
            });
            fetchCourses();
          } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : t('common.error'), 'error');
          }
        },
      },
      { text: t('profile.cancel'), style: 'cancel' },
    ]);
  };

  const renderCourse = ({ item }: { item: TreatmentCourse }) => {
    const pct = item.totalProcedures > 0
      ? Math.min(item.completedProcedures / item.totalProcedures, 1)
      : 0;
    const statusCfg = STATUS_CONFIG[item.status];

    return (
      <Pressable
        style={({ pressed }) => [styles.courseCard, Shadow.sm, pressed && { opacity: 0.85 }]}
        onPress={() => handleCardPress(item)}
      >
        {/* Title + status */}
        <View style={styles.courseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            {item.nextDate && item.status === 'ACTIVE' && (
              <Text style={styles.startDate}>
                {new Date(item.nextDate).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {t(statusCfg.i18nKey)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
          </View>
          <Text style={styles.progressCount}>
            {item.completedProcedures}/{item.totalProcedures} {t('courses.procedureCount')}
          </Text>
        </View>
        <Text style={styles.progressPercent}>
          {Math.round(pct * 100)}% {t('courses.percentDone')}
        </Text>

        {/* Next session */}
        {item.nextDate && item.status === 'ACTIVE' && (
          <View style={styles.nextSession}>
            <Text style={styles.nextLabel}>{t('courses.nextSession')}</Text>
            <View style={styles.nextRow}>
              <FontAwesome name="calendar" size={12} color={Theme.textSecondary} />
              <Text style={styles.nextDate}>
                {new Date(item.nextDate).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        contentContainerStyle={[
          styles.listContent,
          courses.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + Spacing.lg }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brand}>HamshiraGo</Text>
              <Pressable hitSlop={12}>
                <FontAwesome name="bell-o" size={22} color={Theme.text} />
              </Pressable>
            </View>

            {/* Title */}
            <Text style={styles.title}>Davolash kurslari</Text>
            <Text style={styles.subtitle}>
              {t('courses.empty', 'Davolash kurslaringizni kuzatib boring')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <FontAwesome name="calendar-o" size={48} color={Theme.surfaceContainerHigh} />
            <Text style={styles.emptyText}>{t('courses.empty')}</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={Theme.primaryGradient}
          style={[styles.fab, Shadow.md]}
        >
          <FontAwesome name="plus" size={24} color={Theme.textInverse} />
        </LinearGradient>
      </Pressable>

      {/* Create modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetTitle}>{t('courses.create')}</Text>

            <Text style={styles.fieldLabel}>{t('courses.fieldTitle')}</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder={t('courses.fieldTitlePlaceholder')}
              placeholderTextColor={Theme.textTertiary}
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldTotal')}</Text>
            <TextInput
              style={styles.input}
              value={form.totalProcedures}
              onChangeText={(v) => setForm((f) => ({ ...f, totalProcedures: v }))}
              placeholder="10"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldInterval')}</Text>
            <TextInput
              style={styles.input}
              value={form.intervalDays}
              onChangeText={(v) => setForm((f) => ({ ...f, intervalDays: v }))}
              placeholder="7"
              placeholderTextColor={Theme.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldNextDate')}</Text>
            <TextInput
              style={styles.input}
              value={form.nextDate}
              onChangeText={(v) => setForm((f) => ({ ...f, nextDate: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Theme.textTertiary}
            />

            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9 }, submitting && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={submitting}
            >
              <LinearGradient
                colors={Theme.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {submitting ? (
                  <ActivityIndicator color={Theme.textInverse} />
                ) : (
                  <Text style={styles.submitBtnText}>{t('courses.create')}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.background },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  listEmpty: { flexGrow: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  brand: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.primary,
  },

  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: Spacing.lg,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  courseCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  courseTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
  },
  startDate: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: Fonts.interSb,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Theme.primary,
    borderRadius: 3,
  },
  progressCount: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
  },
  progressPercent: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
    marginTop: -Spacing.xs,
  },

  nextSession: {
    borderTopWidth: 1,
    borderTopColor: Theme.surfaceContainerLow,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  nextLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 10,
    color: Theme.textTertiary,
    letterSpacing: 1,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nextDate: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },

  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.surfaceContainerHigh,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 18,
    color: Theme.text,
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 13,
    color: Theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontFamily: Fonts.inter,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Theme.text,
    marginBottom: 14,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  submitBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },
});

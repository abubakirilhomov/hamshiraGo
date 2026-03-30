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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

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

function StatusBadge({ status }: { status: TreatmentCourse['status'] }) {
  const { t } = useTranslation();
  const colors: Record<TreatmentCourse['status'], string> = {
    ACTIVE: Theme.primary,
    COMPLETED: '#16a34a',
    CANCELED: Theme.error,
  };
  const labels: Record<TreatmentCourse['status'], string> = {
    ACTIVE: t('courses.statusActive'),
    COMPLETED: t('courses.statusDone'),
    CANCELED: t('courses.statusCanceled'),
  };
  return (
    <View style={[styles.badge, { backgroundColor: `${colors[status]}18`, borderColor: `${colors[status]}40` }]}>
      <Text style={[styles.badgeText, { color: colors[status] }]}>{labels[status]}</Text>
    </View>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.min(completed / total, 1) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
    </View>
  );
}

export default function CoursesScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), t('courses.fillRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/treatment-courses', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: form.title.trim(),
          totalProcedures: parseInt(form.totalProcedures, 10),
          intervalDays: parseInt(form.intervalDays, 10),
          ...(form.nextDate ? { nextDate: form.nextDate } : {}),
        }),
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
      fetchCourses();
    } catch (e: unknown) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
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
            Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
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
            Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
          }
        },
      },
      { text: t('profile.cancel'), style: 'cancel' },
    ]);
  };

  const renderCourse = ({ item }: { item: TreatmentCourse }) => (
    <Pressable
      style={({ pressed }) => [styles.courseCard, pressed && { opacity: 0.85 }]}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.progressRow}>
        <ProgressBar completed={item.completedProcedures} total={item.totalProcedures} />
        <Text style={styles.progressLabel}>
          {item.completedProcedures}/{item.totalProcedures} {t('courses.procedures')}
        </Text>
      </View>

      {item.nextDate && item.status === 'ACTIVE' && (
        <View style={styles.nextDateRow}>
          <FontAwesome name="calendar" size={12} color={Theme.textSecondary} />
          <Text style={styles.nextDateText}>
            {t('courses.nextDate')}: {new Date(item.nextDate).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      )}
    </Pressable>
  );

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
        contentContainerStyle={[styles.listContent, courses.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <FontAwesome name="calendar-o" size={40} color={Theme.textSecondary} />
            <Text style={styles.emptyText}>{t('courses.empty')}</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome name="plus" size={22} color="#fff" />
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
              placeholderTextColor={Theme.textSecondary}
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldTotal')}</Text>
            <TextInput
              style={styles.input}
              value={form.totalProcedures}
              onChangeText={(v) => setForm((f) => ({ ...f, totalProcedures: v }))}
              placeholder="10"
              placeholderTextColor={Theme.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldInterval')}</Text>
            <TextInput
              style={styles.input}
              value={form.intervalDays}
              onChangeText={(v) => setForm((f) => ({ ...f, intervalDays: v }))}
              placeholder="7"
              placeholderTextColor={Theme.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>{t('courses.fieldNextDate')}</Text>
            <TextInput
              style={styles.input}
              value={form.nextDate}
              onChangeText={(v) => setForm((f) => ({ ...f, nextDate: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Theme.textSecondary}
            />

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>{t('courses.create')}</Text>
              }
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: Theme.textSecondary, textAlign: 'center' },

  courseCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressRow: { gap: 4 },
  progressTrack: {
    height: 6,
    backgroundColor: Theme.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Theme.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
  nextDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextDateText: {
    fontSize: 12,
    color: Theme.textSecondary,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Theme.text,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

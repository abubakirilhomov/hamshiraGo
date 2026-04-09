import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ScheduleSlot {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  isActive: boolean;
}

const DAY_NAMES: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: 'Dushanba' },
  { dayOfWeek: 2, label: 'Seshanba' },
  { dayOfWeek: 3, label: 'Chorshanba' },
  { dayOfWeek: 4, label: 'Payshanba' },
  { dayOfWeek: 5, label: 'Juma' },
  { dayOfWeek: 6, label: 'Shanba' },
  { dayOfWeek: 0, label: 'Yakshanba' },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8..22

function getDefaultSlots(): ScheduleSlot[] {
  return DAY_NAMES.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    startHour: 8,
    endHour: 20,
    isActive: d.dayOfWeek >= 1 && d.dayOfWeek <= 5,
  }));
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [slots, setSlots] = useState<ScheduleSlot[]>(getDefaultSlots());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<ScheduleSlot[]>('/medics/me/schedule', { token })
      .then((data) => {
        if (data && data.length > 0) {
          // Merge API data with default slots (ensure all 7 days present)
          const merged = DAY_NAMES.map((d) => {
            const existing = data.find((s) => s.dayOfWeek === d.dayOfWeek);
            return existing ?? {
              dayOfWeek: d.dayOfWeek,
              startHour: 8,
              endHour: 20,
              isActive: false,
            };
          });
          setSlots(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const updateSlot = useCallback((dayOfWeek: number, update: Partial<ScheduleSlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...update } : s)),
    );
  }, []);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await apiFetch('/medics/me/schedule', {
        method: 'PUT',
        token,
        body: JSON.stringify({ slots }),
      });
      showToast(t('schedule.saved', { defaultValue: 'Jadval saqlandi' }), 'success');
      router.back();
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : t('common.error', { defaultValue: 'Xatolik' }),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Ish jadvali</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {DAY_NAMES.map((day) => {
          const slot = slots.find((s) => s.dayOfWeek === day.dayOfWeek)!;
          return (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.label}</Text>
                <Switch
                  value={slot.isActive}
                  onValueChange={(v) => updateSlot(day.dayOfWeek, { isActive: v })}
                  trackColor={{ false: Theme.border, true: `${Theme.primary}60` }}
                  thumbColor={slot.isActive ? Theme.primary : Theme.textTertiary}
                />
              </View>
              {slot.isActive && (
                <View style={styles.timeRow}>
                  <View style={styles.timePicker}>
                    <Text style={styles.timeLabel}>dan</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.hourScroll}
                    >
                      {HOURS.map((h) => (
                        <Pressable
                          key={h}
                          style={[
                            styles.hourBtn,
                            slot.startHour === h && styles.hourBtnActive,
                          ]}
                          onPress={() => {
                            const newStart = h;
                            const updates: Partial<ScheduleSlot> = { startHour: newStart };
                            if (newStart >= slot.endHour) updates.endHour = Math.min(newStart + 1, 22);
                            updateSlot(day.dayOfWeek, updates);
                          }}
                        >
                          <Text
                            style={[
                              styles.hourText,
                              slot.startHour === h && styles.hourTextActive,
                            ]}
                          >
                            {String(h).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timePicker}>
                    <Text style={styles.timeLabel}>gacha</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.hourScroll}
                    >
                      {HOURS.map((h) => (
                        <Pressable
                          key={h}
                          style={[
                            styles.hourBtn,
                            slot.endHour === h && styles.hourBtnActive,
                            h <= slot.startHour && styles.hourBtnDisabled,
                          ]}
                          onPress={() => {
                            if (h <= slot.startHour) return;
                            updateSlot(day.dayOfWeek, { endHour: h });
                          }}
                          disabled={h <= slot.startHour}
                        >
                          <Text
                            style={[
                              styles.hourText,
                              slot.endHour === h && styles.hourTextActive,
                              h <= slot.startHour && styles.hourTextDisabled,
                            ]}
                          >
                            {String(h).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Save button */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={Theme.bannerGradient as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Saqlash</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Theme.text,
  },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  dayCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.text,
  },
  timeRow: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  timePicker: {
    gap: Spacing.xs,
  },
  timeLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hourScroll: {
    gap: Spacing.xs,
  },
  hourBtn: {
    width: 40,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourBtnActive: {
    backgroundColor: Theme.primary,
  },
  hourBtnDisabled: {
    opacity: 0.3,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.text,
  },
  hourTextActive: {
    color: '#fff',
  },
  hourTextDisabled: {
    color: Theme.textTertiary,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.background,
  },
  saveBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
});

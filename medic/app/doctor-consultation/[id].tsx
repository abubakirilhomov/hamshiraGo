import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ConsultationDetail {
  id: string;
  symptoms: string;
  priceAmount: number;
  status: string;
  created_at: string;
  completedAt?: string;
  doctorNotes?: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  slotStartsAt?: string;
  slotEndsAt?: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: Theme.warning,
  ACCEPTED: Theme.info,
  IN_PROGRESS: Theme.accent,
  COMPLETED: Theme.success,
  CANCELED: Theme.error,
  DECLINED: Theme.textSecondary,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  ACCEPTED: 'Qabul qilingan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Yakunlangan',
  CANCELED: 'Bekor qilingan',
  DECLINED: 'Rad etilgan',
};

export default function DoctorConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [joiningCall, setJoiningCall] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await apiFetch<ConsultationDetail>(`/consultations/${id}`, {
        token: token ?? undefined,
      });
      setConsultation(res);
      if (res.doctorNotes) setNotes(res.doctorNotes);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xatolik yuz berdi', 'error');
    }
  }, [id, token, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [fetchDetail]);

  const handleJoinCall = async () => {
    setJoiningCall(true);
    try {
      const res = await apiFetch<{ url?: string; token?: string }>(`/consultations/${id}/call/join`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ role: 'doctor' }),
      });
      if (res.url) {
        // Open LiveKit URL or handle token-based join
        showToast('Video qo\'ng\'iroqqa ulanilmoqda...', 'info');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Qo\'ng\'iroqqa ulanib bo\'lmadi', 'error');
    } finally {
      setJoiningCall(false);
    }
  };

  const handleComplete = async () => {
    if (!notes.trim()) {
      showToast('Iltimos, doktor xulosasini yozing', 'warning');
      return;
    }
    setCompleting(true);
    try {
      await apiFetch(`/consultations/${id}/doctor-complete`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ notes: notes.trim() }),
      });
      showToast('Konsultatsiya yakunlandi', 'success');
      router.back();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Yakunlab bo\'lmadi', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!consultation) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="exclamation-circle" size={48} color={Theme.error} />
        <Text style={styles.errorTitle}>Konsultatsiya topilmadi</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = ['ACCEPTED', 'IN_PROGRESS', 'PENDING'].includes(consultation.status);
  const isCompleted = consultation.status === 'COMPLETED';
  const statusColor = STATUS_COLOR[consultation.status] ?? Theme.textSecondary;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <FontAwesome name="chevron-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Konsultatsiya</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABEL[consultation.status] ?? consultation.status}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(consultation.created_at).toLocaleDateString('uz-UZ', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {/* Patient symptoms card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconWrap}>
              <FontAwesome name="heartbeat" size={18} color={Theme.primary} />
            </View>
            <Text style={styles.cardTitle}>Bemor shikoyatlari</Text>
          </View>
          <Text style={styles.symptomsBody}>
            {consultation.symptoms || 'Ko\'rsatilmagan'}
          </Text>
        </View>

        {/* Client info */}
        {consultation.client && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconWrap}>
                <FontAwesome name="user-o" size={18} color={Theme.primary} />
              </View>
              <Text style={styles.cardTitle}>Bemor</Text>
            </View>
            <View style={styles.clientRow}>
              <Text style={styles.clientName}>{consultation.client.name}</Text>
              <Text style={styles.clientPhone}>{consultation.client.phone}</Text>
            </View>
          </View>
        )}

        {/* Slot time */}
        {consultation.slotStartsAt && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconWrap}>
                <FontAwesome name="clock-o" size={18} color={Theme.primary} />
              </View>
              <Text style={styles.cardTitle}>Belgilangan vaqt</Text>
            </View>
            <Text style={styles.slotTime}>
              {new Date(consultation.slotStartsAt).toLocaleString('uz-UZ', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
              {consultation.slotEndsAt && (
                ` - ${new Date(consultation.slotEndsAt).toLocaleTimeString('uz-UZ', {
                  hour: '2-digit', minute: '2-digit',
                })}`
              )}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Narxi</Text>
            <Text style={styles.priceValue}>
              {(consultation.priceAmount ?? 0).toLocaleString('uz-UZ')} UZS
            </Text>
          </View>
        </View>

        {/* Video call button */}
        {isActive && (
          <Pressable
            style={({ pressed }) => [styles.videoCallBtn, pressed && { opacity: 0.9 }]}
            onPress={handleJoinCall}
            disabled={joiningCall}
          >
            <FontAwesome name="video-camera" size={20} color="#fff" />
            {joiningCall ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.videoCallText}>Video qo'ng'iroq</Text>
            )}
          </Pressable>
        )}

        {/* Doctor notes (completed) */}
        {isCompleted && consultation.doctorNotes && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconWrap}>
                <FontAwesome name="file-text-o" size={18} color={Theme.primary} />
              </View>
              <Text style={styles.cardTitle}>Doktor xulosasi</Text>
            </View>
            <Text style={styles.notesBody}>{consultation.doctorNotes}</Text>
          </View>
        )}

        {/* Complete form */}
        {isActive && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconWrap}>
                <FontAwesome name="pencil" size={18} color={Theme.primary} />
              </View>
              <Text style={styles.cardTitle}>Doktor xulosasi</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Tashxis, tavsiyalar, retseptlar..."
              placeholderTextColor={Theme.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {isActive && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.completeBtnWrap, pressed && { opacity: 0.9 }, completing && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={completing}
          >
            <LinearGradient
              colors={Theme.gradientWarm}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeBtn}
            >
              {completing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.completeBtnText}>Yakunlash</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
    gap: Spacing.md,
  },
  errorTitle: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Theme.text },
  backBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Theme.primary,
    marginTop: Spacing.md,
  },
  backBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.borderLight,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: Theme.text,
  },

  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700' },
  dateText: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Theme.text,
  },
  symptomsBody: {
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    lineHeight: 24,
  },

  clientRow: { gap: 4 },
  clientName: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Theme.text },
  clientPhone: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  slotTime: { fontSize: Typography.body.fontSize, fontWeight: '500', color: Theme.text },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: Typography.body.fontSize, color: Theme.textSecondary },
  priceValue: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.primary },

  videoCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.info,
    borderRadius: Radius.full,
    paddingVertical: 14,
  },
  videoCallText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fff' },

  notesBody: {
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    lineHeight: 24,
  },

  notesInput: {
    backgroundColor: Theme.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
    minHeight: 140,
    lineHeight: 22,
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.borderLight,
  },
  completeBtnWrap: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  completeBtn: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
});

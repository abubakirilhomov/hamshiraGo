import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
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

type ConsultationType = 'video' | 'chat';

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
}

const DAY_NAMES_UZ = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ConsultationScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    doctorId: string;
    symptoms?: string;
    spec?: string;
  }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [symptoms, setSymptoms] = useState(params.symptoms ?? '');
  const [consultationType, setConsultationType] = useState<ConsultationType>('video');

  // ─── Slot picker state ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const dates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        iso: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayOfWeek: d.getDay(),
      };
    }), []);

  // Select first date on mount
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0].iso);
  }, []);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !params.doctorId || !token) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    apiFetch<Slot[]>(`/doctors/${params.doctorId}/slots?date=${selectedDate}`, { token })
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, params.doctorId, token]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });

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
      const body: Record<string, string> = {
        doctorId: params.doctorId,
        consultationType,
      };
      if (symptoms.trim()) body.symptoms = symptoms.trim();
      if (params.spec) body.suggestedSpecialization = params.spec;
      if (selectedSlot) body.slotId = selectedSlot.id;

      const res = await apiFetch<ConsultationResponse>('/consultations', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });

      // Initiate payment if price > 0
      if (res.price > 0) {
        try {
          const paymentRes = await apiFetch<{ paymeUrl: string; clickUrl: string }>(`/payments/consultation/${res.id}/initiate`, {
            method: 'POST',
            token,
          });

          // Let user choose payment method
          Alert.alert(
            "To'lov usulini tanlang",
            `Konsultatsiya narxi: ${res.price.toLocaleString()} so'm`,
            [
              {
                text: 'Payme',
                onPress: async () => {
                  await WebBrowser.openBrowserAsync(paymentRes.paymeUrl);
                  router.replace('/consultations');
                },
              },
              {
                text: 'Click',
                onPress: async () => {
                  await WebBrowser.openBrowserAsync(paymentRes.clickUrl);
                  router.replace('/consultations');
                },
              },
              {
                text: "Keyinroq to'lash",
                style: 'cancel',
                onPress: () => router.replace('/consultations'),
              },
            ],
          );
        } catch {
          // Payment initiation failed but consultation is created
          showToast(t('consultation.booked'), 'success');
          router.replace('/consultations');
        }
      } else {
        showToast(t('consultation.booked'), 'success');
        router.replace('/consultations');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [token, params.doctorId, symptoms, params.spec, consultationType, selectedSlot, submitting, t, showToast]);

  // ─── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  const price = doctor.pricePerConsultation ?? 80000;

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
        <Text style={styles.headerTitle}>Konsultatsiya</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Doctor card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorRow}>
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
                <FontAwesome name="user-md" size={28} color={Theme.textTertiary} />
              </View>
            )}
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{getName(doctor)}</Text>
              <Text style={styles.doctorSpec}>{getSpec(doctor)}</Text>
              <Text style={styles.doctorExp}>
                {doctor.consultationCount ?? 0} ta konsultatsiya
              </Text>
            </View>
          </View>
          {/* Online badge */}
          {doctor.isActive && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          )}
        </View>

        {/* Symptoms section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shikoyatlaringiz</Text>
          <TextInput
            style={styles.textarea}
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="O'zingizni qanday his qilyapsiz? Belgilarni batafsil yozib qoldiring..."
            placeholderTextColor={Theme.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Consultation type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konsultatsiya turi</Text>
          <View style={styles.typeRow}>
            {/* Video call option */}
            <Pressable
              style={[
                styles.typeCard,
                consultationType === 'video' && styles.typeCardSelected,
              ]}
              onPress={() => setConsultationType('video')}
            >
              <View style={styles.typeIconWrap}>
                <FontAwesome
                  name="video-camera"
                  size={20}
                  color={consultationType === 'video' ? Theme.primary : Theme.textSecondary}
                />
              </View>
              <Text style={[
                styles.typeLabel,
                consultationType === 'video' && { color: Theme.primary },
              ]}>
                Video qo'ng'iroq
              </Text>
              <Text style={styles.typeSubtitle}>15-20 daqiqa</Text>
            </Pressable>

            {/* Chat option */}
            <Pressable
              style={[
                styles.typeCard,
                consultationType === 'chat' && styles.typeCardSelected,
              ]}
              onPress={() => setConsultationType('chat')}
            >
              <View style={styles.typeIconWrap}>
                <FontAwesome
                  name="commenting"
                  size={20}
                  color={consultationType === 'chat' ? Theme.primary : Theme.textSecondary}
                />
              </View>
              <Text style={[
                styles.typeLabel,
                consultationType === 'chat' && { color: Theme.primary },
              ]}>
                Yozma chat
              </Text>
              <Text style={styles.typeSubtitle}>Cheksiz xabarlar</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Slot Picker ─────────────────────────────────────────── */}

        {/* Date picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sana tanlang</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {dates.map((d) => {
              const active = d.iso === selectedDate;
              return (
                <Pressable
                  key={d.iso}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(d.iso)}
                >
                  <Text style={[styles.dateDayName, active && styles.dateTextActive]}>
                    {DAY_NAMES_UZ[d.dayOfWeek]}
                  </Text>
                  <Text style={[styles.dateDayNum, active && styles.dateTextActive]}>
                    {d.dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Time slot picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vaqt tanlang</Text>
          {slotsLoading ? (
            <View style={styles.slotsGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.slotSkeleton} />
              ))}
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptySlots}>
              <FontAwesome name="calendar-times-o" size={24} color={Theme.textTertiary} />
              <Text style={styles.emptySlotsText}>
                Bu kunga bo'sh vaqt yo'q
              </Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const disabled = slot.isBooked;
                return (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipActive,
                      disabled && styles.slotChipDisabled,
                    ]}
                    onPress={() => {
                      if (disabled) return;
                      setSelectedSlot(isSelected ? null : slot);
                    }}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.slotText,
                      isSelected && styles.slotTextActive,
                      disabled && styles.slotTextDisabled,
                    ]}>
                      {formatTime(slot.startsAt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Price section */}
        <View style={styles.priceSection}>
          <Text style={styles.priceCaption}>XIZMAT NARXI</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>
              {price.toLocaleString('ru-RU')}
            </Text>
            <Text style={styles.priceCurrency}>UZS</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <LinearGradient
            colors={Theme.primaryGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, submitting && { opacity: 0.6 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>
                Konsultatsiya olish  →
              </Text>
            )}
          </LinearGradient>
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
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
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

  /* Scroll */
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.xl,
  },

  /* Doctor card */
  doctorCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 18,
    color: Theme.text,
  },
  doctorSpec: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  doctorExp: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textTertiary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Theme.successContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.success,
  },
  onlineText: {
    fontFamily: Fonts.interSb,
    fontSize: 11,
    color: Theme.success,
    letterSpacing: 0.5,
  },

  /* Section */
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
  },

  /* Textarea */
  textarea: {
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  /* Consultation type */
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: Theme.primary,
    backgroundColor: Theme.primaryLight,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,104,96,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: Theme.text,
    textAlign: 'center',
  },
  typeSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textTertiary,
    textAlign: 'center',
  },

  /* Date chips */
  dateRow: {
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  dateChip: {
    width: 60,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateChipActive: {
    backgroundColor: Theme.primary,
  },
  dateDayName: {
    fontFamily: Fonts.interMd,
    fontSize: 12,
    color: Theme.textSecondary,
  },
  dateDayNum: {
    fontFamily: Fonts.manropeBd,
    fontSize: 18,
    color: Theme.text,
  },
  dateTextActive: {
    color: '#ffffff',
  },

  /* Slot grid */
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotChip: {
    width: '31%' as any,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotChipActive: {
    backgroundColor: Theme.primary,
  },
  slotChipDisabled: {
    backgroundColor: Theme.surfaceContainerHigh,
    opacity: 0.5,
  },
  slotText: {
    fontFamily: Fonts.interMd,
    fontSize: 14,
    color: Theme.text,
  },
  slotTextActive: {
    color: '#ffffff',
  },
  slotTextDisabled: {
    color: Theme.textTertiary,
  },
  slotSkeleton: {
    width: '31%' as any,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceContainerHigh,
    opacity: 0.4,
  },
  emptySlots: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptySlotsText: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textTertiary,
    textAlign: 'center',
  },

  /* Price */
  priceSection: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.lg,
  },
  priceCaption: {
    fontFamily: Fonts.interMd,
    fontSize: 12,
    color: Theme.textTertiary,
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceValue: {
    fontFamily: Fonts.manropeXb,
    fontSize: 32,
    color: Theme.text,
  },
  priceCurrency: {
    fontFamily: Fonts.inter,
    fontSize: 16,
    color: Theme.textSecondary,
  },

  /* CTA */
  ctaWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.background,
  },
  ctaBtn: {
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});

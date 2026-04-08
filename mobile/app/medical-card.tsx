import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface MedicalCard {
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  notes: string | null;
}

const BLOOD_TYPES = [
  'I (O) Rh+', 'I (O) Rh-',
  'II (A) Rh+', 'II (A) Rh-',
  'III (B) Rh+', 'III (B) Rh-',
  'IV (AB) Rh+', 'IV (AB) Rh-',
];

export default function MedicalCardScreen() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [notes, setNotes] = useState('');
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingChronic, setEditingChronic] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<MedicalCard | null>('/medical-card', { token })
      .then((card) => {
        if (card) {
          setBloodType(card.bloodType ?? '');
          setAllergies(card.allergies ?? '');
          setChronicDiseases(card.chronicDiseases ?? '');
          setNotes(card.notes ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token || saving) return;
    setSaving(true);
    try {
      await apiFetch('/medical-card', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          bloodType: bloodType.trim() || null,
          allergies: allergies.trim() || null,
          chronicDiseases: chronicDiseases.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      setEditingAllergies(false);
      setEditingChronic(false);
      setEditingNotes(false);
      showToast(t('medcard.saved'), 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : String(e), 'error');
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <FontAwesome name="chevron-left" size={20} color={Theme.text} />
          </Pressable>
          <Text style={styles.brandText}>Clinical Sanctuary</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* Title area */}
        <Text style={styles.profileLabel}>HAMSHIRAGO PROFILE</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tibbiy karta</Text>
        </View>
        <View style={styles.idRow}>
          <Text style={styles.idText}>
            ARES{String(user?.id ?? '0001320000').slice(0, 10).padStart(10, '0')}
          </Text>
          <Pressable hitSlop={8}>
            <FontAwesome name="pencil" size={14} color={Theme.textSecondary} />
          </Pressable>
        </View>

        {/* Blood type section */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="tint" size={18} color={Theme.error} />
            <Text style={styles.sectionTitle}>Qon guruhi</Text>
          </View>
          <View style={styles.chipGrid}>
            {BLOOD_TYPES.map((bt) => {
              const isSelected = bloodType === bt;
              return (
                <Pressable
                  key={bt}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => setBloodType(bt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {bt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Allergies section */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="warning" size={16} color={Theme.warning} />
            <Text style={styles.sectionTitle}>Allergiyalar</Text>
            <Pressable
              onPress={() => setEditingAllergies(!editingAllergies)}
              hitSlop={8}
              style={{ marginLeft: 'auto' }}
            >
              <FontAwesome
                name={editingAllergies ? 'check' : 'pencil'}
                size={14}
                color={Theme.textSecondary}
              />
            </Pressable>
          </View>
          {editingAllergies ? (
            <TextInput
              style={styles.textarea}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Allergiyalaringizni kiriting..."
              placeholderTextColor={Theme.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={1000}
            />
          ) : (
            <Text style={styles.sectionContent}>
              {allergies || t('medcard.allergies', 'Hali kiritilmagan')}
            </Text>
          )}
        </View>

        {/* Chronic diseases section */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="heartbeat" size={16} color={Theme.error} />
            <Text style={styles.sectionTitle}>Surunkali kasalliklar</Text>
            <Pressable
              onPress={() => setEditingChronic(!editingChronic)}
              hitSlop={8}
              style={{ marginLeft: 'auto' }}
            >
              <FontAwesome
                name={editingChronic ? 'check' : 'pencil'}
                size={14}
                color={Theme.textSecondary}
              />
            </Pressable>
          </View>
          {editingChronic ? (
            <TextInput
              style={styles.textarea}
              value={chronicDiseases}
              onChangeText={setChronicDiseases}
              placeholder="Surunkali kasalliklarni kiriting..."
              placeholderTextColor={Theme.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={1000}
            />
          ) : (
            <Text style={styles.sectionContent}>
              {chronicDiseases || t('medcard.chronicDiseases', 'Hali kiritilmagan')}
            </Text>
          )}
        </View>

        {/* Notes section */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="sticky-note-o" size={16} color={Theme.info} />
            <Text style={styles.sectionTitle}>Eslatmalar</Text>
            <Pressable
              onPress={() => setEditingNotes(!editingNotes)}
              hitSlop={8}
              style={{ marginLeft: 'auto' }}
            >
              <FontAwesome
                name={editingNotes ? 'check' : 'pencil'}
                size={14}
                color={Theme.textSecondary}
              />
            </Pressable>
          </View>
          {editingNotes ? (
            <TextInput
              style={styles.textarea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Eslatmalarni kiriting..."
              placeholderTextColor={Theme.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={2000}
            />
          ) : (
            <Text style={styles.sectionContent}>
              {notes || t('medcard.notes', 'Hali kiritilmagan')}
            </Text>
          )}
        </View>

        {/* Bottom spacer for sticky button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Theme.textInverse} />
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
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  brandText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.primary,
  },

  profileLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 11,
    color: Theme.textTertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 24,
    color: Theme.text,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  idText: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.text,
  },
  sectionContent: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 22,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Theme.surfaceContainerLow,
  },
  chipSelected: {
    backgroundColor: Theme.primary,
  },
  chipText: {
    fontFamily: Fonts.interMd,
    fontSize: 13,
    color: Theme.text,
  },
  chipTextSelected: {
    color: Theme.textInverse,
  },

  textarea: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.text,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.background,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },
});

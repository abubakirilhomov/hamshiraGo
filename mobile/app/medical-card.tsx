import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface MedicalCard {
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  notes: string | null;
}

export default function MedicalCardScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [notes, setNotes] = useState('');

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
      Alert.alert(t('medcard.saved'));
    } catch (e: unknown) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <FieldLabel label={t('medcard.bloodType')} />
        <TextInput
          style={styles.input}
          value={bloodType}
          onChangeText={setBloodType}
          placeholder="A+, B-, O+..."
          placeholderTextColor={Theme.textSecondary}
          maxLength={10}
        />
      </View>

      <View style={styles.card}>
        <FieldLabel label={t('medcard.allergies')} />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={allergies}
          onChangeText={setAllergies}
          placeholder="..."
          placeholderTextColor={Theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <View style={styles.card}>
        <FieldLabel label={t('medcard.chronicDiseases')} />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={chronicDiseases}
          onChangeText={setChronicDiseases}
          placeholder="..."
          placeholderTextColor={Theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <View style={styles.card}>
        <FieldLabel label={t('medcard.notes')} />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="..."
          placeholderTextColor={Theme.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={2000}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, saving && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.saveBtnText}>{t('medcard.save')}</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 15,
    color: Theme.text,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.background,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 10,
  },
  saveBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

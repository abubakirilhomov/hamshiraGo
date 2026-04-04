import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getScoreColor(score: number): string {
  if (score <= 6) return '#EF4444';
  if (score <= 8) return '#F59E0B';
  return '#10B981';
}

export default function NpsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (selectedScore === null || !token) return;

    setSubmitting(true);
    try {
      await apiFetch('/nps/submit', {
        token,
        method: 'POST',
        body: JSON.stringify({
          score: selectedScore,
          comment: comment.trim() || undefined,
        }),
      });

      setSubmitted(true);
    } catch (err: any) {
      toast.show(err.message ?? 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedScore, comment, token]);

  if (submitted) {
    return (
      <View style={s.center}>
        <FontAwesome name="heart" size={64} color={Theme.primary} />
        <Text style={s.thankTitle}>{t('nps.thankYou')}</Text>
        <Text style={s.thankSub}>{t('nps.thankYouSub')}</Text>
        <Pressable
          style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.back()}
        >
          <Text style={s.doneBtnText}>{t('nps.done')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.flex} contentContainerStyle={s.content}>
        <Text style={s.question}>{t('nps.question')}</Text>
        <Text style={s.subText}>{t('nps.subText')}</Text>

        {/* Score buttons */}
        <View style={s.scoresRow}>
          {SCORES.map((score) => {
            const isSelected = selectedScore === score;
            const color = getScoreColor(score);
            return (
              <Pressable
                key={score}
                style={[
                  s.scoreBtn,
                  isSelected && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setSelectedScore(score)}
              >
                <Text
                  style={[s.scoreBtnText, isSelected && { color: '#fff' }]}
                >
                  {score}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.scaleLabels}>
          <Text style={s.scaleLabel}>{t('nps.notLikely')}</Text>
          <Text style={s.scaleLabel}>{t('nps.veryLikely')}</Text>
        </View>

        {/* Comment */}
        {selectedScore !== null && (
          <View style={s.commentSection}>
            <Text style={s.commentLabel}>{t('nps.commentLabel')}</Text>
            <TextInput
              style={s.commentInput}
              placeholder={t('nps.commentPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            s.submitBtn,
            pressed && { opacity: 0.9 },
            (selectedScore === null || submitting) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={selectedScore === null || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>{t('nps.submit')}</Text>
          )}
        </Pressable>

        {/* Skip */}
        <Pressable style={s.skipBtn} onPress={() => router.back()}>
          <Text style={s.skipBtnText}>{t('nps.skip')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scoreBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  scaleLabel: { fontSize: 12, color: '#9CA3AF' },
  commentSection: { marginBottom: Spacing.lg },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacing.xs,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: { paddingVertical: Spacing.md, alignItems: 'center' },
  skipBtnText: { fontSize: 14, color: '#6B7280' },
  thankTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  thankSub: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  doneBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 32,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

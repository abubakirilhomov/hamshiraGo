import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const SCORES_ROW1 = [1, 2, 3, 4, 5, 6];
const SCORES_ROW2 = [7, 8, 9, 10];

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
      toast.showToast(err.message ?? 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedScore, comment, token]);

  // Thank-you state
  if (submitted) {
    return (
      <View style={styles.overlay}>
        <View style={styles.thankCard}>
          <View style={styles.trophyCircle}>
            <FontAwesome name="trophy" size={24} color={Theme.textInverse} />
          </View>
          <Text style={styles.thankTitle}>{t('nps.thankYou')}</Text>
          <Text style={styles.thankSub}>{t('nps.thankYouSub')}</Text>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>{t('nps.done')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderScoreCircle = (score: number) => {
    const isSelected = selectedScore === score;
    return (
      <Pressable
        key={score}
        style={[
          styles.scoreCircle,
          isSelected && styles.scoreCircleSelected,
        ]}
        onPress={() => setSelectedScore(score)}
      >
        <Text
          style={[
            styles.scoreNumber,
            isSelected && styles.scoreNumberSelected,
          ]}
        >
          {score}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          {/* Close button */}
          <Pressable
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <FontAwesome name="times" size={18} color={Theme.textTertiary} />
          </Pressable>

          {/* Trophy icon */}
          <View style={styles.trophyCircle}>
            <FontAwesome name="trophy" size={24} color={Theme.textInverse} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Bizni baholang</Text>
          <Text style={styles.subtitle}>
            Xizmatimizni 1 dan 10 gacha baholang
          </Text>

          {/* Score circles - Row 1 */}
          <View style={styles.scoresRow}>
            {SCORES_ROW1.map(renderScoreCircle)}
          </View>
          {/* Score circles - Row 2 */}
          <View style={styles.scoresRow}>
            {SCORES_ROW2.map(renderScoreCircle)}
          </View>

          {/* Comment */}
          <Text style={styles.commentLabel}>
            Sizning fikringiz (ixtiyoriy)
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder={t('nps.commentPlaceholder', 'Izoh yozing...')}
            placeholderTextColor={Theme.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />

          {/* Submit CTA */}
          <Pressable
            style={({ pressed }) => [
              pressed && { opacity: 0.9 },
              (selectedScore === null || submitting) && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={selectedScore === null || submitting}
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
                <Text style={styles.submitBtnText}>Yuborish</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Skip link */}
          <Pressable
            style={styles.skipBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.skipText}>Keyinroq</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    maxWidth: 340,
    width: '90%',
    alignItems: 'center',
  },

  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1,
  },

  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },

  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleSelected: {
    backgroundColor: Theme.primary,
  },
  scoreNumber: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.textSecondary,
  },
  scoreNumberSelected: {
    color: Theme.textInverse,
  },

  commentLabel: {
    fontFamily: Fonts.interMd,
    fontSize: 14,
    color: Theme.text,
    alignSelf: 'flex-start',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  commentInput: {
    fontFamily: Fonts.inter,
    width: '100%',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Theme.text,
    height: 80,
    marginBottom: Spacing.lg,
  },

  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    minWidth: 260,
  },
  submitBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },

  skipBtn: {
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  thankCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    maxWidth: 340,
    width: '90%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  thankTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 20,
    color: Theme.text,
  },
  thankSub: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
});

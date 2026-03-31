import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { trackEvent } from '@/utils/analytics';

interface ClientRatingModalProps {
  visible: boolean;
  submitting: boolean;
  onSubmit: (stars: number, comment?: string) => void;
  onSkip: () => void;
}

export default function ClientRatingModal({
  visible,
  submitting,
  onSubmit,
  onSkip,
}: ClientRatingModalProps) {
  const { t } = useTranslation();
  const [pendingRating, setPendingRating] = useState(0);
  const [review, setReview] = useState('');

  const handleStarPress = useCallback((star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingRating(star);
  }, []);

  if (!visible) return null;

  const handleSubmit = () => {
    if (pendingRating === 0) return;
    trackEvent('rating_submitted', { rating: pendingRating }).catch(() => {});
    onSubmit(pendingRating, review.trim() || undefined);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('rating.rateClient')}</Text>
      <Text style={styles.ratingHint}>
        {t('rating.tapStar')}
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.6 }]}
            onPress={() => handleStarPress(star)}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={`${star} из 5 звёзд`}
            accessibilityState={{ selected: star <= pendingRating }}
          >
            <FontAwesome
              name={star <= pendingRating ? 'star' : 'star-o'}
              size={38}
              color={star <= pendingRating ? Theme.primary : Theme.border}
            />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.reviewInput}
        value={review}
        onChangeText={setReview}
        placeholder={t('rating.reviewPlaceholder')}
        placeholderTextColor={Theme.textSecondary}
        multiline
        maxLength={1000}
        editable={!submitting}
        accessibilityLabel="Текст отзыва"
      />
      <Pressable
        style={({ pressed }) => [
          styles.submitRatingBtn,
          pendingRating === 0 && styles.submitRatingDisabled,
          pressed && pendingRating > 0 && { opacity: 0.8 },
        ]}
        onPress={handleSubmit}
        disabled={submitting || pendingRating === 0}
        accessibilityRole="button"
        accessibilityLabel="Отправить отзыв"
      >
        {submitting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitRatingText}>
              {pendingRating === 0 ? t('rating.selectRating') : t('rating.submit', { stars: pendingRating })}
            </Text>
        }
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
        onPress={onSkip}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={t('rating.skip')}
      >
        <Text style={styles.skipBtnText}>{t('rating.skip')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingHint: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
    marginBottom: Spacing.xs,
    color: Theme.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  starBtn: {
    alignItems: 'center',
    padding: Spacing.xs,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.text,
    minHeight: 72,
    textAlignVertical: 'top',
    backgroundColor: Theme.background,
  },
  submitRatingBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitRatingDisabled: {
    backgroundColor: Theme.border,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
});

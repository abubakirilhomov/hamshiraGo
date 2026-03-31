import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { trackEvent } from '@/utils/analytics';

interface RatingModalProps {
  visible: boolean;
  submitting: boolean;
  onSubmit: (stars: number, review?: string) => void;
  onClose?: () => void;
}

export default function RatingModal({
  visible,
  submitting,
  onSubmit,
}: RatingModalProps) {
  const { t } = useTranslation();
  const [pendingRating, setPendingRating] = useState(0);
  const [review, setReview] = useState('');

  if (!visible) return null;

  const handleSubmit = () => {
    if (pendingRating === 0) return;
    trackEvent('rating_submitted', {
      rating: pendingRating,
      hasComment: !!review.trim(),
    }).catch(() => {});
    onSubmit(pendingRating, review.trim() || undefined);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('rating.rateMedic')}</Text>
      <Text style={styles.ratingHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
        {t('rating.tapStar')}
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.6 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPendingRating(star);
            }}
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
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingHint: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 4,
    color: '#6b7280',
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
    borderRadius: 10,
    padding: Spacing.md,
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '700',
  },
});

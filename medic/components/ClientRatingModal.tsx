import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Theme } from '@/constants/Theme';

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

  if (!visible) return null;

  const handleSubmit = () => {
    if (pendingRating === 0) return;
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
            onPress={() => setPendingRating(star)}
            disabled={submitting}
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
      />
      <Pressable
        style={({ pressed }) => [
          styles.submitRatingBtn,
          pendingRating === 0 && styles.submitRatingDisabled,
          pressed && pendingRating > 0 && { opacity: 0.8 },
        ]}
        onPress={handleSubmit}
        disabled={submitting || pendingRating === 0}
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
      >
        <Text style={styles.skipBtnText}>{t('rating.skip')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
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
    color: Theme.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  starBtn: {
    alignItems: 'center',
    padding: 4,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Theme.text,
    minHeight: 72,
    textAlignVertical: 'top',
    backgroundColor: Theme.background,
  },
  submitRatingBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitRatingDisabled: {
    backgroundColor: Theme.border,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
});

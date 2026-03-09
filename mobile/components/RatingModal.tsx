import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';

interface RatingModalProps {
  visible: boolean;
  submitting: boolean;
  onSubmit: (stars: number) => void;
  onClose?: () => void;
}

export default function RatingModal({
  visible,
  submitting,
  onSubmit,
}: RatingModalProps) {
  const [pendingRating, setPendingRating] = useState(0);

  if (!visible) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Оцените медика</Text>
      <Text style={styles.ratingHint} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
        Нажмите на звезду чтобы выбрать оценку
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
      <Pressable
        style={({ pressed }) => [
          styles.submitRatingBtn,
          pendingRating === 0 && styles.submitRatingDisabled,
          pressed && pendingRating > 0 && { opacity: 0.8 },
        ]}
        onPress={() => pendingRating > 0 && onSubmit(pendingRating)}
        disabled={submitting || pendingRating === 0}
      >
        {submitting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitRatingText}>
              {pendingRating === 0 ? 'Выберите оценку' : `Отправить — ${pendingRating} ★`}
            </Text>
        }
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
    color: '#6b7280',
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
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Medic {
  id: string;
  name: string;
  phone: string;
  profilePhotoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

interface MedicInfoCardProps {
  medic: Medic;
}

// ─── Component ───────────────────────────────────────────────────────────────

function MedicInfoCard({ medic }: MedicInfoCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('track.yourMedic')}</Text>
      <View style={styles.medicRow}>
        <View style={styles.medicAvatar}>
          {medic.profilePhotoUrl
            ? <Image source={{ uri: medic.profilePhotoUrl }} style={styles.medicAvatarImg} placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }} contentFit="cover" transition={200} accessibilityLabel={medic.name} />
            : <FontAwesome name="user-md" size={22} color={Theme.primary} accessibilityLabel={medic.name} />
          }
        </View>
        <View style={styles.medicInfo}>
          <Text style={styles.medicName}>{medic.name}</Text>
          {medic.rating != null && (
            <View style={styles.medicRatingRow} accessibilityLabel={`Рейтинг ${Number(medic.rating).toFixed(1)} из 5`}>
              <FontAwesome name="star" size={13} color={Theme.primary} />
              <Text style={styles.medicRatingText}>{Number(medic.rating).toFixed(1)}</Text>
              {medic.reviewCount != null && medic.reviewCount > 0 && (
                <Text style={styles.medicReviewCount}>
                  ({medic.reviewCount} {t('review.reviews')})
                </Text>
              )}
              {medic.reviewCount === 0 && (
                <Text style={styles.medicReviewCount}>{t('review.noReviews')}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default React.memo(MedicInfoCard);

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  medicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medicAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medicAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
  },
  medicInfo: {
    flex: 1,
    gap: 3,
  },
  medicName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text,
  },
  medicRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  medicRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.primary,
  },
  medicReviewCount: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
});

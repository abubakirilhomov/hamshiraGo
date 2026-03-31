import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import type { MedicUser } from '@/context/AuthContext';

interface ProfileHeaderProps {
  medic: MedicUser;
  ratingDisplay: string | null;
  uploadingPhoto: boolean;
  onPickPhoto: () => void;
  reviewLabel: string;
  noReviewsLabel: string;
}

function ProfileHeaderInner({
  medic,
  ratingDisplay,
  uploadingPhoto,
  onPickPhoto,
  reviewLabel,
  noReviewsLabel,
}: ProfileHeaderProps) {
  return (
    <LinearGradient
      colors={Theme.bannerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Pressable style={styles.avatarWrap} onPress={onPickPhoto} disabled={uploadingPhoto} accessibilityLabel={medic.name} accessibilityRole="image">
        {medic.profilePhotoUrl ? (
          <Image source={{ uri: medic.profilePhotoUrl }} style={styles.avatarImg} placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }} contentFit="cover" transition={200} accessibilityLabel={medic.name} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{medic.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {uploadingPhoto ? (
          <View style={styles.avatarBadge}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <View style={styles.avatarBadge}>
            <FontAwesome name="camera" size={10} color="#fff" />
          </View>
        )}
      </Pressable>
      <Text style={styles.name}>{medic.name}</Text>
      <Text style={styles.phone}>{medic.phone}</Text>
      {ratingDisplay != null && (
        <View style={styles.ratingRow} accessibilityLabel={`Рейтинг ${ratingDisplay}`}>
          <FontAwesome name="star" size={14} color="#fde68a" />
          <Text style={styles.ratingText}>{ratingDisplay}</Text>
          {medic.reviewCount > 0 ? (
            <Text style={styles.reviewCountText}>
              ({medic.reviewCount} {reviewLabel})
            </Text>
          ) : (
            <Text style={styles.reviewCountText}>{noReviewsLabel}</Text>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

export const ProfileHeader = React.memo(ProfileHeaderInner);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: Radius.md,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: Typography.h2.fontSize, fontWeight: '700', color: '#fff' },
  phone: { fontSize: Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 6 },
  ratingText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fde68a' },
  reviewCountText: { fontSize: Typography.caption.fontSize, color: 'rgba(255,255,255,0.7)' },
});

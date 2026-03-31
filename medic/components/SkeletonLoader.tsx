import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme, Radius, Spacing } from '@/constants/Theme';

// ─── Base Skeleton ───────────────────────────────────────────────────────────

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Theme.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ─── Preset: Avatar ──────────────────────────────────────────────────────────

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonAvatar({ size = 80, style }: SkeletonAvatarProps) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

// ─── Preset: Line ────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width = '100%', height = 14, style }: SkeletonLineProps) {
  return <Skeleton width={width} height={height} borderRadius={6} style={style} />;
}

// ─── Preset: Order Card ──────────────────────────────────────────────────────

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      {/* Header row: title + price */}
      <View style={styles.row}>
        <Skeleton width="55%" height={16} borderRadius={6} />
        <Skeleton width={80} height={16} borderRadius={6} />
      </View>

      {/* Location line */}
      <View style={styles.locationRow}>
        <Skeleton width={13} height={13} borderRadius={6} />
        <Skeleton width="75%" height={13} borderRadius={6} />
      </View>

      {/* Phone line */}
      <View style={styles.locationRow}>
        <Skeleton width={13} height={13} borderRadius={6} />
        <Skeleton width="45%" height={13} borderRadius={6} />
      </View>

      {/* Footer: time + button */}
      <View style={[styles.row, styles.footer]}>
        <Skeleton width={50} height={13} borderRadius={6} />
        <Skeleton width={100} height={40} borderRadius={10} />
      </View>
    </View>
  );
}

// ─── Preset: My Order Card (compact) ─────────────────────────────────────────

export function SkeletonMyOrderCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <Skeleton width="50%" height={15} borderRadius={6} />
        <Skeleton width={70} height={24} borderRadius={20} />
      </View>
      <View style={styles.locationRow}>
        <Skeleton width={12} height={12} borderRadius={6} />
        <Skeleton width="60%" height={13} borderRadius={6} />
      </View>
      <View style={styles.row}>
        <Skeleton width={90} height={15} borderRadius={6} />
        <Skeleton width={13} height={13} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Preset: Profile Header ──────────────────────────────────────────────────

export function SkeletonProfileHeader() {
  return (
    <View style={styles.profileHeader}>
      <SkeletonAvatar size={80} />
      <SkeletonLine width={140} height={20} style={{ marginTop: 12 }} />
      <SkeletonLine width={100} height={14} style={{ marginTop: 6 }} />
      <View style={[styles.row, { justifyContent: 'center', gap: 6, marginTop: 8 }]}>
        <Skeleton width={14} height={14} borderRadius={7} />
        <Skeleton width={30} height={14} borderRadius={6} />
        <Skeleton width={60} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footer: {
    marginTop: 2,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
});

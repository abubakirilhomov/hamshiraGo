import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme, Radius, Spacing } from '@/constants/Theme';

interface SkeletonLoaderProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

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

/** Matches ServiceCard dimensions: icon + two text lines */
export function SkeletonServiceCard() {
  return (
    <View style={skeletonStyles.serviceCard}>
      <SkeletonLoader width={48} height={48} borderRadius={24} />
      <View style={skeletonStyles.serviceCardBody}>
        <SkeletonLoader width="70%" height={16} borderRadius={6} />
        <SkeletonLoader width="40%" height={13} borderRadius={6} />
      </View>
      <SkeletonLoader width={14} height={14} borderRadius={4} />
    </View>
  );
}

/** Matches OrderCard dimensions: header + location + footer */
export function SkeletonOrderCard() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={skeletonStyles.orderHeader}>
        <SkeletonLoader width="55%" height={16} borderRadius={6} />
        <SkeletonLoader width={72} height={24} borderRadius={20} />
      </View>
      <View style={skeletonStyles.orderRow}>
        <SkeletonLoader width={13} height={13} borderRadius={4} />
        <SkeletonLoader width="60%" height={13} borderRadius={6} />
      </View>
      <View style={skeletonStyles.orderFooter}>
        <SkeletonLoader width={90} height={16} borderRadius={6} />
        <SkeletonLoader width={80} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

/** Single text line placeholder */
export function SkeletonLine({
  width = '100%',
  height = 14,
}: {
  width?: number | `${number}%`;
  height?: number;
}) {
  return <SkeletonLoader width={width} height={height} borderRadius={6} />;
}

/** Circular avatar placeholder */
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonLoader width={size} height={size} borderRadius={size / 2} />;
}

const skeletonStyles = StyleSheet.create({
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 14,
  },
  serviceCardBody: {
    flex: 1,
    gap: 6,
  },
  orderCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
});

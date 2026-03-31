import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Shadow } from '@/constants/Theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const ICON_MAP: Record<ToastType, React.ComponentProps<typeof FontAwesome>['name']> = {
  success: 'check-circle',
  error: 'times-circle',
  info: 'info-circle',
  warning: 'exclamation-triangle',
};

const COLOR_MAP: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#ECFDF5', text: '#065F46', icon: Theme.success },
  error:   { bg: '#FEF2F2', text: '#991B1B', icon: Theme.error },
  info:    { bg: '#EFF6FF', text: '#1E40AF', icon: Theme.info },
  warning: { bg: '#FFFBEB', text: '#92400E', icon: Theme.warning },
};

export function Toast({ message, type, duration = 3000, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 250 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
      opacity.value = withTiming(0, { duration: 250 });
    }, duration);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colors = COLOR_MAP[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: colors.bg },
        animatedStyle,
      ]}
    >
      <Pressable style={styles.content} onPress={onDismiss}>
        <FontAwesome name={ICON_MAP[type]} size={20} color={colors.icon} />
        <Animated.Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
          {message}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    borderRadius: Radius.md,
    ...Shadow.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

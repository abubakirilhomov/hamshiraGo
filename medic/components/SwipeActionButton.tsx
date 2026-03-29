/**
 * SwipeActionButton — кнопка "потяни вправо для подтверждения"
 * Работает как слайдер принятия звонка на iPhone.
 * Использует Animated + PanResponder (без gesture-handler).
 * Корректно работает внутри ScrollView — захватывает только горизонтальные жесты.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme } from '@/constants/Theme';

interface SwipeActionButtonProps {
  label: string;
  color?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

const THUMB_SIZE = 62;
const PADDING = 5;
const TRIGGER_RATIO = 0.72;

export function SwipeActionButton({
  label,
  color = Theme.primary,
  onConfirm,
  disabled = false,
}: SwipeActionButtonProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const containerWidth = useRef(0);
  const triggeredRef = useRef(false);
  const completedRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);

  const maxTranslate = () =>
    Math.max(0, containerWidth.current - THUMB_SIZE - PADDING * 2);

  const snapBack = () => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
      speed: 14,
    }).start();
  };

  const snapForward = (cb: () => void) => {
    Animated.timing(pan, {
      toValue: maxTranslate(),
      duration: 120,
      useNativeDriver: true,
    }).start(() => cb());
  };

  const panResponder = useRef(
    PanResponder.create({
      // Не захватывать при простом tap — ScrollView должен работать свободно
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Захватывать только явно горизонтальные движения
      onMoveShouldSetPanResponder: (_, gs) =>
        !disabled &&
        !completedRef.current &&
        Math.abs(gs.dx) > 6 &&
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        !disabled &&
        !completedRef.current &&
        Math.abs(gs.dx) > 10 &&
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      // Не отдавать жест ScrollView после захвата — иначе snap back без trigger
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        triggeredRef.current = false;
      },
      onPanResponderMove: (_, gs) => {
        const max = maxTranslate();
        const x = Math.max(0, Math.min(gs.dx, max));
        pan.setValue(x);

        if (!triggeredRef.current && max > 0 && x / max >= TRIGGER_RATIO) {
          triggeredRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      },
      onPanResponderRelease: () => {
        if (triggeredRef.current) {
          completedRef.current = true;
          snapForward(() => {
            onConfirmRef.current();
            setTimeout(() => {
              completedRef.current = false;
              triggeredRef.current = false;
              snapBack();
            }, 400);
          });
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: () => {
        triggeredRef.current = false;
        snapBack();
      },
    }),
  ).current;

  const textOpacity = pan.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const thumbScale = pan.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 1.08],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.track, { backgroundColor: disabled ? '#ccc' : color }]}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
      }}
    >
      <Animated.Text style={[styles.label, { opacity: textOpacity }]}>
        {label}
      </Animated.Text>

      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX: pan }, { scale: thumbScale }] },
        ]}
        {...panResponder.panHandlers}
      >
        <FontAwesome name="chevron-right" size={22} color={disabled ? '#aaa' : color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 74,
    borderRadius: 37,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.3,
    pointerEvents: 'none',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});

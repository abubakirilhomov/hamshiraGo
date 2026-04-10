import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Fonts, Radius, Spacing, Theme, Typography, Shadow } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ONBOARDING_DONE_KEY = 'medic_onboarding_completed';

interface Slide {
  key: string;
  icon: string;
  titleKey: string;
  descKey: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    icon: 'briefcase-medical',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
  },
  {
    key: '2',
    icon: 'id-card',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
  },
  {
    key: '3',
    icon: 'map-location-dot',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
  },
];

function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 28 : 8);
  const opacity = useSharedValue(active ? 1 : 0.35);

  React.useEffect(() => {
    width.value = withTiming(active ? 28 : 8, { duration: 250 });
    opacity.value = withTiming(active ? 1 : 0.35, { duration: 250 });
  }, [active, width, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? Theme.primary : Theme.surfaceContainerHigh },
        animStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const finish = useCallback(async () => {
    try { await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true'); } catch {}
    router.replace('/language-picker');
  }, [router]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  }, [activeIndex, finish]);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <FontAwesome6
            name={item.icon as any}
            size={64}
            color={Theme.primary}
          />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.description}>{t(item.descKey)}</Text>
      </View>
    ),
    [t],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip link top-right */}
      <View style={[styles.skipContainer, { top: insets.top + Spacing.md }]}>
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom section: pill dots + gradient pill CTA */}
      <View style={styles.bottomSection}>
        <DotIndicator count={SLIDES.length} activeIndex={activeIndex} />

        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? t('onboarding.start') : `${t('onboarding.next')}`}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  skipContainer: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
  },
  skipText: {
    ...Typography.body,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  button: {
    width: SCREEN_WIDTH - Spacing.xxl * 2,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.button,
    fontFamily: Fonts.manropeSb,
    color: Theme.textInverse,
  },
});

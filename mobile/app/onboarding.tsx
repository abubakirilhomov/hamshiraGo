import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  key: string;
  icon: 'medkit' | 'map-marker' | 'star';
  titleKey: string;
  descKey: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    icon: 'medkit',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
  },
  {
    key: '2',
    icon: 'map-marker',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
  },
  {
    key: '3',
    icon: 'star',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
  },
];

const DOT_SIZE = 10;
const DOT_GAP = Spacing.sm;

function Dot({ active }: { active: boolean }) {
  const animWidth = useSharedValue(active ? DOT_SIZE * 2.5 : DOT_SIZE);
  const animOpacity = useSharedValue(active ? 1 : 0.4);

  React.useEffect(() => {
    animWidth.value = withTiming(active ? DOT_SIZE * 2.5 : DOT_SIZE, {
      duration: 250,
    });
    animOpacity.value = withTiming(active ? 1 : 0.4, { duration: 250 });
  }, [active, animWidth, animOpacity]);

  const style = useAnimatedStyle(() => ({
    width: animWidth.value,
    opacity: animOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: active ? Theme.primary : Theme.border,
        },
        style,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/language-picker');
  }, [router]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  }, [currentIndex, completeOnboarding]);

  const renderItem = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.iconContainer}>
          <FontAwesome name={item.icon} size={72} color={Theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <Animated.Text style={styles.title}>{t(item.titleKey)}</Animated.Text>
          <Animated.Text style={styles.description}>
            {t(item.descKey)}
          </Animated.Text>
        </View>
      </View>
    ),
    [t],
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Skip button */}
      <View style={[styles.skipRow, { top: insets.top + Spacing.md }]}>
        <Pressable onPress={completeOnboarding} hitSlop={16}>
          <Animated.Text style={styles.skipText}>
            {t('onboarding.skip')}
          </Animated.Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
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

      {/* Bottom section: dots + button */}
      <View style={styles.bottomSection}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <Dot key={slide.key} active={i === currentIndex} />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleNext}
        >
          <Animated.Text style={styles.buttonText}>
            {isLastSlide ? t('onboarding.start') : t('onboarding.next')}
          </Animated.Text>
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
  skipRow: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
  },
  skipText: {
    ...Typography.body,
    color: Theme.textSecondary,
  },
  slide: {
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
  textContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Theme.text,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_GAP,
  },
  button: {
    width: '100%',
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: Theme.primaryDark,
  },
  buttonText: {
    ...Typography.button,
    color: Theme.textInverse,
  },
});

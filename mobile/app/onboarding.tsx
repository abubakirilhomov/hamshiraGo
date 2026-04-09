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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Theme,
  Fonts,
  Radius,
  Spacing,
  Shadow,
} from '@/constants/Theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Slides data                                                        */
/* ------------------------------------------------------------------ */

interface Slide {
  key: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  badge: string;
  titleKey: string;
  descKey: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    icon: 'user-md',
    badge: 'Uyda tibbiy yordam',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
  },
  {
    key: '2',
    icon: 'stethoscope',
    badge: 'Tez va qulay',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
  },
  {
    key: '3',
    icon: 'heartbeat',
    badge: 'Ishonchli xizmat',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
  },
];

/* ------------------------------------------------------------------ */
/*  Dot indicator (Reanimated)                                         */
/* ------------------------------------------------------------------ */

const DOT_H = 6;
const DOT_INACTIVE_W = 6;
const DOT_ACTIVE_W = 24;

function Dot({ active }: { active: boolean }) {
  const animWidth = useSharedValue(active ? DOT_ACTIVE_W : DOT_INACTIVE_W);
  const animOpacity = useSharedValue(active ? 1 : 0.35);

  React.useEffect(() => {
    animWidth.value = withTiming(active ? DOT_ACTIVE_W : DOT_INACTIVE_W, {
      duration: 280,
    });
    animOpacity.value = withTiming(active ? 1 : 0.35, { duration: 280 });
  }, [active, animWidth, animOpacity]);

  const style = useAnimatedStyle(() => ({
    width: animWidth.value,
    opacity: animOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: DOT_H,
          borderRadius: DOT_H / 2,
          backgroundColor: active ? Theme.primary : Theme.textTertiary,
        },
        style,
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

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

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

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

  const isLastSlide = currentIndex === SLIDES.length - 1;

  /* ---- render slide ---- */
  const renderItem = useCallback(
    ({ item, index }: { item: Slide; index: number }) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Illustration card */}
        <View style={styles.illustrationCard}>
          <FontAwesome name={item.icon} size={80} color={Theme.primary} />
          {/* Floating badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        </View>

        {/* Page counter */}
        <Text style={styles.counter}>
          {index + 1} / {SLIDES.length}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          paddingBottom: insets.bottom + Spacing.md,
        },
      ]}
    >
      {/* ---- Header row: logo + skip ---- */}
      <View style={styles.header}>
        <Text style={styles.logoText}>HamshiraGo</Text>
        <Pressable onPress={completeOnboarding} hitSlop={16}>
          <Text style={styles.skipText}>
            {t('onboarding.skip', "O'tkazib yuborish")}
          </Text>
        </Pressable>
      </View>

      {/* ---- Slides (illustration + counter) ---- */}
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
        style={styles.flatList}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* ---- Bottom section ---- */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <Dot key={slide.key} active={i === currentIndex} />
          ))}
        </View>

        {/* Title + description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t(SLIDES[currentIndex].titleKey)}</Text>
          <Text style={styles.description}>
            {t(SLIDES[currentIndex].descKey)}
          </Text>
        </View>

        {/* CTA button */}
        <Pressable onPress={handleNext} style={{ width: '100%' }}>
          {({ pressed }) => (
            <LinearGradient
              colors={Theme.primaryGradient as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>
                {isLastSlide
                  ? t('onboarding.start', 'Boshlash')
                  : t('onboarding.next', 'Keyingisi')}
              </Text>
              <FontAwesome
                name="arrow-right"
                size={16}
                color={Theme.textInverse}
                style={{ marginLeft: Spacing.sm }}
              />
            </LinearGradient>
          )}
        </Pressable>

        {/* Footer trust line */}
        <View style={styles.footerRow}>
          <FontAwesome
            name="shield"
            size={12}
            color={Theme.textTertiary}
            style={{ marginRight: Spacing.xs }}
          />
          <Text style={styles.footerText}>
            Davlat litsenziyalangan tibbiyot xizmati
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.55;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  logoText: {
    fontSize: 20,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.primary,
  },
  skipText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    fontWeight: '400',
    color: Theme.textSecondary,
  },

  /* Slide */
  flatList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },

  /* Illustration card */
  illustrationCard: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: Radius.xl,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  badge: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: Theme.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    fontWeight: '500',
    color: Theme.primary,
  },

  /* Counter */
  counter: {
    marginTop: Spacing.xxl,
    fontSize: 14,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.textTertiary,
  },

  /* Bottom section */
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  /* Text */
  textContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Fonts.inter,
    fontWeight: '400',
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  /* Button */
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.textInverse,
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    fontWeight: '400',
    color: Theme.textTertiary,
  },
});

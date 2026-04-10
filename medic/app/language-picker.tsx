import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Fonts, Radius, Spacing, Theme, Typography, Shadow } from '@/constants/Theme';
import type { Language } from '@/i18n';

export default function LanguagePickerScreen() {
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Language>('uz');

  const handleContinue = async () => {
    await setLanguage(selected);
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxxl }]}>
      {/* Green medkit icon */}
      <View style={styles.iconWrap}>
        <FontAwesome6 name="kit-medical" size={40} color={Theme.primary} />
      </View>

      {/* Title + subtitle */}
      <Text style={styles.title}>Tilni tanlang</Text>
      <Text style={styles.subtitle}>Vybierite yazyk</Text>

      {/* Language cards */}
      <View style={styles.cardsWrap}>
        <Pressable
          style={[styles.langCard, selected === 'uz' && styles.langCardActive]}
          onPress={() => setSelected('uz')}
        >
          <View style={styles.langCardContent}>
            <Text style={styles.flag}>UZ</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, selected === 'uz' && styles.langNameActive]}>
                O'zbek tili
              </Text>
              <Text style={styles.langNative}>Uzbek</Text>
            </View>
            <View style={[styles.radio, selected === 'uz' && styles.radioActive]}>
              {selected === 'uz' && <View style={styles.radioDot} />}
            </View>
          </View>
        </Pressable>

        <Pressable
          style={[styles.langCard, selected === 'ru' && styles.langCardActive]}
          onPress={() => setSelected('ru')}
        >
          <View style={styles.langCardContent}>
            <Text style={styles.flag}>RU</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, selected === 'ru' && styles.langNameActive]}>
                Russkiy yazyk
              </Text>
              <Text style={styles.langNative}>Russian</Text>
            </View>
            <View style={[styles.radio, selected === 'ru' && styles.radioActive]}>
              {selected === 'ru' && <View style={styles.radioDot} />}
            </View>
          </View>
        </Pressable>
      </View>

      {/* Gradient pill CTA */}
      <View style={styles.ctaWrap}>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaBtnText}>Davom etish</Text>
            <FontAwesome name="arrow-right" size={14} color={Theme.textInverse} />
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
    paddingHorizontal: Spacing.xl,
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },

  title: {
    fontFamily: Fonts.manropeBd,
    fontSize: 26,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },

  cardsWrap: {
    gap: Spacing.md,
  },

  langCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  langCardActive: {
    backgroundColor: Theme.primaryLight,
  },
  langCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  flag: {
    fontFamily: Fonts.manropeBd,
    fontSize: 18,
    color: Theme.primary,
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Theme.surfaceContainerLow,
    textAlign: 'center',
    lineHeight: 40,
    overflow: 'hidden',
  },

  langName: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.h4.fontSize,
    color: Theme.text,
  },
  langNameActive: {
    color: Theme.primary,
  },
  langNative: {
    fontFamily: Fonts.inter,
    fontSize: Typography.caption.fontSize,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: Theme.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Theme.textInverse,
  },

  ctaWrap: {
    marginTop: 'auto',
    paddingBottom: Spacing.xxxl,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.full,
  },
  ctaBtnText: {
    ...Typography.button,
    fontFamily: Fonts.manropeSb,
    color: Theme.textInverse,
  },
});

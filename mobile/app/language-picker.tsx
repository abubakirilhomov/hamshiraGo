import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Spacing, Radius, Typography } from '@/constants/Theme';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n';

const LANGUAGES: { code: Language; badge: string; title: string; subtitle: string }[] = [
  { code: 'uz', badge: 'UZ', title: "O'zbekcha", subtitle: 'UZBEK LANGUAGE' },
  { code: 'ru', badge: 'RU', title: 'Русский', subtitle: 'RUSSIAN LANGUAGE' },
];

export default function LanguagePickerScreen() {
  const insets = useSafeAreaInsets();
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const [selected, setSelected] = useState<Language>('uz');

  const pick = async () => {
    await setLanguage(selected);
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.lg }]}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <FontAwesome name="medkit" size={24} color="#ffffff" />
      </View>

      {/* Headlines */}
      <Text style={styles.headline}>Tilni tanlang</Text>
      <Text style={styles.subtitle}>Выберите язык</Text>

      {/* Language cards */}
      <View style={styles.cardsWrapper}>
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => setSelected(lang.code)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{lang.badge}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>{lang.title}</Text>
                  <Text style={styles.cardSubtitle}>{lang.subtitle}</Text>
                </View>
              </View>

              {/* Radio */}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Hint */}
      <View style={styles.hintRow}>
        <FontAwesome name="info-circle" size={14} color={Theme.textTertiary} style={{ marginTop: 2 }} />
        <Text style={styles.hintText}>
          Tizim tilini keyinchalik sozlamalar bo'limidan o'zgartirishingiz mumkin.
        </Text>
      </View>

      {/* CTA */}
      <Pressable onPress={pick} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <LinearGradient
          colors={Theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Davom etish  &#8594;</Text>
        </LinearGradient>
      </Pressable>

      {/* Footer */}
      <Text style={styles.footer}>HAMSHIRAGO MEDICAL EXCELLENCE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    paddingHorizontal: Spacing.xl,
  },

  /* --- Icon --- */
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },

  /* --- Headlines --- */
  headline: {
    ...Typography.h1,
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Theme.textSecondary,
    marginBottom: Spacing.xxl,
  },

  /* --- Cards --- */
  cardsWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Theme.primary,
    backgroundColor: Theme.primaryLight,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badge: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...Typography.caption,
    color: '#ffffff',
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
  },
  cardTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    lineHeight: 22,
    color: Theme.text,
  },
  cardSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    lineHeight: 16,
    color: Theme.textSecondary,
    marginTop: 2,
  },

  /* --- Radio --- */
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Theme.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Theme.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.primary,
  },

  /* --- Hint --- */
  hintRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
    paddingRight: Spacing.lg,
  },
  hintText: {
    ...Typography.bodySmall,
    color: Theme.textTertiary,
    flex: 1,
  },

  /* --- CTA --- */
  cta: {
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  ctaText: {
    ...Typography.button,
    color: '#ffffff',
  },

  /* --- Footer --- */
  footer: {
    textAlign: 'center',
    fontFamily: Fonts.inter,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Theme.textTertiary,
    marginTop: 'auto',
  },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useLanguage } from '@/context/LanguageContext';

interface CatalogService {
  id: string;
  title: string;
  titleUz: string | null;
  description: string | null;
  descriptionUz: string | null;
  price: number;
  durationMinutes: number | null;
  category: string | null;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HERO_HEIGHT = SCREEN_HEIGHT * 0.4;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [service, setService] = useState<CatalogService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch<CatalogService>(`/services/${id}`)
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centered}>
        <Text>{t('service.notFound')}</Text>
      </View>
    );
  }

  const displayTitle = language === 'uz' && service.titleUz ? service.titleUz : service.title;
  const displayDescription = language === 'uz' && service.descriptionUz
    ? service.descriptionUz
    : service.description;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero section */}
        <LinearGradient
          colors={['#006860', '#004D47']}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* Back button */}
          <Pressable
            style={[styles.backButton, { top: insets.top + 16 }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </Pressable>

          {/* Icon */}
          <View style={styles.heroIconWrap}>
            <FontAwesome name="medkit" size={60} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{displayTitle}</Text>

          {/* Price pill */}
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>
              {service.price.toLocaleString('ru-RU')} UZS
            </Text>
          </View>
        </LinearGradient>

        {/* White card overlapping hero */}
        <View style={styles.contentCard}>
          {/* Info row */}
          <View style={styles.infoRow}>
            {service.durationMinutes != null && (
              <View style={styles.infoItem}>
                <FontAwesome name="clock-o" size={16} color={Theme.textSecondary} />
                <Text style={styles.infoText}>
                  {service.durationMinutes} {t('service.min')}
                </Text>
              </View>
            )}
            {service.category && (
              <>
                {service.durationMinutes != null && (
                  <View style={styles.infoDivider} />
                )}
                <View style={styles.infoItem}>
                  <FontAwesome name="medkit" size={14} color={Theme.textSecondary} />
                  <Text style={styles.infoText}>{service.category}</Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          {displayDescription && (
            <>
              <Text style={styles.sectionTitle}>
                {t('service.about', { defaultValue: 'Xizmat haqida' })}
              </Text>
              <Text style={styles.descText}>{displayDescription}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => router.push({ pathname: '/order/location', params: { serviceId: service.id } })}
        >
          <LinearGradient
            colors={[Theme.primaryGradient[0], Theme.primaryGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {t('service.order', { defaultValue: 'Buyurtma berish' })}
            </Text>
            <FontAwesome name="arrow-right" size={16} color="#fff" />
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
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },

  /* Hero */
  hero: {
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    // top is set dynamically via paddingTop on hero
  },
  heroIconWrap: {
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  pricePillText: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: '#fff',
  },

  /* Content card */
  contentCard: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -24,
    padding: Spacing.xl,
    minHeight: 300,
    ...Shadow.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    fontFamily: Fonts.interMd,
    color: Theme.textSecondary,
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: Theme.surfaceContainerHigh,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  descText: {
    fontSize: 15,
    fontFamily: Fonts.inter,
    lineHeight: 24,
    color: Theme.textSecondary,
  },

  /* Sticky CTA */
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
});

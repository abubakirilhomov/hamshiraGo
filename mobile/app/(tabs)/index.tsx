import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { ServiceCard } from '@/components/ServiceCard';
import { SkeletonServiceCard } from '@/components/SkeletonLoader';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { cacheSet, cacheGet, cacheGetStale } from '@/utils/cache';

interface CatalogService {
  id: string;
  title: string;
  titleUz: string | null;
  price: number;
  durationMinutes: number | null;
  category: string | null;
  categoryUz: string | null;
}

export default function HomeScreen() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { token } = useAuth();

  const [fromCache, setFromCache] = useState(false);

  const SERVICES_CACHE_KEY = 'services';
  const SERVICES_TTL = 3_600_000; // 1 hour

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFromCache(false);

    // Show fresh cache immediately while fetching in background
    try {
      const cached = await cacheGet<CatalogService[]>(SERVICES_CACHE_KEY, SERVICES_TTL);
      if (cached && cached.length > 0) {
        setServices(cached);
        setLoading(false);
      }
    } catch {
      // ignore cache read errors
    }

    try {
      const data = await apiFetch<CatalogService[]>('/services', { token: token ?? undefined });
      setServices(data);
      setError(null);
      await cacheSet(SERVICES_CACHE_KEY, data);
    } catch (e: unknown) {
      // If we already have fresh cached data shown, no need to show error
      if (services.length > 0) return;
      // Try stale cache as offline fallback
      try {
        const stale = await cacheGetStale<CatalogService[]>(SERVICES_CACHE_KEY);
        if (stale && stale.length > 0) {
          setServices(stale);
          setFromCache(true);
        } else {
          setError(e instanceof Error ? e.message : t('common.error'));
        }
      } catch {
        setError(e instanceof Error ? e.message : t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }, [token, language]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const getTitle = (s: CatalogService) =>
    language === 'uz' && s.titleUz ? s.titleUz : s.title;

  const getCategory = (s: CatalogService) =>
    language === 'uz' && s.categoryUz ? s.categoryUz : (s.category ?? t('home.other'));

  // Group by category
  const categories = [...new Set(services.map(getCategory))];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={Theme.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>HamshiraGo</Text>
        <Text style={styles.bannerSubtitle}>{t('home.bannerSubtitle')}</Text>
      </LinearGradient>

      {/* AI Assistant banner */}
      <Pressable
        style={({ pressed }) => [styles.aiBanner, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/ai-chat')}
      >
        <View style={styles.aiBannerIcon}>
          <FontAwesome name="heartbeat" size={20} color={Theme.primary} />
        </View>
        <View style={styles.aiBannerTexts}>
          <Text style={styles.aiBannerTitle}>{t('aiChat.banner')}</Text>
          <Text style={styles.aiBannerDesc}>{t('aiChat.bannerDesc')}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={Theme.primary} />
      </Pressable>

      {fromCache && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>{t('common.cachedData')}</Text>
        </View>
      )}

      {loading ? (
        <View style={{ marginTop: 16, gap: 0 }}>
          <SkeletonServiceCard />
          <SkeletonServiceCard />
          <SkeletonServiceCard />
          <SkeletonServiceCard />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadServices} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('home.errorRetry')}</Text>
          </Pressable>
        </View>
      ) : (
        categories.map((cat) => (
          <View key={cat}>
            <Text style={styles.sectionTitle}>{cat}</Text>
            {services
              .filter((s) => getCategory(s) === cat)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    title: getTitle(service),
                    price: service.price,
                    durationMinutes: service.durationMinutes,
                  }}
                />
              ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  banner: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  discountBadge: {
    backgroundColor: `${Theme.warning}20`,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: `${Theme.warning}40`,
  },
  discountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#854d0e',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  errorBox: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: `${Theme.error}12`,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Theme.error,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Theme.primary,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cacheBanner: {
    backgroundColor: `${Theme.warning}20`,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Theme.warning}40`,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.primary}10`,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Theme.primary}25`,
    gap: Spacing.md,
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTexts: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.text,
  },
  aiBannerDesc: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 1,
  },
  cacheBannerText: {
    fontSize: 13,
    color: '#854d0e',
    textAlign: 'center',
    fontWeight: '500',
  },
});

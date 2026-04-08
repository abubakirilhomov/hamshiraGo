import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { ServiceCard, ServiceCardItem } from '@/components/ServiceCard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
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

interface NearbyMedic {
  id: string;
  name: string;
  avatar?: string | null;
  rating?: number;
  reviewCount?: number;
  distance?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyMedics, setNearbyMedics] = useState<NearbyMedic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [fromCache, setFromCache] = useState(false);

  const SERVICES_CACHE_KEY = 'services';
  const SERVICES_TTL = 3_600_000; // 1 hour

  /* ------------------------------------------------------------------ */
  /*  Load services (preserved logic)                                    */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /*  Load nearby medics                                                 */
  /* ------------------------------------------------------------------ */
  const loadNearbyMedics = useCallback(async () => {
    try {
      const data = await apiFetch<NearbyMedic[]>('/medics/nearby', {
        token: token ?? undefined,
      });
      setNearbyMedics(data);
    } catch {
      // silently fail — section simply won't show
    }
  }, [token]);

  useEffect(() => {
    loadServices();
    loadNearbyMedics();
  }, [loadServices, loadNearbyMedics]);

  const getTitle = (s: CatalogService) =>
    language === 'uz' && s.titleUz ? s.titleUz : s.title;

  /* ------------------------------------------------------------------ */
  /*  Filter services by search query                                    */
  /* ------------------------------------------------------------------ */
  const filteredServices = searchQuery.trim()
    ? services.filter((s) =>
        getTitle(s).toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : services;

  /* ------------------------------------------------------------------ */
  /*  Build flat grid data (no category grouping in grid)                */
  /* ------------------------------------------------------------------ */
  const gridData: ServiceCardItem[] = filteredServices.map((s) => ({
    id: s.id,
    title: getTitle(s),
    price: s.price,
    durationMinutes: s.durationMinutes,
  }));

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  const renderMedicCard = ({ item }: { item: NearbyMedic }) => (
    <Pressable
      style={({ pressed }) => [styles.medicCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: '/medic/[id]' as any, params: { id: item.id } })}
    >
      <View style={styles.medicAvatar}>
        <FontAwesome name="user" size={22} color={Theme.textTertiary} />
      </View>
      <Text style={styles.medicName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.medicRatingRow}>
        <FontAwesome name="star" size={12} color="#F59E0B" />
        <Text style={styles.medicRatingText}>
          {item.rating?.toFixed(1) ?? '0.0'}
        </Text>
        <Text style={styles.medicReviewCount}>
          ({item.reviewCount ?? 0})
        </Text>
      </View>
      <Text style={styles.medicDistance} numberOfLines={1}>
        {item.distance
          ? `${item.distance >= 1 ? item.distance.toFixed(1) + ' km' : Math.round(item.distance * 1000) + ' m'} masofada`
          : "Yaqin masofada"}
      </Text>
    </Pressable>
  );

  const renderServiceItem = ({ item }: { item: ServiceCardItem }) => (
    <ServiceCard service={item} gridMode />
  );

  const renderHeader = () => (
    <>
      {/* ---- Header ---- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>HamshiraGo</Text>
          <Text style={styles.headerSubtitle}>Uyga tez yetib boramiz</Text>
        </View>
        <Pressable
          style={styles.bellBtn}
          onPress={() => router.push('/notifications' as any)}
        >
          <FontAwesome name="bell-o" size={20} color={Theme.text} />
        </Pressable>
      </View>

      {/* ---- Search ---- */}
      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={16}
          color={Theme.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder', 'Xizmatlarni qidirish...')}
          placeholderTextColor={Theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* ---- AI Chat Banner ---- */}
      <Pressable
        style={({ pressed }) => [styles.aiBanner, pressed && { opacity: 0.9 }]}
        testID="ai_chat_banner"
        onPress={() => router.push('/ai-chat')}
      >
        <View style={styles.aiBannerLeft}>
          <View style={styles.aiBannerIconCircle}>
            <FontAwesome name="commenting" size={20} color="#fff" />
          </View>
          <View style={styles.aiBannerTexts}>
            <Text style={styles.aiBannerTitle}>
              {t('aiChat.banner', 'AI Hamshira bilan gaplashing')}
            </Text>
            <Text style={styles.aiBannerDesc}>
              {t('aiChat.bannerDesc', "Sog'ligingiz haqida savol berish...")}
            </Text>
          </View>
        </View>
        <View style={styles.aiBannerButton}>
          <Text style={styles.aiBannerButtonText}>
            {t('aiChat.ask', 'Savol berish')}
          </Text>
        </View>
      </Pressable>

      {/* ---- Nearby Medics ---- */}
      {nearbyMedics.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('nearby.title', 'Yaqin oradagi mutaxassislar')}
            </Text>
            <Pressable onPress={() => router.push('/nearby-medics' as any)}>
              <Text style={styles.seeAll}>
                {t('common.seeAll', 'Barchasi')}
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={nearbyMedics}
            renderItem={renderMedicCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.medicsList}
          />
        </View>
      )}

      {/* ---- Cached data warning ---- */}
      {fromCache && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>{t('common.cachedData')}</Text>
        </View>
      )}

      {/* ---- Services section header ---- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('home.catalog', 'Xizmatlar katalogi')}
        </Text>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonLoader width={48} height={48} borderRadius={14} />
              <SkeletonLoader
                width="80%"
                height={14}
                borderRadius={6}
                style={{ marginTop: 12 }}
              />
              <SkeletonLoader
                width="50%"
                height={13}
                borderRadius={6}
                style={{ marginTop: 6 }}
              />
            </View>
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadServices} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('home.errorRetry')}</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={!loading && !error ? gridData : []}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    paddingBottom: 100,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.lg - 6,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Theme.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Search ---- */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.text,
    height: '100%',
    padding: 0,
  },

  /* ---- AI Chat Banner ---- */
  aiBanner: {
    backgroundColor: Theme.primary,
    borderRadius: 20,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiBannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  aiBannerTexts: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },
  aiBannerDesc: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  aiBannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aiBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: Theme.primary,
  },

  /* ---- Sections ---- */
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: Theme.primary,
  },

  /* ---- Nearby Medic Card ---- */
  medicsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  medicCard: {
    width: 140,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  medicAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  medicName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  medicRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  medicRatingText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.interSb,
    color: Theme.text,
  },
  medicReviewCount: {
    fontSize: 11,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
  },
  medicDistance: {
    fontSize: 11,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
  },

  /* ---- Error / Cache ---- */
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
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Theme.warning}40`,
  },
  cacheBannerText: {
    fontSize: 13,
    color: '#854d0e',
    textAlign: 'center',
    fontWeight: '500',
  },

  /* ---- Skeleton grid ---- */
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg - 6,
  },
  skeletonCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - Spacing.lg * 2) / 2 - 12,
    maxWidth: (SCREEN_WIDTH - Spacing.lg * 2) / 2 - 12,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    margin: 6,
    height: 160,
  },
});

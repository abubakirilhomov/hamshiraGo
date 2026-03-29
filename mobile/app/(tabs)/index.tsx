import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { ServiceCard } from '@/components/ServiceCard';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

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

  const loadServices = () => {
    setLoading(true);
    setError(null);
    apiFetch<CatalogService[]>('/services', { token: token ?? undefined })
      .then(setServices)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t('common.error')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, [language]);

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

      {loading ? (
        <ActivityIndicator color={Theme.primary} style={{ marginTop: 32 }} />
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
    padding: 16,
    paddingBottom: 32,
  },
  banner: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  discountBadge: {
    backgroundColor: `${Theme.warning}20`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
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
    marginBottom: 12,
  },
  errorBox: {
    margin: 16,
    padding: 16,
    backgroundColor: `${Theme.error}12`,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
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
});

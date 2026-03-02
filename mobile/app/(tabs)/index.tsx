import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { ServiceCard } from '@/components/ServiceCard';

interface CatalogService {
  id: string;
  title: string;
  price: number;
  durationMinutes: number | null;
  category: string | null;
}

export default function HomeScreen() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = () => {
    setLoading(true);
    setError(null);
    apiFetch<CatalogService[]>('/services')
      .then(setServices)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Ошибка загрузки услуг'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Group by category
  const categories = [...new Set(services.map((s) => s.category ?? 'Прочее'))];

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
        <Text style={styles.bannerSubtitle}>Медсёстры с опытом 3+ лет</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={Theme.primary} style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadServices} style={styles.retryBtn}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        categories.map((cat) => (
          <View key={cat}>
            <Text style={styles.sectionTitle}>{cat}</Text>
            {services
              .filter((s) => (s.category ?? 'Прочее') === cat)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    title: service.title,
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

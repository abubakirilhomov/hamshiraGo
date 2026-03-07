import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
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

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
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
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconLarge}>
        <FontAwesome name="medkit" size={40} color={Theme.primary} />
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <View style={styles.priceBlock}>
        <Text style={styles.priceLabel}>{t('service.cost')}</Text>
        <Text style={styles.price}>{service.price.toLocaleString('ru-RU')} UZS</Text>
      </View>
      {displayDescription && (
        <Text style={styles.desc}>{displayDescription}</Text>
      )}
      {service.durationMinutes != null && (
        <Text style={styles.eta} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
          {t('service.duration', { n: service.durationMinutes })}
        </Text>
      )}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.orderButton, pressed && styles.orderButtonPressed]}
          onPress={() => router.push({ pathname: '/order/location', params: { serviceId: service.id } })}
        >
          <Text style={styles.orderButtonText}>{t('service.order')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  priceBlock: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  priceLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.primary,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: Theme.text,
    marginBottom: 12,
  },
  eta: {
    fontSize: 14,
    marginBottom: 24,
  },
  footer: {
    marginTop: 16,
  },
  orderButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonPressed: {
    opacity: 0.9,
  },
  orderButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

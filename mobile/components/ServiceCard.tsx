import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';

export interface ServiceCardItem {
  id: string;
  title: string;
  price: number;
  durationMinutes?: number | null;
}

type ServiceCardProps = {
  service: ServiceCardItem;
};

export const ServiceCard = React.memo(function ServiceCard({ service }: ServiceCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/service/[id]',
      params: { id: service.id },
    });
  }, [service.id, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${service.title}, ${service.price.toLocaleString('ru-RU')} UZS`}
    >
      <View style={styles.iconWrap}>
        <FontAwesome name="medkit" size={24} color={Theme.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.price} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
          {service.price.toLocaleString('ru-RU')} UZS
          {service.durationMinutes ? ` · ~${service.durationMinutes} ${t('service.min')}` : ''}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={Theme.textSecondary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
  },
  price: {
    fontSize: 13,
    marginTop: 2,
  },
});

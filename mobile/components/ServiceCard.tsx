import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';

export interface ServiceCardItem {
  id: string;
  title: string;
  price: number;
  durationMinutes?: number | null;
}

type ServiceCardProps = {
  service: ServiceCardItem;
  gridMode?: boolean;
};

export const ServiceCard = React.memo(function ServiceCard({
  service,
  gridMode = false,
}: ServiceCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/service/[id]',
      params: { id: service.id },
    });
  }, [service.id, router]);

  if (gridMode) {
    return (
      <Pressable
        style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${service.title}, ${service.price.toLocaleString('ru-RU')} UZS`}
      >
        <View style={styles.gridIconWrap}>
          <FontAwesome name="medkit" size={22} color="#fff" />
        </View>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {service.title}
        </Text>
        <Text style={styles.gridPrice}>
          {service.price.toLocaleString('ru-RU')} UZS
        </Text>
        <View style={styles.gridAddBtn}>
          <FontAwesome name="plus" size={12} color="#fff" />
        </View>
      </Pressable>
    );
  }

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
  /* ---- List mode (backward compat) ---- */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
  },
  price: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    marginTop: 2,
  },

  /* ---- Grid mode ---- */
  gridCard: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    margin: 6,
    minHeight: 160,
    ...Shadow.sm,
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: Theme.text,
    marginBottom: 4,
  },
  gridPrice: {
    fontSize: 13,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginBottom: Spacing.sm,
  },
  gridAddBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

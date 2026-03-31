import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import type { OrderLocation, OrderStatus } from '@/types/order';

async function openInMaps(latitude: number, longitude: number, t: (key: string) => string) {
  const lat = latitude;
  const lng = longitude;

  const yandexApp =
    Platform.OS === 'ios'
      ? `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=16&l=map`
      : `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=16`;

  const yandexWeb = `https://maps.yandex.ru/?pt=${lng},${lat}&z=16&l=map`;
  const googleWeb = `https://maps.google.com/?q=${lat},${lng}`;

  try {
    const canYandex = await Linking.canOpenURL(yandexApp);
    if (canYandex) {
      await Linking.openURL(yandexApp);
      return;
    }
  } catch {}

  Alert.alert(t('orders.openInMaps'), '', [
    { text: t('orders.yandexMaps'), onPress: () => Linking.openURL(yandexWeb) },
    { text: t('orders.googleMaps'), onPress: () => Linking.openURL(googleWeb) },
    { text: t('profile.cancel'), style: 'cancel' },
  ]);
}

interface ClientInfoProps {
  location: OrderLocation;
  status: OrderStatus;
  clientId?: string;
  medCardLoading: boolean;
  onViewMedCard: () => void;
  t: (key: string) => string;
}

function ClientInfoInner({
  location,
  status,
  clientId,
  medCardLoading,
  onViewMedCard,
  t,
}: ClientInfoProps) {
  const clientLat =
    location.latitude != null ? Number(location.latitude) : null;
  const clientLng =
    location.longitude != null ? Number(location.longitude) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('orders.clientAddress')}</Text>
      <View style={styles.locationRow}>
        <FontAwesome name="map-marker" size={16} color={Theme.primary} />
        <Text style={styles.locationText}>
          {location.house}
          {location.floor ? `, ${t('orders.floorFull')} ${location.floor}` : ''}
          {location.apartment ? `, ${t('orders.apartment')} ${location.apartment}` : ''}
        </Text>
      </View>
      <View style={styles.locationRow}>
        <FontAwesome name="phone" size={16} color={Theme.primary} />
        <Text style={styles.locationText}>{location.phone}</Text>
        {status !== 'DONE' && status !== 'CANCELED' && (
          <Pressable
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
            onPress={() => Linking.openURL(`tel:${location.phone}`)}
          >
            <FontAwesome name="phone" size={13} color="#fff" />
            <Text style={styles.callBtnText}>{t('orders.callPatient')}</Text>
          </Pressable>
        )}
      </View>
      {clientLat != null && clientLng != null && (
        <Pressable
          style={({ pressed }) => [
            styles.mapsBtn,
            pressed && styles.mapsBtnPressed,
          ]}
          onPress={() => openInMaps(clientLat!, clientLng!, t)}
        >
          <FontAwesome name="location-arrow" size={15} color="#fff" />
          <Text style={styles.mapsBtnText}>{t('orders.openMap')}</Text>
        </Pressable>
      )}
      {clientId && (
        <Pressable
          style={({ pressed }) => [
            styles.medCardBtn,
            pressed && styles.mapsBtnPressed,
            medCardLoading && styles.actionBtnDisabled,
          ]}
          onPress={onViewMedCard}
          disabled={medCardLoading}
        >
          {medCardLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="heartbeat" size={15} color="#fff" />
          )}
          <Text style={styles.mapsBtnText}>{t('medcard.clientCard')}</Text>
        </Pressable>
      )}
    </View>
  );
}

export const ClientInfo = React.memo(ClientInfoInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: Spacing.md,
    gap: 0,
  },
  cardTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  locationText: { fontSize: Typography.body.fontSize, color: Theme.text, flex: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.success,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  callBtnText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: '#fff' },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  mapsBtnPressed: { opacity: 0.9 },
  mapsBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fff' },
  medCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#7c3aed',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionBtnDisabled: { opacity: 0.7 },
});

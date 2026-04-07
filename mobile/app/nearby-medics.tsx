import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const MapComponents =
  Platform.OS === 'web' ? null : require('react-native-maps');

interface NearbyMedic {
  id: string;
  name: string | null;
  rating: number | null;
  reviewCount: number;
  experienceYears: number | null;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function NearbyMedicsScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const mapRef = useRef<any>(null);

  const [medics, setMedics] = useState<NearbyMedic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedMedic, setSelectedMedic] = useState<NearbyMedic | null>(null);

  const loadLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError(t('nearby.locationDenied', 'Разрешите доступ к геолокации'));
      setLoading(false);
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setUserLocation(coords);
    return coords;
  }, [t]);

  const loadMedics = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<NearbyMedic[]>(
          `/medics/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&limit=20`,
          { token: token ?? undefined },
        );
        setMedics(data);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : t('nearby.error', 'Ошибка загрузки'),
        );
      } finally {
        setLoading(false);
      }
    },
    [token, t],
  );

  useEffect(() => {
    (async () => {
      const coords = await loadLocation();
      if (coords) await loadMedics(coords);
    })();
  }, [loadLocation, loadMedics]);

  const handleRefresh = async () => {
    const coords = userLocation ?? (await loadLocation());
    if (coords) await loadMedics(coords);
  };

  if (Platform.OS === 'web' || !MapComponents) {
    return (
      <View style={styles.center}>
        <Text>{t('nearby.webNotSupported', 'Карта доступна только в мобильном приложении')}</Text>
      </View>
    );
  }

  const { default: MapView, Marker, Callout, PROVIDER_GOOGLE } = MapComponents;

  const initialRegion = userLocation
    ? {
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 41.311081,
        longitude: 69.240562,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('nearby.title', 'Медики рядом'),
          headerStyle: { backgroundColor: Theme.primary },
          headerTintColor: Theme.textInverse,
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {medics.map((medic) => (
            <Marker
              key={medic.id}
              coordinate={{
                latitude: medic.latitude,
                longitude: medic.longitude,
              }}
              pinColor={Theme.primary}
              onPress={() => setSelectedMedic(medic)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>
                    {medic.name ?? t('nearby.noName', 'Медик')}
                  </Text>
                  {medic.rating != null && (
                    <View style={styles.ratingRow}>
                      <FontAwesome name="star" size={12} color={Theme.warning} />
                      <Text style={styles.ratingText}>
                        {Number(medic.rating).toFixed(1)} ({medic.reviewCount})
                      </Text>
                    </View>
                  )}
                  {medic.distance != null && (
                    <Text style={styles.distanceText}>
                      {medic.distance < 1
                        ? `${Math.round(medic.distance * 1000)} м`
                        : `${medic.distance.toFixed(1)} км`}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Bottom card */}
        {selectedMedic && (
          <View style={styles.bottomCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <FontAwesome name="user-md" size={24} color={Theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medicName}>
                  {selectedMedic.name ?? t('nearby.noName', 'Медик')}
                </Text>
                <View style={styles.ratingRow}>
                  {selectedMedic.rating != null && (
                    <>
                      <FontAwesome name="star" size={14} color={Theme.warning} />
                      <Text style={styles.ratingTextLg}>
                        {Number(selectedMedic.rating).toFixed(1)} ({selectedMedic.reviewCount}{' '}
                        {t('nearby.reviews', 'отзывов')})
                      </Text>
                    </>
                  )}
                  {selectedMedic.experienceYears != null && (
                    <Text style={styles.expText}>
                      {selectedMedic.experienceYears}{' '}
                      {t('nearby.yearsExp', 'лет опыта')}
                    </Text>
                  )}
                </View>
                {selectedMedic.distance != null && (
                  <Text style={styles.distanceTextLg}>
                    <FontAwesome name="map-marker" size={12} color={Theme.textSecondary} />{' '}
                    {selectedMedic.distance < 1
                      ? `${Math.round(selectedMedic.distance * 1000)} м от вас`
                      : `${selectedMedic.distance.toFixed(1)} км от вас`}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setSelectedMedic(null)}
                hitSlop={12}
              >
                <FontAwesome name="times" size={20} color={Theme.textTertiary} />
              </Pressable>
            </View>
            <Pressable
              style={styles.orderBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.orderBtnText}>
                {t('nearby.orderService', 'Выбрать услугу')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Refresh button */}
        <Pressable style={styles.refreshBtn} onPress={handleRefresh}>
          <FontAwesome name="refresh" size={18} color={Theme.primary} />
        </Pressable>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Theme.primary} />
            <Text style={styles.loadingText}>
              {t('nearby.searching', 'Ищем медиков рядом...')}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={handleRefresh}>
              <Text style={styles.retryText}>
                {t('nearby.retry', 'Повторить')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && medics.length === 0 && (
          <View style={styles.emptyBanner}>
            <Text style={styles.emptyText}>
              {t('nearby.noMedics', 'Медиков поблизости не найдено')}
            </Text>
          </View>
        )}

        {/* Count badge */}
        {!loading && medics.length > 0 && (
          <View style={styles.countBadge}>
            <FontAwesome name="user-md" size={14} color={Theme.textInverse} />
            <Text style={styles.countText}>{medics.length}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },

  callout: {
    backgroundColor: Theme.surface,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutName: { fontSize: 14, fontWeight: '600', color: Theme.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: Theme.textSecondary },
  distanceText: { fontSize: 11, color: Theme.textTertiary, marginTop: 2 },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicName: { fontSize: 16, fontWeight: '700', color: Theme.text },
  ratingTextLg: { fontSize: 13, color: Theme.textSecondary },
  expText: { fontSize: 12, color: Theme.textTertiary, marginLeft: 8 },
  distanceTextLg: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },

  orderBtn: {
    marginTop: Spacing.md,
    backgroundColor: Theme.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderBtnText: { color: Theme.textInverse, fontSize: 16, fontWeight: '600' },

  refreshBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: { marginTop: Spacing.sm, color: Theme.textSecondary, fontSize: 14 },

  errorBanner: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: 60,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: Theme.error, fontSize: 13, flex: 1 },
  retryText: { color: Theme.primary, fontWeight: '600', fontSize: 13, marginLeft: 8 },

  emptyBanner: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  emptyText: { color: Theme.textSecondary, fontSize: 14 },

  countBadge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: { color: Theme.textInverse, fontSize: 14, fontWeight: '600' },
});

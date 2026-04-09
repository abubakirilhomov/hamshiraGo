import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMedics = searchQuery
    ? medics.filter((m) =>
        (m.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : medics;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-o'}
          size={14}
          color={Theme.warning}
        />,
      );
    }
    return stars;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Search bar overlay */}
        <View style={styles.searchRow}>
          <View style={styles.searchPill}>
            <FontAwesome name="search" size={16} color={Theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('nearby.search', 'Hamshira qidirish...')}
              placeholderTextColor={Theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.filterBtn} hitSlop={8}>
            <FontAwesome name="sliders" size={18} color={Theme.text} />
          </Pressable>
        </View>

        {/* Count badge */}
        {!loading && filteredMedics.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {filteredMedics.length} ta hamshira
            </Text>
          </View>
        )}

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {filteredMedics.map((medic) => (
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
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Refresh button */}
        <Pressable
          style={[styles.refreshBtn, Shadow.md]}
          onPress={handleRefresh}
        >
          <FontAwesome name="refresh" size={18} color={Theme.primary} />
        </Pressable>

        {/* Selected medic bottom card */}
        {selectedMedic && (
          <View style={[styles.bottomCard, Shadow.lg]}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <FontAwesome name="user-md" size={26} color={Theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medicName}>
                  {selectedMedic.name ?? t('nearby.noName', 'Медик')}
                </Text>
                <View style={styles.starsRow}>
                  {selectedMedic.rating != null && renderStars(Number(selectedMedic.rating))}
                </View>
              </View>
              <Pressable onPress={() => setSelectedMedic(null)} hitSlop={12}>
                <FontAwesome name="times" size={18} color={Theme.textTertiary} />
              </Pressable>
            </View>
            <View style={styles.infoRow}>
              {selectedMedic.distance != null && (
                <View style={styles.infoItem}>
                  <FontAwesome name="map-marker" size={14} color={Theme.textSecondary} />
                  <Text style={styles.infoText}>
                    {selectedMedic.distance < 1
                      ? `${Math.round(selectedMedic.distance * 1000)} m`
                      : `${selectedMedic.distance.toFixed(1)} km`}
                  </Text>
                </View>
              )}
              {selectedMedic.experienceYears != null && (
                <View style={styles.infoItem}>
                  <FontAwesome name="briefcase" size={13} color={Theme.textSecondary} />
                  <Text style={styles.infoText}>
                    {selectedMedic.experienceYears} yillik tajriba
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
              onPress={() => router.push('/(tabs)')}
            >
              <LinearGradient
                colors={Theme.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaBtnText}>
                  Xizmat tanlash
                </Text>
                <FontAwesome name="arrow-right" size={14} color={Theme.textInverse} />
              </LinearGradient>
            </Pressable>
          </View>
        )}

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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },

  searchRow: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },

  countBadge: {
    position: 'absolute',
    top: 116,
    left: Spacing.lg,
    zIndex: 10,
    backgroundColor: Theme.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  countText: {
    fontFamily: Fonts.interMd,
    fontSize: 12,
    color: Theme.textInverse,
  },

  callout: {
    backgroundColor: Theme.surface,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 120,
    ...Shadow.sm,
  },
  calloutName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: Theme.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textSecondary,
  },

  refreshBtn: {
    position: 'absolute',
    top: 60,
    right: 72,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.text,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  ctaBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 16,
    color: Theme.textInverse,
  },

  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  loadingText: {
    fontFamily: Fonts.inter,
    marginTop: Spacing.sm,
    color: Theme.textSecondary,
    fontSize: 14,
  },

  errorBanner: {
    position: 'absolute',
    top: 116,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  errorText: {
    fontFamily: Fonts.inter,
    color: Theme.error,
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    fontFamily: Fonts.interSb,
    color: Theme.primary,
    fontSize: 13,
    marginLeft: 8,
  },

  emptyBanner: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  emptyText: {
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    fontSize: 14,
  },
});

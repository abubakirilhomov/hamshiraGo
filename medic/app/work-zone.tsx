import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');

const DEFAULT_RADIUS = 5; // km
const MIN_RADIUS = 0.5;
const MAX_RADIUS = 50;
const RADIUS_STEP = 0.5;

// Tashkent center as fallback
const FALLBACK_LAT = 41.2995;
const FALLBACK_LNG = 69.2401;

export default function WorkZoneScreen() {
  const { t } = useTranslation();
  const { medic, token, refreshProfile } = useAuth();
  const router = useRouter();
  const mapRef = useRef<any>(null);

  const hasExistingZone =
    medic?.workZoneLat != null &&
    medic?.workZoneLng != null &&
    medic?.workZoneRadius != null;

  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(
    hasExistingZone
      ? { latitude: medic!.workZoneLat!, longitude: medic!.workZoneLng! }
      : null,
  );
  const [radius, setRadius] = useState(
    hasExistingZone ? medic!.workZoneRadius! : DEFAULT_RADIUS,
  );
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(!hasExistingZone);

  // Get current location if no existing zone
  useEffect(() => {
    if (hasExistingZone) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCenter({ latitude: FALLBACK_LAT, longitude: FALLBACK_LNG });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCenter({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        setCenter({ latitude: FALLBACK_LAT, longitude: FALLBACK_LNG });
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit map to circle when center or radius changes
  const fitMapToCircle = useCallback(() => {
    if (!mapRef.current || !center) return;
    // Calculate approximate delta from radius in km
    const latDelta = (radius / 111) * 2.5;
    const lngDelta = (radius / (111 * Math.cos((center.latitude * Math.PI) / 180))) * 2.5;
    mapRef.current.animateToRegion(
      {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      },
      400,
    );
  }, [center, radius]);

  useEffect(() => {
    fitMapToCircle();
  }, [fitMapToCircle]);

  const handleMapPress = useCallback((e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCenter({ latitude, longitude });
  }, []);

  const handleSave = async () => {
    if (!center) {
      Alert.alert(t('common.error'), t('geofence.tapToSetCenter'));
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/medics/work-zone', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          lat: center.latitude,
          lng: center.longitude,
          radius,
        }),
      });
      await refreshProfile();
      Alert.alert(t('geofence.saved'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await apiFetch('/medics/work-zone', {
        method: 'DELETE',
        token: token ?? undefined,
      });
      await refreshProfile();
      Alert.alert(t('geofence.cleared'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setClearing(false);
    }
  };

  const initialRegion = center
    ? {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : {
        latitude: FALLBACK_LAT,
        longitude: FALLBACK_LNG,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  if (loadingLocation || !center) {
    return (
      <>
        <Stack.Screen options={{ title: t('geofence.workZone') }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('geofence.workZone'),
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={styles.container}>
        {/* Map */}
        {MapsModule ? (
          <View style={styles.mapWrap}>
            <MapsModule.default
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              onPress={handleMapPress}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {/* Center marker */}
              <MapsModule.Marker
                coordinate={center}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.markerDot}>
                  <FontAwesome name="crosshairs" size={18} color="#fff" />
                </View>
              </MapsModule.Marker>

              {/* Circle overlay */}
              <MapsModule.Circle
                center={center}
                radius={radius * 1000}
                fillColor="rgba(34, 197, 94, 0.15)"
                strokeColor="rgba(34, 197, 94, 0.6)"
                strokeWidth={2}
              />
            </MapsModule.default>
          </View>
        ) : (
          <View style={[styles.mapWrap, styles.centered]}>
            <Text style={styles.hintText}>{t('geofence.tapToSetCenter')}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* Hint */}
          <View style={styles.hintRow}>
            <FontAwesome name="map-marker" size={16} color={Theme.primary} />
            <Text style={styles.hintText}>{t('geofence.tapToSetCenter')}</Text>
          </View>

          {/* Status indicator */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: hasExistingZone ? Theme.success : Theme.textSecondary },
              ]}
            />
            <Text style={styles.statusText}>
              {hasExistingZone ? t('geofence.zoneActive') : t('geofence.noZone')}
            </Text>
          </View>

          {/* Radius slider */}
          <View style={styles.sliderSection}>
            <Text style={styles.radiusLabel}>
              {t('geofence.radius')}: {radius.toFixed(1)} {t('geofence.km')}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={MIN_RADIUS}
              maximumValue={MAX_RADIUS}
              step={RADIUS_STEP}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={Theme.primary}
              maximumTrackTintColor={Theme.border}
              thumbTintColor={Theme.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinMax}>
                {MIN_RADIUS} {t('geofence.km')}
              </Text>
              <Text style={styles.sliderMinMax}>
                {MAX_RADIUS} {t('geofence.km')}
              </Text>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.btnPressed,
              saving && styles.btnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || clearing}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('geofence.saveZone')}</Text>
            )}
          </Pressable>

          {/* Clear button — only if zone exists */}
          {hasExistingZone && (
            <Pressable
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && styles.btnPressed,
                clearing && styles.btnDisabled,
              ]}
              onPress={handleClear}
              disabled={saving || clearing}
            >
              {clearing ? (
                <ActivityIndicator color={Theme.textSecondary} />
              ) : (
                <Text style={styles.clearBtnText}>{t('geofence.clearZone')}</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  mapWrap: {
    height: 320,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  map: { width: '100%', height: '100%' },
  markerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controls: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: Theme.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, color: Theme.text, fontWeight: '600' },
  sliderSection: {
    gap: 4,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    fontSize: 12,
    color: Theme.textSecondary,
  },
  saveBtn: {
    backgroundColor: Theme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
});

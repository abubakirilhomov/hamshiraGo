import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

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
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      showToast(t('geofence.tapToSetCenter'), 'warning');
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
      showToast(t('geofence.saved'), 'success');
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      showToast(msg, 'error');
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
      showToast(t('geofence.cleared'), 'success');
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error');
      showToast(msg, 'error');
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Ish zonasi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Map ──────────────────────────────────────────────────── */}
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
                <FontAwesome name="crosshairs" size={18} color={Theme.textInverse} />
              </View>
            </MapsModule.Marker>

            {/* Circle overlay */}
            <MapsModule.Circle
              center={center}
              radius={radius * 1000}
              fillColor="rgba(0, 104, 96, 0.12)"
              strokeColor="rgba(0, 104, 96, 0.5)"
              strokeWidth={2}
            />
          </MapsModule.default>
        </View>
      ) : (
        <View style={[styles.mapWrap, styles.centered]}>
          <Text style={styles.hintText}>{t('geofence.tapToSetCenter')}</Text>
        </View>
      )}

      {/* ── Controls ─────────────────────────────────────────────── */}
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
              { backgroundColor: hasExistingZone ? Theme.success : Theme.textTertiary },
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
            maximumTrackTintColor={Theme.surfaceContainerHigh}
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
          style={({ pressed }) => [pressed && { opacity: 0.9 }, (saving || clearing) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || clearing}
        >
          <LinearGradient
            colors={Theme.primaryGradient as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator color={Theme.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Saqlash</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Clear button -- only if zone exists */}
        {hasExistingZone && (
          <Pressable
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && { opacity: 0.85 },
              clearing && { opacity: 0.6 },
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },

  /* ── Header ──────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...Typography.h3,
    color: Theme.text,
  },

  /* ── Map ──────────────────────────────────────────────────────── */
  mapWrap: {
    height: 320,
  },
  map: { width: '100%', height: '100%' },
  markerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.textInverse,
    ...Shadow.md,
  },

  /* ── Controls ────────────────────────────────────────────────── */
  controls: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hintText: {
    ...Typography.bodySmall,
    color: Theme.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: {
    ...Typography.bodySmall,
    fontFamily: Fonts.interSb,
    color: Theme.text,
  },
  sliderSection: {
    gap: Spacing.xs,
  },
  radiusLabel: {
    ...Typography.h4,
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
    ...Typography.caption,
    color: Theme.textTertiary,
  },

  /* ── Buttons ─────────────────────────────────────────────────── */
  saveBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...Typography.button,
    color: Theme.textInverse,
  },
  clearBtn: {
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.surfaceContainerLow,
  },
  clearBtnText: {
    ...Typography.body,
    fontFamily: Fonts.interSb,
    color: Theme.textSecondary,
  },
});

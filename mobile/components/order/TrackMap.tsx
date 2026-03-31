import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Shadow } from '@/constants/Theme';
import type { OrderStatus } from '@/types/order';
import type { MedicLocation, DispatchState } from '@/hooks/useOrderTracking';

// ─── Native map module ───────────────────────────────────────────────────────

const TrackMapComponent =
  Platform.OS === 'web' ? null : require('react-native-maps');

const AnimatedMedicMarker: React.ComponentType<any> | null = TrackMapComponent
  ? (TrackMapComponent.Marker.Animated ??
     Animated.createAnimatedComponent(TrackMapComponent.Marker as React.ComponentType<any>))
  : null;

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderLocation {
  house: string;
  floor?: string | null;
  apartment?: string | null;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface MedicInfo {
  profilePhotoUrl?: string | null;
}

interface TrackMapProps {
  orderStatus: OrderStatus;
  orderLocation: OrderLocation;
  medicLocation: MedicLocation | null;
  medicInfo: MedicInfo | null;
  routeCoords: Array<{ latitude: number; longitude: number }>;
  dispatchState: DispatchState;
  pulseAnim: Animated.Value;
  medicAnimCoord: any;
  medicAnimReady: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

function TrackMap({
  orderStatus,
  orderLocation,
  medicLocation,
  medicInfo,
  routeCoords,
  dispatchState,
  pulseAnim,
  medicAnimCoord,
  medicAnimReady,
}: TrackMapProps) {
  const { t } = useTranslation();

  if (
    orderLocation.latitude == null ||
    orderLocation.longitude == null ||
    !TrackMapComponent
  ) {
    return null;
  }

  const isCreated = orderStatus === 'CREATED';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {isCreated ? t('track.searchingMedic') : t('track.medicOnMap')}
      </Text>
      <View style={styles.mapWrap}>
        <TrackMapComponent.default
          style={styles.map}
          initialRegion={{
            latitude: medicLocation
              ? (Number(orderLocation.latitude) + medicLocation.latitude) / 2
              : Number(orderLocation.latitude),
            longitude: medicLocation
              ? (Number(orderLocation.longitude) + medicLocation.longitude) / 2
              : Number(orderLocation.longitude),
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
        >
          {/* Client marker */}
          <TrackMapComponent.Marker
            coordinate={{
              latitude: Number(orderLocation.latitude),
              longitude: Number(orderLocation.longitude),
            }}
            title={t('track.youAreHere')}
            description={t('track.callAddress')}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.clientMarkerWrap}>
              {isCreated && dispatchState && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.55, 0],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
              <View style={styles.clientMarkerDot}>
                <Text style={styles.markerEmoji}>🏠</Text>
              </View>
            </View>
          </TrackMapComponent.Marker>

          {/* Medic marker (animated) */}
          {medicLocation && medicAnimReady && medicAnimCoord && AnimatedMedicMarker && (
            <AnimatedMedicMarker
              coordinate={medicAnimCoord}
              title={
                isCreated && dispatchState?.candidateName
                  ? dispatchState.candidateName
                  : t('track.medic')
              }
              description={
                isCreated
                  ? t('track.waitingConfirmation')
                  : t('track.currentPosition')
              }
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.medicMarkerDot,
                  isCreated && { backgroundColor: Theme.warning },
                ]}
              >
                {medicInfo?.profilePhotoUrl ? (
                  <Image
                    source={{ uri: medicInfo.profilePhotoUrl }}
                    style={styles.medicMarkerImg}
                    placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text style={styles.markerEmoji}>🧑‍⚕️</Text>
                )}
              </View>
            </AnimatedMedicMarker>
          )}

          {/* Route polyline */}
          {medicLocation && (
            <TrackMapComponent.Polyline
              coordinates={
                routeCoords.length > 1
                  ? routeCoords
                  : [
                      {
                        latitude: Number(orderLocation.latitude),
                        longitude: Number(orderLocation.longitude),
                      },
                      {
                        latitude: medicLocation.latitude,
                        longitude: medicLocation.longitude,
                      },
                    ]
              }
              strokeColor={isCreated ? Theme.warning : Theme.success}
              strokeWidth={3}
              lineDashPattern={isCreated ? [6, 4] : undefined}
            />
          )}
        </TrackMapComponent.default>
      </View>

      {/* Legend */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.info }]} />
          <Text style={styles.legendText}>{t('track.you')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: isCreated ? Theme.warning : Theme.success },
            ]}
          />
          <Text style={styles.legendText}>
            {isCreated ? t('track.candidate') : t('track.medic')}
          </Text>
        </View>
        {medicLocation && (
          <Text style={styles.mapMeta}>
            {new Date(medicLocation.updatedAt).toLocaleTimeString('ru-RU')}
          </Text>
        )}
      </View>
    </View>
  );
}

export default React.memo(TrackMap);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapWrap: {
    height: 220,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  mapMeta: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginLeft: 'auto',
  },
  clientMarkerWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.info,
  },
  clientMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.info,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Shadow.md,
    shadowOpacity: 0.25,
  },
  medicMarkerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Shadow.md,
    shadowOpacity: 0.25,
  },
  markerEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  medicMarkerImg: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
  },
});

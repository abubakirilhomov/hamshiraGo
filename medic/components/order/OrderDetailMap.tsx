import React, { useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';

const MapsModule =
  Platform.OS === 'web' ? null : require('react-native-maps');

interface OrderDetailMapProps {
  clientLat: number;
  clientLng: number;
  medicPos: { latitude: number; longitude: number; heading: number | null } | null;
  routeCoords: Array<{ latitude: number; longitude: number }>;
  routeLoading: boolean;
  clientLabel: string;
  youLabel: string;
  waitingGpsLabel: string;
  buildingRouteLabel: string;
  routeTitle: string;
}

function OrderDetailMapInner({
  clientLat,
  clientLng,
  medicPos,
  routeCoords,
  routeLoading,
  clientLabel,
  youLabel,
  waitingGpsLabel,
  buildingRouteLabel,
  routeTitle,
}: OrderDetailMapProps) {
  const mapRef = useRef<any>(null);
  const hasFittedRef = useRef(false);

  const mapInitialRegion =
    medicPos
      ? {
          latitude: (medicPos.latitude + clientLat) / 2,
          longitude: (medicPos.longitude + clientLng) / 2,
          latitudeDelta: Math.max(
            Math.abs(medicPos.latitude - clientLat) * 2.5,
            0.01,
          ),
          longitudeDelta: Math.max(
            Math.abs(medicPos.longitude - clientLng) * 2.5,
            0.01,
          ),
        }
      : {
          latitude: clientLat,
          longitude: clientLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

  // Auto-fit map once on first GPS fix
  useEffect(() => {
    if (!mapRef.current || !medicPos) return;
    if (hasFittedRef.current) return;
    hasFittedRef.current = true;
    mapRef.current.fitToCoordinates(
      [
        { latitude: medicPos.latitude, longitude: medicPos.longitude },
        { latitude: clientLat, longitude: clientLng },
      ],
      { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
    );
  }, [medicPos, clientLat, clientLng]);

  if (!MapsModule) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{routeTitle}</Text>
      <View style={styles.mapWrap}>
        <MapsModule.default
          ref={mapRef}
          style={styles.map}
          initialRegion={mapInitialRegion}
          pitchEnabled={false}
          rotateEnabled={false}
          onMapReady={() => {
            if (medicPos) {
              mapRef.current?.fitToCoordinates(
                [
                  { latitude: medicPos.latitude, longitude: medicPos.longitude },
                  { latitude: clientLat, longitude: clientLng },
                ],
                {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: false,
                },
              );
            }
          }}
        >
          {/* Client marker */}
          <MapsModule.Marker
            coordinate={{ latitude: clientLat, longitude: clientLng }}
            title={clientLabel}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.clientDot}>
              <FontAwesome name="home" size={16} color="#fff" />
            </View>
          </MapsModule.Marker>

          {/* Medic marker */}
          {medicPos && (
            <MapsModule.Marker
              coordinate={medicPos}
              title={youLabel}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.medicDot}>
                <FontAwesome name="user-md" size={16} color="#fff" />
              </View>
            </MapsModule.Marker>
          )}

          {/* Route line */}
          {medicPos && (
            <MapsModule.Polyline
              coordinates={
                routeCoords.length > 1
                  ? routeCoords
                  : [
                      { latitude: medicPos.latitude, longitude: medicPos.longitude },
                      { latitude: clientLat, longitude: clientLng },
                    ]
              }
              strokeColor="#16a34a"
              strokeWidth={3.5}
            />
          )}
        </MapsModule.default>

        {routeLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator color={Theme.primary} />
            <Text style={styles.mapLoadingText}>{buildingRouteLabel}</Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendLabel}>{clientLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
          <Text style={styles.legendLabel}>{youLabel}</Text>
        </View>
        {!medicPos && (
          <Text style={styles.waitingGps}>{waitingGpsLabel}</Text>
        )}
      </View>
    </View>
  );
}

export const OrderDetailMap = React.memo(OrderDetailMapInner);

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
  mapWrap: { height: 240, borderRadius: Radius.sm, overflow: 'hidden', marginBottom: Spacing.sm },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapLoadingText: { fontSize: Typography.caption.fontSize, color: Theme.primary, fontWeight: '600' },
  map: { width: '100%', height: '100%' },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, fontWeight: '600' },
  waitingGps: { fontSize: Typography.caption.fontSize, color: Theme.textSecondary, marginLeft: Spacing.xs },
  clientDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
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
  medicDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16a34a',
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
});

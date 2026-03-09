/**
 * useMedicLocation — foreground location tracking for the medic.
 * Emits location to WebSocket (medic_location event) every LOCATION_EMIT_INTERVAL_MS
 * while the order status is ON_THE_WAY. Falls back to nothing if socket is disconnected.
 *
 * Returns: { startTracking, stopTracking }
 */

import { useCallback, useRef, type MutableRefObject } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Socket } from 'socket.io-client';
import { LOCATION_EMIT_INTERVAL_MS } from '@/constants/config';

interface UseMedicLocationOptions {
  orderId: string | undefined;
  socketRef: MutableRefObject<Socket | null>;
  onLocationUpdate?: (pos: { latitude: number; longitude: number }) => void;
  onLastSentAt?: (iso: string) => void;
  onSentCountIncrement?: () => void;
}

export function useMedicLocation({
  orderId,
  socketRef,
  onLocationUpdate,
  onLastSentAt,
  onSentCountIncrement,
}: UseMedicLocationOptions) {
  const trackingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationDeniedWarnedRef = useRef(false);

  const emitCurrentLocation = useCallback(async () => {
    if (!orderId || !socketRef.current || !socketRef.current.connected) return;

    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      if (!locationDeniedWarnedRef.current) {
        locationDeniedWarnedRef.current = true;
        Alert.alert(
          'Нет доступа к геолокации',
          'Разрешите геолокацию, чтобы клиент видел ваш путь.',
        );
      }
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    onLocationUpdate?.(pos);

    socketRef.current.emit('medic_location', {
      orderId,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    onLastSentAt?.(new Date().toISOString());
    onSentCountIncrement?.();
  }, [orderId, socketRef, onLocationUpdate, onLastSentAt, onSentCountIncrement]);

  const startTracking = useCallback(() => {
    if (trackingTimerRef.current) return; // already tracking

    emitCurrentLocation().catch(() => {});
    trackingTimerRef.current = setInterval(() => {
      emitCurrentLocation().catch(() => {});
    }, LOCATION_EMIT_INTERVAL_MS);
  }, [emitCurrentLocation]);

  const stopTracking = useCallback(() => {
    if (trackingTimerRef.current) {
      clearInterval(trackingTimerRef.current);
      trackingTimerRef.current = null;
    }
  }, []);

  return { startTracking, stopTracking };
}

/**
 * useMedicLocation — foreground location tracking for the medic.
 * Uses watchPositionAsync (OS-level geofencing) for battery efficiency.
 * Emits location to WebSocket (medic_location event) on movement or every 4s.
 * Falls back to nothing if socket is disconnected.
 *
 * Returns: { startTracking, stopTracking }
 */

import { useCallback, useRef, type MutableRefObject } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Socket } from 'socket.io-client';

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
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const locationDeniedWarnedRef = useRef(false);

  const startTracking = useCallback(() => {
    if (watchRef.current) return; // already tracking

    Location.getForegroundPermissionsAsync().then((perm) => {
      if (perm.status !== 'granted') {
        if (!locationDeniedWarnedRef.current) {
          locationDeniedWarnedRef.current = true;
          Alert.alert('Нет доступа к геолокации', 'Разрешите геолокацию, чтобы клиент видел ваш путь.');
        }
        return;
      }

      // Emit one position immediately
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((loc) => {
          if (!orderId || !socketRef.current?.connected) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          onLocationUpdate?.(pos);
          socketRef.current!.emit('medic_location', { orderId, ...pos });
          onLastSentAt?.(new Date().toISOString());
          onSentCountIncrement?.();
        })
        .catch(() => {});

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,      // min 4s between updates
          distanceInterval: 10,    // or 10m movement
        },
        (loc) => {
          if (!orderId || !socketRef.current?.connected) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          onLocationUpdate?.(pos);
          socketRef.current!.emit('medic_location', { orderId, ...pos });
          onLastSentAt?.(new Date().toISOString());
          onSentCountIncrement?.();
        },
      ).then((sub) => {
        watchRef.current = sub;
      }).catch(() => {});
    });
  }, [orderId, socketRef, onLocationUpdate, onLastSentAt, onSentCountIncrement]);

  const stopTracking = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  return { startTracking, stopTracking };
}

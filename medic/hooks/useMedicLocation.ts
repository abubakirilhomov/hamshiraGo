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
  const startingRef = useRef(false); // set BEFORE async work to prevent re-entry

  const startTracking = useCallback(() => {
    if (watchRef.current || startingRef.current) return; // guard against concurrent calls
    startingRef.current = true;

    Location.getForegroundPermissionsAsync().then((perm) => {
      // If stopTracking was called while we were waiting for permissions, abort
      if (!startingRef.current) return;

      if (perm.status !== 'granted') {
        startingRef.current = false;
        if (!locationDeniedWarnedRef.current) {
          locationDeniedWarnedRef.current = true;
          Alert.alert('Нет доступа к геолокации', 'Разрешите геолокацию, чтобы клиент видел ваш путь.');
        }
        return;
      }

      // Emit one position immediately
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((loc) => {
          if (!startingRef.current || !orderId || !socketRef.current?.connected) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          onLocationUpdate?.(pos);
          socketRef.current!.emit('medic_location', { orderId, ...pos });
          onLastSentAt?.(new Date().toISOString());
          onSentCountIncrement?.();
        })
        .catch(() => {});

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 8,
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
        if (!startingRef.current) {
          // stopTracking was called before subscription resolved — remove immediately
          sub.remove();
          return;
        }
        watchRef.current = sub;
      }).catch(() => { startingRef.current = false; });
    });
  }, [orderId, socketRef, onLocationUpdate, onLastSentAt, onSentCountIncrement]);

  const stopTracking = useCallback(() => {
    startingRef.current = false; // prevent pending async from completing
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  return { startTracking, stopTracking };
}

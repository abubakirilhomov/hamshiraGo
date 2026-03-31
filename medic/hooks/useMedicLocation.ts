/**
 * useMedicLocation — foreground location tracking for the medic.
 * Uses watchPositionAsync (OS-level geofencing) for battery efficiency.
 * Emits location to WebSocket (medic_location event) on movement or every 4s.
 * Falls back to nothing if socket is disconnected.
 *
 * Returns: { startTracking, stopTracking }
 */

import { useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import type { Socket } from 'socket.io-client';
import { LOCATION_EMIT_INTERVAL_MS } from '@/constants/config';
import { useToast } from '@/context/ToastContext';

interface UseMedicLocationOptions {
  orderId: string | undefined;
  socket: Socket | null;
  onLocationUpdate?: (pos: { latitude: number; longitude: number; heading: number | null }) => void;
  onLastSentAt?: (iso: string) => void;
  onSentCountIncrement?: () => void;
}

export function useMedicLocation({
  orderId,
  socket,
  onLocationUpdate,
  onLastSentAt,
  onSentCountIncrement,
}: UseMedicLocationOptions) {
  const { showToast } = useToast();
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const locationDeniedWarnedRef = useRef(false);
  const startingRef = useRef(false); // set BEFORE async work to prevent re-entry
  const lastEmitRef = useRef(0);    // JS-level throttle (Android ignores timeInterval)

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
          showToast('Нет доступа к геолокации. Разрешите геолокацию, чтобы клиент видел ваш путь.', 'warning', 5000);
        }
        return;
      }

      // Emit one position immediately
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((loc) => {
          if (!startingRef.current || !orderId || !socket?.connected) return;
          const pos = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading ?? null,
          };
          onLocationUpdate?.(pos);
          socket!.emit('medic_location', { orderId, ...pos });
          onLastSentAt?.(new Date().toISOString());
          onSentCountIncrement?.();
        })
        .catch(() => {});

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_EMIT_INTERVAL_MS,
          distanceInterval: 15, // минимум 15м между фиксами
        },
        (loc) => {
          if (!orderId || !socket?.connected) return;
          // JS-level throttle: Android игнорирует timeInterval и шлёт фиксы каждые мс
          const now = Date.now();
          const pos = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading ?? null,
          };
          onLocationUpdate?.(pos); // карта обновляется всегда (дёшево)
          if (now - lastEmitRef.current < LOCATION_EMIT_INTERVAL_MS) return;
          lastEmitRef.current = now;
          socket!.emit('medic_location', { orderId, ...pos });
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
        startingRef.current = false; // reset so stop+start can work correctly
      }).catch(() => { startingRef.current = false; });
    });
  }, [orderId, socket, onLocationUpdate, onLastSentAt, onSentCountIncrement, showToast]);

  const stopTracking = useCallback(() => {
    startingRef.current = false; // prevent pending async from completing
    lastEmitRef.current = 0;
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  return { startTracking, stopTracking };
}

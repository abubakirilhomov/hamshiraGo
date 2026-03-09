/**
 * useMedicRoute — fetches an OSRM driving route from medic position to client location.
 * Throttled to ROUTE_FETCH_THROTTLE_MS between requests. Aborts after FETCH_TIMEOUT_MS.
 *
 * Returns: { routeCoords, routeLoading, fetchRoute, resetRoute }
 */

import { useCallback, useRef, useState } from 'react';
import { OSRM_URL, ROUTE_FETCH_THROTTLE_MS, FETCH_TIMEOUT_MS } from '@/constants/config';
import type { OrderLocation } from '@/types/order';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface OsrmResponse {
  routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
}

export function useMedicRoute() {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const lastRouteFetchRef = useRef(0);

  const fetchRoute = useCallback(async (
    medicPos: LatLng | null,
    location: OrderLocation | null | undefined,
  ) => {
    if (!medicPos || !location) return;
    if (location.latitude == null || location.longitude == null) return;

    const now = Date.now();
    if (now - lastRouteFetchRef.current < ROUTE_FETCH_THROTTLE_MS) return;
    lastRouteFetchRef.current = now;

    setRouteLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const url =
        `${OSRM_URL}/${medicPos.longitude},${medicPos.latitude};` +
        `${Number(location.longitude)},${Number(location.latitude)}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return;

      const data = (await res.json()) as OsrmResponse;
      const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
      if (!coordinates.length) return;

      setRouteCoords(
        coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
    } catch {
      clearTimeout(timer);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const resetRoute = useCallback(() => {
    setRouteCoords([]);
    lastRouteFetchRef.current = 0;
  }, []);

  return { routeCoords, routeLoading, fetchRoute, resetRoute };
}

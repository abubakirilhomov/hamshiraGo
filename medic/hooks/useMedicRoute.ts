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
  heading?: number | null;
}

interface OsrmResponse {
  routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
}

export function useMedicRoute() {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const lastRouteFetchRef = useRef(0);
  const lastRoutePosRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const hasInitialRouteRef = useRef(false);
  const retryCountRef = useRef(0);

  const fetchRoute = useCallback(async (
    medicPos: LatLng | null,
    location: OrderLocation | null | undefined,
  ) => {
    if (!medicPos || !location) return;
    if (location.latitude == null || location.longitude == null) return;

    const now = Date.now();
    if (now - lastRouteFetchRef.current < ROUTE_FETCH_THROTTLE_MS) return;

    // Skip if medic hasn't moved 200m since last fetch (except first fetch)
    if (hasInitialRouteRef.current && lastRoutePosRef.current) {
      const dlat = medicPos.latitude - lastRoutePosRef.current.latitude;
      const dlng = medicPos.longitude - lastRoutePosRef.current.longitude;
      // Approximate: 1 degree lat ~ 111km, 1 degree lng ~ 111km * cos(lat)
      const latM = dlat * 111_000;
      const lngM = dlng * 111_000 * Math.cos((medicPos.latitude * Math.PI) / 180);
      const distM = Math.sqrt(latM * latM + lngM * lngM);
      if (distM < 200) return;
    }

    lastRouteFetchRef.current = now;

    if (!hasInitialRouteRef.current) setRouteLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const heading = medicPos.heading;
      const hasHeading = heading != null && Number.isFinite(heading);
      const bearingsParam = hasHeading
        ? `&bearings=${Math.round(heading!)},45;0,180`
        : '';
      const url =
        `${OSRM_URL}/${medicPos.longitude},${medicPos.latitude};` +
        `${Number(location.longitude)},${Number(location.latitude)}` +
        `?overview=full&geometries=geojson&radiuses=25;25${bearingsParam}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'HamshiraGo/1.0 (medical home visit app, uz)' },
      });
      clearTimeout(timer);
      if (!res.ok) {
        console.warn(`[OSRM] ${res.status} ${res.statusText} — retry in 3s`);
        lastRouteFetchRef.current = now - (ROUTE_FETCH_THROTTLE_MS - 3_000);
        return;
      }

      const data = (await res.json()) as OsrmResponse;
      const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
      if (!coordinates.length) return;

      setRouteCoords(
        coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
      hasInitialRouteRef.current = true;
      lastRoutePosRef.current = { latitude: medicPos.latitude, longitude: medicPos.longitude };
      retryCountRef.current = 0;
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      if (isTimeout) {
        retryCountRef.current = Math.min(retryCountRef.current + 1, 3);
        const backoff = 3_000 * retryCountRef.current;
        console.warn(`[OSRM] timeout — retry in ${backoff / 1000}s`);
        lastRouteFetchRef.current = now - (ROUTE_FETCH_THROTTLE_MS - backoff);
      } else {
        console.warn('[OSRM] fetch error:', err);
        lastRouteFetchRef.current = now - (ROUTE_FETCH_THROTTLE_MS - 3_000);
      }
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const resetRoute = useCallback(() => {
    setRouteCoords([]);
    lastRouteFetchRef.current = 0;
    lastRoutePosRef.current = null;
    hasInitialRouteRef.current = false;
    retryCountRef.current = 0;
  }, []);

  return { routeCoords, routeLoading, fetchRoute, resetRoute };
}

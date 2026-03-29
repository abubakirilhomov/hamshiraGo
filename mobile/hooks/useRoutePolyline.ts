import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types/order';
import type { MedicLocation } from '@/hooks/useOrderTracking';

// EXPO_PUBLIC_OSRM_URL = base URL only (e.g. https://osrm.railway.app)
const _osrmBase =
  process.env.EXPO_PUBLIC_OSRM_URL?.replace(/\/$/, '') || 'https://router.project-osrm.org';
const OSRM_ROUTE_URL = `${_osrmBase}/route/v1/driving`;

type OrderLocation = {
  latitude?: number | null;
  longitude?: number | null;
} | null;

interface UseRoutePolylineResult {
  routeCoords: Array<{ latitude: number; longitude: number }>;
  fetchRoute: () => Promise<void>;
  resetRoute: () => void;
}

export function useRoutePolyline(
  medicLocation: MedicLocation | null,
  orderLocation: OrderLocation,
  orderStatus: OrderStatus | undefined,
): UseRoutePolylineResult {
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const lastRouteFetchAtRef = useRef(0);
  const medicLocationRef = useRef(medicLocation);
  const orderLocationRef = useRef(orderLocation);
  medicLocationRef.current = medicLocation;
  orderLocationRef.current = orderLocation;

  const fetchRoute = useCallback(async () => {
    const medLoc = medicLocationRef.current;
    const ordLoc = orderLocationRef.current;
    if (!ordLoc || !medLoc) return;
    if (ordLoc.latitude == null || ordLoc.longitude == null) return;
    // Only fetch road route when medic is actively on the way (not during dispatch search)
    if (orderStatus === 'CREATED') return;

    const now = Date.now();
    if (now - lastRouteFetchAtRef.current < 12_000) return;
    lastRouteFetchAtRef.current = now;

    const fromLng = medLoc.longitude;
    const fromLat = medLoc.latitude;
    const toLng = Number(ordLoc.longitude);
    const toLat = Number(ordLoc.latitude);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${OSRM_ROUTE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'HamshiraGo/1.0 (medical home visit app, uz)' },
      });
      clearTimeout(timer);
      if (!res.ok) {
        console.warn(`[OSRM] ${res.status} ${res.statusText} — retry in 3s`);
        lastRouteFetchAtRef.current = now - 9_000; // allow retry in 3s
        return;
      }
      const data = await res.json() as {
        routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
      };
      const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
      if (!coordinates.length) return;
      setRouteCoords(
        coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
    } catch (err) {
      clearTimeout(timer);
      console.warn('[OSRM] fetch error:', err);
      lastRouteFetchAtRef.current = now - 9_000; // allow retry in 3s
    }
  }, [orderStatus]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Re-fetch when medic location changes (fetchRoute reads from ref, so we just call it)
  useEffect(() => {
    if (medicLocation) fetchRoute();
  }, [medicLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetRoute = useCallback(() => {
    setRouteCoords([]);
    lastRouteFetchAtRef.current = 0;
  }, []);

  return { routeCoords, fetchRoute, resetRoute };
}

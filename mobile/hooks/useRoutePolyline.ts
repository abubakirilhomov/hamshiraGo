import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types/order';
import type { MedicLocation } from '@/hooks/useOrderTracking';

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

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

  const fetchRoute = useCallback(async () => {
    if (!orderLocation || !medicLocation) return;
    if (orderLocation.latitude == null || orderLocation.longitude == null) return;
    // Only fetch road route when medic is actively on the way (not during dispatch search)
    if (orderStatus === 'CREATED') return;

    const now = Date.now();
    if (now - lastRouteFetchAtRef.current < 12_000) return;
    lastRouteFetchAtRef.current = now;

    const fromLng = medicLocation.longitude;
    const fromLat = medicLocation.latitude;
    const toLng = Number(orderLocation.longitude);
    const toLat = Number(orderLocation.latitude);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${OSRM_ROUTE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = await res.json() as {
        routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
      };
      const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
      if (!coordinates.length) return;
      setRouteCoords(
        coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      );
    } catch {
      clearTimeout(timer);
      // Keep previous route on network/API errors
    }
  }, [medicLocation, orderLocation, orderStatus]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const resetRoute = useCallback(() => {
    setRouteCoords([]);
    lastRouteFetchAtRef.current = 0;
  }, []);

  return { routeCoords, fetchRoute, resetRoute };
}

"use client";

import { useEffect, useRef } from "react";

interface TrackingMapProps {
  clientLat: number;
  clientLng: number;
  medicLat: number;
  medicLng: number;
  medicName: string;
  medicPhotoUrl?: string | null;
}

export default function TrackingMap({
  clientLat,
  clientLng,
  medicLat,
  medicLng,
  medicName,
  medicPhotoUrl,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const medicMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  const lastRouteFetchRef = useRef(0);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Client marker
      const clientIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#0d9488;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });
      L.marker([clientLat, clientLng], { icon: clientIcon })
        .addTo(map)
        .bindPopup("Ваш адрес");

      // Medic marker — photo or first letter
      const medicInner = medicPhotoUrl
        ? `<img src="${medicPhotoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;" />`
        : `<span style="font-size:17px;font-weight:700;color:#0d9488;line-height:1;">${medicName.charAt(0).toUpperCase()}</span>`;
      const medicIcon = L.divIcon({
        html: `<div style="width:42px;height:42px;background:#fff;border:3px solid #0d9488;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(13,148,136,0.35);overflow:hidden;">${medicInner}</div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        className: "",
      });
      const medicMarker = L.marker([medicLat, medicLng], { icon: medicIcon })
        .addTo(map)
        .bindPopup(medicName);
      medicMarkerRef.current = medicMarker;

      map.fitBounds([[clientLat, clientLng], [medicLat, medicLng]], { padding: [40, 40] });
      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        medicMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update medic marker + fetch OSRM route when medic moves
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import("leaflet").then(async (L) => {
      if (cancelled || !mapRef.current) return;

      // Move marker
      if (medicMarkerRef.current) {
        medicMarkerRef.current.setLatLng([medicLat, medicLng]);
      }

      // Fetch OSRM route (throttled to every 5 sec)
      const now = Date.now();
      if (now - lastRouteFetchRef.current < 5_000) return;
      lastRouteFetchRef.current = now;

      try {
        const osrmBase = (process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org/route/v1/driving").replace(/\/$/, "");
        const url = `${osrmBase}/${medicLng},${medicLat};${clientLng},${clientLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (cancelled || !res.ok) return;
        const data = await res.json() as { routes?: Array<{ geometry?: { coordinates?: [number, number][] } }> };
        const coords = data?.routes?.[0]?.geometry?.coordinates ?? [];
        if (!coords.length || cancelled || !mapRef.current) return;

        const latLngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

        if (routeLayerRef.current) {
          try { mapRef.current.removeLayer(routeLayerRef.current); } catch { /* ignore */ }
        }
        routeLayerRef.current = L.polyline(latLngs, {
          color: "#0d9488", weight: 4, opacity: 0.85,
        }).addTo(mapRef.current);
      } catch { /* OSRM unavailable — silently skip */ }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicLat, medicLng]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
    </>
  );
}

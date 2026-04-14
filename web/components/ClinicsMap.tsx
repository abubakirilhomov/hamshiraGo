"use client";

import { useEffect, useRef } from "react";

export interface ClinicMapMarker {
  id: string;
  name: string;
  address: string | null;
  phone: string;
  lat: number;
  lng: number;
}

interface ClinicsMapProps {
  clinics: ClinicMapMarker[];
  onSelectClinic?: (id: string) => void;
}

export default function ClinicsMap({ clinics, onSelectClinic }: ClinicsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      // Fix default icons in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center on Tashkent by default, or on first clinic
      const center: [number, number] = clinics.length > 0
        ? [clinics[0].lat, clinics[0].lng]
        : [41.2995, 69.2401];

      const map = L.map(containerRef.current!).setView(center, clinics.length > 1 ? 12 : 14);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Custom teal icon
      const clinicIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:34px;height:34px;border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,#0d9488,#0f766e);
          transform:rotate(-45deg);
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
        "><div style="transform:rotate(45deg);color:#fff;font-size:14px;">🏥</div></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      clinics.forEach((clinic) => {
        const yandexUrl = `https://yandex.uz/maps/?ll=${clinic.lng},${clinic.lat}&z=16&pt=${clinic.lng},${clinic.lat},pm2rdm`;
        const googleUrl = `https://www.google.com/maps?q=${clinic.lat},${clinic.lng}`;

        const popupHtml = `
          <div style="min-width:200px;font-family:system-ui,sans-serif;padding:4px 0;">
            <p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 4px;">${clinic.name}</p>
            ${clinic.address ? `<p style="font-size:12px;color:#64748b;margin:0 0 8px;">📍 ${clinic.address}</p>` : ""}
            ${clinic.phone ? `<a href="tel:${clinic.phone}" style="font-size:12px;color:#0d9488;font-weight:600;display:block;margin-bottom:10px;">📞 ${clinic.phone}</a>` : ""}
            <div style="display:flex;flex-direction:column;gap:6px;">
              <a href="${yandexUrl}" target="_blank" rel="noopener"
                style="display:block;text-align:center;padding:7px 12px;background:#fc3f1d;color:#fff;
                border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
                🗺 Яндекс Карты
              </a>
              <a href="${googleUrl}" target="_blank" rel="noopener"
                style="display:block;text-align:center;padding:7px 12px;background:#4285f4;color:#fff;
                border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
                🌐 Google Maps
              </a>
            </div>
          </div>
        `;

        const marker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 240 });

        marker.on("click", () => {
          onSelectClinic?.(clinic.id);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds if multiple clinics
      if (clinics.length > 1) {
        const group = L.featureGroup(markersRef.current as L.Layer[]);
        map.fitBounds(group.getBounds().pad(0.15));
      }
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "60vh", minHeight: 400, borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}
    />
  );
}

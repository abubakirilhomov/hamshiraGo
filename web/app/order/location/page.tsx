"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTelegramBackButton } from "@/hooks/useTelegram";
import { getTelegramWebApp, isInTelegram } from "@/lib/telegram";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    const { road, house_number, suburb, city } = data.address ?? {};
    const parts = [road, house_number, suburb, city].filter(Boolean);
    return parts.slice(0, 3).join(", ");
  } catch { return ""; }
}

interface GeocodeResult { lat: number; lng: number; address: string | null; }

async function forwardGeocode(query: string, signal: AbortSignal): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=ru&countrycodes=uz&addressdetails=1`,
      { signal }
    );
    const data = await res.json() as Array<{
      lat: string; lon: string;
      address?: { road?: string; house_number?: string; suburb?: string; quarter?: string; neighbourhood?: string; city?: string; town?: string; village?: string; };
    }>;
    if (!data.length) return null;
    const item = data[0];
    const a = item.address ?? {};
    const parts = [a.road, a.house_number, a.suburb ?? a.quarter ?? a.neighbourhood, a.city ?? a.town ?? a.village].filter(Boolean);
    const address = parts.length >= 2 ? parts.join(", ") : null;
    return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), address };
  } catch { return null; }
}

function LocationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const serviceId       = searchParams.get("service")   ?? "";
  const serviceTitle    = searchParams.get("title")     ?? t("confirm.service");
  const servicePrice    = searchParams.get("price")     ?? "0";
  const servicePriceMin = searchParams.get("priceMin")  ?? "";
  const servicePriceMax = searchParams.get("priceMax")  ?? "";
  useTelegramBackButton(() => router.back());

  const [address, setAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [phone, setPhone] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lat, setLat] = useState<number>(41.2995);
  const [lng, setLng] = useState<number>(69.2401);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const resolvedRef = useRef(false);
  const [error, setError] = useState("");
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const addressFromMapRef = useRef(false);

  const applyCoords = useCallback(async (latitude: number, longitude: number, accuracy?: number) => {
    resolvedRef.current = true;
    setLat(latitude); setLng(longitude);
    if (accuracy !== undefined) setGpsAccuracy(Math.round(accuracy));
    setGpsLoading(false);
    const detected = await reverseGeocode(latitude, longitude);
    if (detected) { addressFromMapRef.current = true; setAddress(detected); }
  }, []);

  const tryBrowserGeolocation = useCallback((outerTimeout?: ReturnType<typeof setTimeout>) => {
    if (!navigator.geolocation) {
      if (outerTimeout) clearTimeout(outerTimeout);
      setError(t("location.enterAddress")); resolvedRef.current = true; setGpsLoading(false); return;
    }
    const doRequest = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (outerTimeout) clearTimeout(outerTimeout); applyCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy); },
        (err) => {
          if (outerTimeout) clearTimeout(outerTimeout);
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            if (err.code === 1) setGpsBlocked(true);
            else setError(t("location.enterAddress"));
            setGpsLoading(false);
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    };
    if (typeof navigator.permissions?.query === "function") {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") { if (outerTimeout) clearTimeout(outerTimeout); resolvedRef.current = true; setGpsBlocked(true); setGpsLoading(false); }
        else doRequest();
      }).catch(() => doRequest());
    } else { doRequest(); }
  }, [applyCoords, t]);

  const getLocation = useCallback(() => {
    resolvedRef.current = false; setGpsLoading(true); setError(""); setGpsBlocked(false);
    const hardTimeout = setTimeout(() => {
      if (!resolvedRef.current) { resolvedRef.current = true; setGpsLoading(false); setError(t("location.enterAddress")); }
    }, 10000);
    const twa = getTelegramWebApp();
    if (isInTelegram() && twa?.LocationManager) {
      twa.LocationManager.init(() => {
        if (!twa.LocationManager.isLocationAvailable) { tryBrowserGeolocation(hardTimeout); return; }
        twa.LocationManager.getLocation((loc) => {
          clearTimeout(hardTimeout);
          if (loc) applyCoords(loc.latitude, loc.longitude);
          else tryBrowserGeolocation();
        });
      });
      return;
    }
    tryBrowserGeolocation(hardTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyCoords, t]);

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (addressFromMapRef.current) { addressFromMapRef.current = false; return; }
    const q = address.trim();
    if (q.length < 5) return;
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    geocodeTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      setGeocoding(true);
      const result = await forwardGeocode(q, controller.signal);
      setGeocoding(false);
      if (result) {
        addressFromMapRef.current = true;
        setLat(result.lat); setLng(result.lng);
        if (result.address) setAddress(result.address);
      }
    }, 3000);
    return () => { if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function handleMapMove(newLat: number, newLng: number) {
    setLat(newLat); setLng(newLng);
    const detected = await reverseGeocode(newLat, newLng);
    if (detected) { addressFromMapRef.current = true; setAddress(detected); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError(t("location.enterAddress")); return; }
    if (!phone.trim())   { setError(t("location.enterPhone")); return; }
    const queryParams = new URLSearchParams({ service: serviceId, title: serviceTitle, price: servicePrice, address, floor, apartment, phone, lat: String(lat ?? 41.2995), lng: String(lng ?? 69.2401) });
    if (servicePriceMin) queryParams.set("priceMin", servicePriceMin);
    if (servicePriceMax) queryParams.set("priceMax", servicePriceMax);
    router.push(`/order/confirm?${queryParams.toString()}`);
  }

  function inputStyle(name: string): React.CSSProperties {
    const focused = focusedField === name;
    return {
      background: focused ? "#fff" : "#f7f9fb", border: "none", outline: "none",
      borderRadius: 14, padding: "13px 16px", fontSize: 15, color: "#191c1e",
      width: "100%", transition: "all 150ms",
      boxShadow: focused ? "0 0 0 2px #00685f40" : "0 0 0 1.5px #eceef0",
    };
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.2px" }}>{t("location.title")}</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{serviceTitle}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 16px 100px" }}>

          {/* GPS banners */}
          {gpsLoading && (
            <div style={{ background: "rgba(0,104,95,0.08)", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#00685f" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #c2ebe3", borderTopColor: "#00685f", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
              {t("location.detectingLocation")}
            </div>
          )}
          {!gpsLoading && gpsAccuracy !== null && gpsAccuracy > 25 && (
            <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
              <span className="mat-icon" style={{ fontSize: 18, flexShrink: 0 }}>gps_not_fixed</span>
              {t("location.weakGPS", { m: gpsAccuracy })}
            </div>
          )}
          {!gpsLoading && gpsAccuracy !== null && gpsAccuracy <= 25 && (
            <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
              <span className="mat-icon" style={{ fontSize: 18, flexShrink: 0 }}>gps_fixed</span>
              {t("location.goodGPS", { m: gpsAccuracy })}
            </div>
          )}
          {gpsBlocked && (
            <div style={{ background: "#fff7ed", borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#ea580c", flexShrink: 0, marginTop: 1 }}>location_off</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#ea580c", marginBottom: 4 }}>{t("location.gpsBlockedTitle")}</p>
                <p style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.5 }}>{t("location.gpsBlockedHint")}</p>
              </div>
            </div>
          )}

          {/* Map */}
          <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: 260, background: "#eceef0", position: "relative" }}>
            <Map lat={lat} lng={lng} onMove={handleMapMove} medics={[]} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: "#bcc9c6", fontWeight: 500 }}>{t("location.mapHint")}</p>
            <button type="button" onClick={getLocation} disabled={gpsLoading}
              style={{ background: gpsLoading ? "#eceef0" : "#c2ebe3", color: gpsLoading ? "#bcc9c6" : "#00685f", border: "none", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: gpsLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 150ms" }}>
              <span className="mat-icon" style={{ fontSize: 14 }}>my_location</span>
              {gpsLoading ? t("location.searching") : t("location.myLocation")}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
            {/* Address card */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 16 }}>{t("confirm.address")}</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Street */}
                <div>
                  <label style={labelStyle}>{t("location.street")}</label>
                  <div style={{ position: "relative" }}>
                    <input value={address} onChange={(e) => setAddress(e.target.value)}
                      onFocus={() => setFocusedField("address")} onBlur={() => setFocusedField(null)}
                      placeholder={t("location.placeholder")} required
                      style={{ ...inputStyle("address"), paddingRight: geocoding ? 44 : 16 }} />
                    {geocoding && (
                      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #eceef0", borderTopColor: "#00685f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    )}
                  </div>
                </div>

                {/* Floor + Apartment */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{t("location.floor")}</label>
                    <input value={floor} onChange={(e) => setFloor(e.target.value)}
                      onFocus={() => setFocusedField("floor")} onBlur={() => setFocusedField(null)}
                      placeholder="3" style={inputStyle("floor")} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t("location.apt")}</label>
                    <input value={apartment} onChange={(e) => setApartment(e.target.value)}
                      onFocus={() => setFocusedField("apartment")} onBlur={() => setFocusedField(null)}
                      placeholder="12" style={inputStyle("apartment")} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>{t("location.phone")}</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                    placeholder="+998 90 123 45 67" required style={inputStyle("phone")} />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
                <span className="mat-icon" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
                {error}
              </div>
            )}

            <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", borderRadius: 16, padding: "16px 24px", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,104,95,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
              {t("location.confirm")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f9fb" }} />}>
      <LocationForm />
    </Suspense>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#6d7a77",
  marginBottom: 6, display: "block",
};

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTelegramBackButton } from "@/hooks/useTelegram";
import { getTelegramWebApp, isInTelegram } from "@/lib/telegram";
import dynamic from "next/dynamic";
import {
  FaChevronLeft,
  FaExclamationTriangle,
  FaCrosshairs,
  FaExclamationCircle,
} from "react-icons/fa";
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
  } catch {
    return "";
  }
}

function LocationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const serviceId    = searchParams.get("service") ?? "";
  const serviceTitle = searchParams.get("title")   ?? t("confirm.service");
  const servicePrice = searchParams.get("price")   ?? "0";
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

  const applyCoords = useCallback(async (latitude: number, longitude: number, accuracy?: number) => {
    resolvedRef.current = true;
    setLat(latitude);
    setLng(longitude);
    if (accuracy !== undefined) setGpsAccuracy(Math.round(accuracy));
    setGpsLoading(false);
    const detected = await reverseGeocode(latitude, longitude);
    if (detected) setAddress(detected);
  }, []);

  const getLocation = useCallback(() => {
    resolvedRef.current = false;
    setGpsLoading(true);
    setError("");

    const hardTimeout = setTimeout(() => {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        setGpsLoading(false);
        setError(t("location.enterAddress"));
      }
    }, 10000);

    const twa = getTelegramWebApp();
    if (isInTelegram() && twa?.LocationManager) {
      twa.LocationManager.init(() => {
        if (!twa.LocationManager.isLocationAvailable) {
          tryBrowserGeolocation(hardTimeout);
          return;
        }
        twa.LocationManager.getLocation((loc) => {
          clearTimeout(hardTimeout);
          if (loc) {
            applyCoords(loc.latitude, loc.longitude);
          } else {
            tryBrowserGeolocation();
          }
        });
      });
      return;
    }

    tryBrowserGeolocation(hardTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyCoords, t]);

  const tryBrowserGeolocation = useCallback((outerTimeout?: ReturnType<typeof setTimeout>) => {
    if (!navigator.geolocation) {
      if (outerTimeout) clearTimeout(outerTimeout);
      setError(t("location.enterAddress"));
      resolvedRef.current = true;
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (outerTimeout) clearTimeout(outerTimeout);
        applyCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {
        if (outerTimeout) clearTimeout(outerTimeout);
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          setError(t("location.enterAddress"));
          setGpsLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, [applyCoords, t]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  async function handleMapMove(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    const detected = await reverseGeocode(newLat, newLng);
    if (detected) setAddress(detected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError(t("location.enterAddress")); return; }
    if (!phone.trim())   { setError(t("location.enterPhone")); return; }

    const queryParams = new URLSearchParams({
      service: serviceId,
      title:   serviceTitle,
      price:   servicePrice,
      address,
      floor,
      apartment,
      phone,
      lat: String(lat ?? 41.2995),
      lng: String(lng ?? 69.2401),
    });
    router.push(`/order/confirm?${queryParams.toString()}`);
  }

  function fieldStyle(name: string): React.CSSProperties {
    const focused = focusedField === name;
    return {
      background: focused ? "#fff" : "#f8fafc",
      border: `1.5px solid ${focused ? "#0d9488" : "#e2e8f0"}`,
      borderRadius: 12,
      padding: "13px 14px",
      fontSize: 15,
      color: "#0f172a",
      width: "100%",
      outline: "none",
      transition: "all 150ms ease",
      boxShadow: focused ? "0 0 0 3px #0d948820" : "none",
    };
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
      <div style={{
        maxWidth: 860, margin: "0 auto",
        padding: "16px 24px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none", borderRadius: "50%",
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", flexShrink: 0,
          }}
        >
          <FaChevronLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{t("location.title")}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            {serviceTitle}
          </p>
        </div>
      </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 24px 100px" }}>

        {/* GPS status */}
        {gpsLoading && (
          <div style={{ ...bannerStyle, background: "#0d948814", color: "#0d9488" }}>
            <FaCrosshairs size={14} />
            {t("location.detectingLocation")}
          </div>
        )}
        {!gpsLoading && gpsAccuracy !== null && gpsAccuracy > 25 && (
          <div style={{ ...bannerStyle, background: "#ef444412", color: "#ef4444" }}>
            <FaExclamationTriangle size={14} style={{ flexShrink: 0 }} />
            {t("location.weakGPS", { m: gpsAccuracy })}
          </div>
        )}
        {!gpsLoading && gpsAccuracy !== null && gpsAccuracy <= 25 && (
          <div style={{ ...bannerStyle, background: "#22c55e20", color: "#16a34a" }}>
            <FaCrosshairs size={14} />
            {t("location.goodGPS", { m: gpsAccuracy })}
          </div>
        )}

        {/* Map */}
        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 0,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          height: 260,
          position: "relative",
          background: "#e2e8f0",
        }}>
          <Map lat={lat} lng={lng} onMove={handleMapMove} medics={[]} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, marginTop: 4 }}>
          <button
            type="button"
            onClick={getLocation}
            disabled={gpsLoading}
            style={{
              background: gpsLoading ? "#94a3b8" : "#0d9488",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: gpsLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "background 150ms ease",
            }}
          >
            <FaCrosshairs size={11} />
            {gpsLoading ? t("location.searching") : t("location.myLocation")}
          </button>
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 16 }}>
          {t("location.mapHint")}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Address */}
          <div style={cardStyle}>
            <h2 style={sectionTitle}>{t("confirm.address")}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>{t("location.street")}</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setFocusedField("address")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t("location.placeholder")}
                  required
                  style={fieldStyle("address")}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>{t("location.floor")}</label>
                  <input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    onFocus={() => setFocusedField("floor")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="3"
                    style={fieldStyle("floor")}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t("location.apt")}</label>
                  <input
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    onFocus={() => setFocusedField("apartment")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="12"
                    style={fieldStyle("apartment")}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t("location.phone")}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+998 90 123 45 67"
                  required
                  style={fieldStyle("phone")}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#ef444412", borderRadius: 10,
              padding: "12px 14px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
              color: "#ef4444", fontSize: 13, fontWeight: 500,
            }}>
              <FaExclamationCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" style={{
            width: "100%",
            background: "#0d9488", color: "#fff",
            fontSize: 17, fontWeight: 700,
            borderRadius: 12, padding: "16px 24px",
            border: "none", cursor: "pointer",
          }}>
            {t("location.confirm")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <LocationForm />
    </Suspense>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: "#475569",
  marginBottom: 6, display: "block",
};

const bannerStyle: React.CSSProperties = {
  borderRadius: 10, padding: "10px 14px",
  display: "flex", alignItems: "center", gap: 8,
  fontSize: 13, fontWeight: 600, marginBottom: 12,
};

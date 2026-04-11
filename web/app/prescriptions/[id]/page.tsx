"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMyPrescriptions, confirmPrescription, cancelPrescription, Prescription } from "@/lib/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [house, setHouse] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  const fetchPrescription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPrescriptions(1, 100);
      const found = res.data.find((p) => p.id === id);
      if (!found) {
        setError("Рецепт не найден");
      } else {
        setPrescription(found);
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored) as { phone?: string };
            if (u.phone) setPhone(u.phone);
          }
        } catch {}
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    fetchPrescription();
  }, [router, fetchPrescription]);

  function getGps() {
    if (!navigator.geolocation) { setGpsError("Геолокация не поддерживается"); return; }
    setGpsLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGpsLoading(false); },
      () => { setGpsError("Не удалось получить местоположение"); setGpsLoading(false); },
      { timeout: 10000 }
    );
  }

  async function handleConfirm() {
    if (!house.trim() || !phone.trim()) { setError("Укажите дом и телефон"); return; }
    if (lat === null || lng === null) { setError("Необходимо определить местоположение"); return; }
    setSubmitting(true); setError("");
    try {
      await confirmPrescription(id, {
        location: {
          latitude: lat, longitude: lng,
          house: house.trim(),
          ...(floor.trim() ? { floor: floor.trim() } : {}),
          ...(apartment.trim() ? { apartment: apartment.trim() } : {}),
          phone: phone.trim(),
        },
      });
      router.push("/prescriptions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка подтверждения");
      setSubmitting(false);
    }
    setConfirmModal(false);
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      await cancelPrescription(id);
      router.push("/prescriptions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка отмены");
      setCanceling(false);
    }
    setCancelModal(false);
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", border: "none", outline: "none", borderRadius: 12,
    padding: "12px 14px", fontSize: 14, color: "#191c1e",
    fontFamily: "inherit", boxSizing: "border-box",
    background: "#f7f9fb",
    boxShadow: focused === name ? "0 0 0 2px #00685f40" : "0 0 0 1.5px #eceef0",
    transition: "box-shadow 150ms",
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (error && !prescription) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!prescription) return null;

  const isExpired = new Date(prescription.expiresAt) < new Date();
  const canAct = prescription.status === "PENDING" && !isExpired;

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

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 32px", position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>medication</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Рецепт</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "-16px auto 0", padding: "0 16px 100px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Service card */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="mat-icon" style={{ fontSize: 26, color: "#fff", fontVariationSettings: "'FILL' 1" }}>medication</span>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{prescription.serviceTitle}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#00685f", marginTop: 2 }}>{prescription.servicePrice.toLocaleString("ru-RU")} сум</p>
              </div>
            </div>

            {prescription.doctorNotes && (
              <div style={{ background: "#f7f9fb", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Примечания врача</p>
                <p style={{ fontSize: 14, color: "#3d4947", lineHeight: 1.6 }}>{prescription.doctorNotes}</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#bcc9c6" }}>Выписан: {formatDate(prescription.createdAt)}</span>
              <span style={{ fontSize: 12, color: isExpired ? "#ef4444" : "#bcc9c6" }}>До: {formatDate(prescription.expiresAt)}</span>
            </div>
          </div>

          {canAct && (
            <>
              {/* GPS */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Местоположение</p>
                {lat !== null && lng !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "#f0fdf9", borderRadius: 10, padding: "8px 12px" }}>
                    <span className="mat-icon" style={{ fontSize: 16, color: "#00685f" }}>location_on</span>
                    <span style={{ fontSize: 13, color: "#00685f", fontWeight: 600 }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                  </div>
                )}
                <button onClick={getGps} disabled={gpsLoading} style={{
                  background: lat !== null ? "#f0fdf9" : "linear-gradient(135deg,#00685f,#008378)",
                  color: lat !== null ? "#00685f" : "#fff",
                  border: lat !== null ? "1.5px solid #c2ebe3" : "none",
                  borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>my_location</span>
                  {gpsLoading ? "Определяем..." : lat !== null ? "Обновить геолокацию" : "Определить геолокацию"}
                </button>
                {gpsError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{gpsError}</p>}
              </div>

              {/* Address form */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>Адрес доставки</p>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6d7a77", marginBottom: 6 }}>Дом / улица *</p>
                  <input value={house} onChange={(e) => setHouse(e.target.value)}
                    onFocus={() => setFocused("house")} onBlur={() => setFocused(null)}
                    placeholder="ул. Амира Темура, д. 12"
                    style={inputStyle("house")} />
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6d7a77", marginBottom: 6 }}>Этаж</p>
                    <input value={floor} onChange={(e) => setFloor(e.target.value)}
                      onFocus={() => setFocused("floor")} onBlur={() => setFocused(null)}
                      placeholder="3" style={inputStyle("floor")} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6d7a77", marginBottom: 6 }}>Квартира</p>
                    <input value={apartment} onChange={(e) => setApartment(e.target.value)}
                      onFocus={() => setFocused("apt")} onBlur={() => setFocused(null)}
                      placeholder="45" style={inputStyle("apt")} />
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6d7a77", marginBottom: 6 }}>Телефон *</p>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                    placeholder="+998901234567" type="tel"
                    style={inputStyle("phone")} />
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mat-icon" style={{ fontSize: 16, color: "#ef4444" }}>error</span>
                  <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{error}</p>
                </div>
              )}

              <button onClick={() => setConfirmModal(true)} disabled={submitting} style={{
                background: submitting ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)",
                color: submitting ? "#bcc9c6" : "#fff", border: "none", borderRadius: 16,
                padding: "16px", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: submitting ? "none" : "0 6px 18px rgba(0,104,95,0.25)",
              }}>
                <span className="mat-icon" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                {submitting ? "Оформляем заказ..." : "Подтвердить заказ"}
              </button>

              <button onClick={() => setCancelModal(true)} disabled={canceling} style={{
                background: "transparent", color: "#ef4444", border: "1.5px solid #ef4444",
                borderRadius: 16, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <span className="mat-icon" style={{ fontSize: 18 }}>cancel</span>
                Отменить рецепт
              </button>
            </>
          )}

          {!canAct && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <span className="mat-icon" style={{ fontSize: 44, color: "#bcc9c6", display: "block", marginBottom: 12 }}>
                {prescription.status === "CONFIRMED" ? "check_circle" : "cancel"}
              </span>
              <p style={{ fontSize: 15, color: "#6d7a77" }}>
                {isExpired && prescription.status === "PENDING" ? "Срок действия рецепта истёк" :
                 prescription.status === "CONFIRMED" ? "Заказ уже оформлен" :
                 prescription.status === "CANCELED" ? "Рецепт отменён" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 520 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>Подтвердить заказ?</p>
            <p style={{ fontSize: 14, color: "#6d7a77", marginBottom: 20, lineHeight: 1.5 }}>
              Будет создан заказ на услугу <strong>{prescription.serviceTitle}</strong> на сумму <strong>{prescription.servicePrice.toLocaleString("ru-RU")} сум</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(false)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Отмена</button>
              <button onClick={handleConfirm} disabled={submitting} style={{ flex: 1, background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 520 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>Отменить рецепт?</p>
            <p style={{ fontSize: 14, color: "#6d7a77", marginBottom: 20 }}>Это действие нельзя отменить.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Назад</button>
              <button onClick={handleCancel} disabled={canceling} style={{ flex: 1, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Отменить</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

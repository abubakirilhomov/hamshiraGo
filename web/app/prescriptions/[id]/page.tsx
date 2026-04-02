"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaFileMedical } from "react-icons/fa";
import { getMyPrescriptions, confirmPrescription, cancelPrescription, Prescription } from "@/lib/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Address form
  const [house, setHouse] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [phone, setPhone] = useState("");

  // GPS
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
      // Fetch all and find by id (no single endpoint in mobile reference)
      const res = await getMyPrescriptions(1, 100);
      const found = res.data.find((p) => p.id === id);
      if (!found) {
        setError("Рецепт не найден");
      } else {
        setPrescription(found);
        // Pre-fill phone from localStorage if available
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
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsError("Не удалось получить местоположение");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleConfirm() {
    if (!house.trim() || !phone.trim()) { setError("Укажите дом и телефон"); return; }
    if (lat === null || lng === null) { setError("Необходимо определить местоположение"); return; }
    setSubmitting(true);
    setError("");
    try {
      await confirmPrescription(id, {
        location: {
          latitude: lat,
          longitude: lng,
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !prescription) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#dc2626" }}>{error}</p>
      </div>
    );
  }

  if (!prescription) return null;

  const isExpired = new Date(prescription.expiresAt) < new Date();
  const canAct = prescription.status === "PENDING" && !isExpired;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Рецепт</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Service card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FaFileMedical size={20} color="#0d9488" />
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{prescription.serviceTitle}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0d9488", marginTop: 2 }}>{prescription.servicePrice.toLocaleString("ru-RU")} сум</p>
            </div>
          </div>

          {prescription.doctorNotes && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Примечания врача</p>
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{prescription.doctorNotes}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Выписан: {formatDate(prescription.createdAt)}</span>
            <span style={{ fontSize: 12, color: isExpired ? "#dc2626" : "#94a3b8" }}>До: {formatDate(prescription.expiresAt)}</span>
          </div>
        </div>

        {canAct && (
          <>
            {/* GPS */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Местоположение</p>
              {lat !== null && lng !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <FaMapMarkerAlt size={14} color="#0d9488" />
                  <span style={{ fontSize: 13, color: "#0d9488", fontWeight: 600 }}>
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                </div>
              ) : null}
              <button
                onClick={getGps}
                disabled={gpsLoading}
                style={{ background: lat !== null ? "#f0fdf9" : "#0d9488", color: lat !== null ? "#0d9488" : "#fff", border: lat !== null ? "1px solid #99f6e4" : "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <FaMapMarkerAlt size={13} />
                {gpsLoading ? "Определяем..." : lat !== null ? "Обновить геолокацию" : "Определить геолокацию"}
              </button>
              {gpsError && <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{gpsError}</p>}
            </div>

            {/* Address form */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Адрес доставки</p>

              <div>
                <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Дом / улица *</p>
                <input
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  placeholder="ул. Амира Темура, д. 12"
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Этаж</p>
                  <input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="3"
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Квартира</p>
                  <input
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="45"
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Телефон *</p>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  type="tel"
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={() => setConfirmModal(true)}
              disabled={submitting}
              style={{ background: submitting ? "#94a3b8" : "#0d9488", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <FaCheckCircle size={16} />
              {submitting ? "Оформляем заказ..." : "Подтвердить заказ"}
            </button>

            <button
              onClick={() => setCancelModal(true)}
              disabled={canceling}
              style={{ background: "transparent", color: "#dc2626", border: "1.5px solid #dc2626", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <FaTimesCircle size={15} />
              Отменить рецепт
            </button>
          </>
        )}

        {!canAct && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 15, color: "#64748b" }}>
              {isExpired && prescription.status === "PENDING" ? "Срок действия рецепта истёк" :
               prescription.status === "CONFIRMED" ? "Заказ уже оформлен" :
               prescription.status === "CANCELED" ? "Рецепт отменён" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Confirm order modal */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", width: "100%", maxWidth: 400 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Подтвердить заказ?</p>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
              Будет создан заказ на услугу <strong>{prescription.serviceTitle}</strong> на сумму <strong>{prescription.servicePrice.toLocaleString("ru-RU")} сум</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(false)} style={{ flex: 1, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Отмена</button>
              <button onClick={handleConfirm} disabled={submitting} style={{ flex: 1, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", width: "100%", maxWidth: 400 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Отменить рецепт?</p>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Это действие нельзя отменить.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Назад</button>
              <button onClick={handleCancel} disabled={canceling} style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Отменить</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaStar, FaUserMd, FaCheckCircle, FaMoneyBillWave, FaInfoCircle } from "react-icons/fa";
import { getDoctorById, createConsultation, Doctor } from "@/lib/api";
import SlotPicker from "@/components/SlotPicker";

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId") ?? "";
  const symptoms = searchParams.get("symptoms") ?? "";
  const spec = searchParams.get("spec") ?? "";

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    if (!doctorId) return;
    try {
      setDoctor(await getDoctorById(doctorId));
    } catch {
      setError("Не удалось загрузить данные врача");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    if (!doctorId) { router.push("/doctors"); return; }
    fetchDoctor();
  }, [router, doctorId, fetchDoctor]);

  async function handleConfirm() {
    if (!doctorId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createConsultation(doctorId, symptoms || undefined, selectedSlotId || undefined);
      router.push("/consultations");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#dc2626" }}>{error || "Врач не найден"}</p>
      </div>
    );
  }

  const platformFee = Math.round(doctor.pricePerConsultation * 0.15);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Запись к врачу</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Doctor card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {doctor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doctor.photoUrl} alt={doctor.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaUserMd size={28} color="#94a3b8" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{doctor.name}</p>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>{doctor.specialization}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FaStar size={12} color="#f59e0b" />
                <span style={{ fontSize: 13, color: "#64748b" }}>{(doctor.rating ?? 0).toFixed(1)} ({doctor.consultationCount ?? 0})</span>
              </div>
            </div>
          </div>
          {doctor.bio && (
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", lineHeight: 1.5 }}>{doctor.bio}</p>
          )}
        </div>

        {/* Symptoms */}
        {symptoms && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Ваши симптомы</p>
            <p style={{ fontSize: 14, color: "#1e40af", lineHeight: 1.5 }}>{symptoms}</p>
          </div>
        )}

        {/* Price */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaMoneyBillWave size={15} color="#0d9488" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0d9488" }}>
              Стоимость: {doctor.pricePerConsultation.toLocaleString("ru-RU")} сум
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaInfoCircle size={14} color="#94a3b8" />
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Комиссия платформы: {platformFee.toLocaleString("ru-RU")} сум (15%)</span>
          </div>
        </div>

        {/* Slot picker */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <SlotPicker
            doctorId={doctorId}
            selectedSlotId={selectedSlotId}
            onSelect={setSelectedSlotId}
          />
          {selectedSlotId && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdfa", borderRadius: 8, fontSize: 13, color: "#0d9488", fontWeight: 600 }}>
              ✓ Слот выбран
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
          </div>
        )}

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          style={{ background: submitting ? "#94a3b8" : "#0d9488", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <FaCheckCircle size={16} />
          {submitting ? "Записываем..." : "Подтвердить запись"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ConsultationPage() {
  return <Suspense><ConsultationContent /></Suspense>;
}

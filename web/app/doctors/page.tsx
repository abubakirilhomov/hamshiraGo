"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FaArrowLeft, FaStar, FaUserMd } from "react-icons/fa";
import { getDoctors, Doctor } from "@/lib/api";

function DoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specParam = searchParams.get("spec") ?? "";
  const symptomsParam = searchParams.get("symptoms") ?? "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDoctors(specParam || undefined);
      setDoctors(data.filter((d) => d.isActive));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [specParam]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    fetchDoctors();
  }, [router, fetchDoctors]);

  function handleBook(doctor: Doctor) {
    const qs = new URLSearchParams({ doctorId: doctor.id });
    if (symptomsParam) qs.set("symptoms", symptomsParam);
    if (specParam) qs.set("spec", specParam);
    router.push(`/consultation?${qs.toString()}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Врачи</p>
            <div style={{ width: 36 }} />
          </div>
              <div style={{ marginTop: 14, position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или специализации..."
              style={{
                width: "100%", height: 44, borderRadius: 12,
                border: "none", padding: "0 16px 0 40px",
                fontSize: 14, outline: "none", boxSizing: "border-box",
                background: "rgba(255,255,255,0.15)",
                color: "#fff", fontFamily: "inherit",
              }}
            />
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
          </div>
          {specParam && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
              Специализация: {specParam}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 10 }}>{error}</p>
            <button onClick={fetchDoctors} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Повторить</button>
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaUserMd size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, color: "#94a3b8" }}>Врачи не найдены</p>
          </div>
        )}

        {!loading && doctors
          .filter((d) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return d.name.toLowerCase().includes(q) || (d.specialization ?? "").toLowerCase().includes(q);
          })
          .map((doctor) => (
          <div key={doctor.id} style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              {/* Photo */}
              {doctor.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doctor.photoUrl} alt={doctor.name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaUserMd size={24} color="#94a3b8" />
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{doctor.name}</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{doctor.specialization}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <FaStar size={12} color="#f59e0b" />
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    {(doctor.rating ?? 0).toFixed(1)} ({doctor.consultationCount ?? 0} консультаций)
                  </span>
                </div>
              </div>
            </div>

            {doctor.bio && (
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>{doctor.bio}</p>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f8fafc", paddingTop: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0d9488" }}>
                {doctor.pricePerConsultation.toLocaleString("ru-RU")} сум
              </p>
              <button
                onClick={() => handleBook(doctor)}
                style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Записаться
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense>
      <DoctorsContent />
    </Suspense>
  );
}

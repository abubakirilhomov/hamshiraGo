"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCalendarAlt, FaFileAlt, FaVideo } from "react-icons/fa";
import { getMyConsultations, Consultation } from "@/lib/api";

const STATUS_CONFIG: Record<Consultation["status"], { color: string; bg: string; label: string }> = {
  PENDING:   { color: "#d97706", bg: "#fef3c7", label: "Ожидает" },
  ACTIVE:    { color: "#2563eb", bg: "#dbeafe", label: "Активна" },
  COMPLETED: { color: "#16a34a", bg: "#dcfce7", label: "Завершена" },
  CANCELED:  { color: "#dc2626", bg: "#fee2e2", label: "Отменена" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function ConsultationsPage() {
  const router = useRouter();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notesModal, setNotesModal] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
  }, [router]);

  const fetchConsultations = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await getMyConsultations(p, 20);
      setConsultations((prev) => append ? [...prev, ...res.data] : res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchConsultations(1, false); }, [fetchConsultations]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.push("/profile")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Мои консультации</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 10 }}>

        {consultations.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaCalendarAlt size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 16 }}>Консультаций пока нет</p>
            <button onClick={() => router.push("/doctors")} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Найти врача
            </button>
          </div>
        )}

        {consultations.map((item) => {
          const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 14, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{item.doctor?.name ?? "—"}</p>
                  <p style={{ fontSize: 13, color: "#64748b" }}>{item.doctor?.specialization ?? ""}</p>
                </div>
                <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>{st.label}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(item.createdAt)}</span>
                {(item as any).price && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0d9488" }}>{(item as any).price.toLocaleString("ru-RU")} сум</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {(item.status === "PENDING" || item.status === "ACTIVE") && (
                  <button
                    onClick={() => router.push(`/video-call/${item.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    <FaVideo size={12} />
                    Видеозвонок
                  </button>
                )}
                {item.doctorNotes && (
                  <button
                    onClick={() => setNotesModal(item.doctorNotes!)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <FaFileAlt size={12} color="#64748b" />
                    <span style={{ fontSize: 12, color: "#64748b", textDecoration: "underline" }}>Заметки врача</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {page < totalPages && (
          <button
            onClick={() => fetchConsultations(page + 1, true)}
            disabled={loadingMore}
            style={{ background: "transparent", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "13px", fontSize: 14, color: "#0d9488", fontWeight: 600, cursor: "pointer" }}
          >
            {loadingMore ? "Загружаем..." : "Загрузить ещё"}
          </button>
        )}
      </div>

      {/* Doctor notes modal */}
      {notesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", width: "100%", maxWidth: 440 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Заметки врача</p>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, marginBottom: 20 }}>{notesModal}</p>
            <button onClick={() => setNotesModal(null)} style={{ width: "100%", background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

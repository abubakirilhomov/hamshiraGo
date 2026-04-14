"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, User, Phone, Calendar, Printer, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface ClinicPrescription {
  id: string;
  companyId: string;
  appointmentId: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientId: string | null;
  content: string;
  notes: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активный",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
  COMPLETED: { bg: "#dbeafe", text: "#1d4ed8" },
  CANCELLED: { bg: "#fee2e2", text: "#dc2626" },
};

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rx, setRx] = useState<ClinicPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.replace("/auth");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/patient/prescriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth");
          return;
        }
        if (res.status === 404) {
          if (!cancelled) { setError("Рецепт не найден"); setLoading(false); }
          return;
        }
        if (!res.ok) {
          if (!cancelled) { setError("Ошибка загрузки рецепта"); setLoading(false); }
          return;
        }
        const data: ClinicPrescription = await res.json();
        if (!cancelled) { setRx(data); setLoading(false); }
      } catch {
        if (!cancelled) { setError("Не удалось загрузить рецепт"); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, router]);

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)", padding: 20,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8", fontSize: 15 }}>Загрузка...</p>
      </div>
    );
  }

  if (error || !rx) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 16 }}>{error ?? "Рецепт не найден"}</p>
          <button
            onClick={() => router.back()}
            style={{ marginTop: 16, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#64748b", fontSize: 14 }}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_COLOR[rx.status] ?? { bg: "#f1f5f9", text: "#64748b" };
  const formattedDate = new Date(rx.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 40 }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
        <div style={{ maxWidth: 640, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 12px",
                cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 4, fontSize: 13,
              }}
            >
              <ArrowLeft size={14} /> Назад
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Рецепт</h1>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>№{rx.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={() => window.open(`/patient/prescriptions/${rx.id}/print`, "_blank")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #9333ea, #7c3aed)", color: "#fff",
              border: "none", borderRadius: 10, padding: "9px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Printer size={14} /> Распечатать / PDF
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Prescription header card */}
        <div style={{ ...card, background: "linear-gradient(135deg, #faf5ff, #f5f3ff)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(147,51,234,0.1)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={24} color="#9333ea" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#3b0764", margin: 0 }}>Медицинский рецепт</h2>
              <p style={{ fontSize: 12, color: "#7c3aed", margin: "3px 0 0" }}>№{rx.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span style={{
              background: statusStyle.bg, color: statusStyle.text,
              borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
            }}>
              {STATUS_LABEL[rx.status] ?? rx.status}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <User size={14} color="#9333ea" style={{ marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>Пациент</p>
                <p style={{ fontSize: 13, color: "#3b0764", margin: 0, fontWeight: 700 }}>{rx.patientName}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Phone size={14} color="#9333ea" style={{ marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>Телефон</p>
                <p style={{ fontSize: 13, color: "#3b0764", margin: 0, fontWeight: 700 }}>{rx.patientPhone}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, gridColumn: "1 / -1" }}>
              <Calendar size={14} color="#9333ea" style={{ marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>Дата выдачи</p>
                <p style={{ fontSize: 13, color: "#3b0764", margin: 0, fontWeight: 700 }}>{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription content */}
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Назначения</h3>
          <pre style={{
            fontSize: 14, color: "#0f172a", lineHeight: 1.7, margin: 0,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "inherit", background: "#f8fafc",
            borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0",
          }}>
            {rx.content}
          </pre>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div style={{ ...card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Рекомендации врача</h3>
            <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.6, margin: 0 }}>{rx.notes}</p>
          </div>
        )}

        {/* Print / PDF button */}
        <button
          onClick={() => window.open(`/patient/prescriptions/${rx.id}/print`, "_blank")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "linear-gradient(135deg, #9333ea, #7c3aed)", color: "#fff",
            border: "none", borderRadius: 14, padding: "14px 0",
            fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%",
          }}
        >
          <Printer size={18} /> Распечатать / Скачать PDF
        </button>
      </div>
    </div>
  );
}

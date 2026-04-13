"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ChevronRight, Pill } from "lucide-react";

// Placeholder prescription list — replace with API call when endpoint is available
const MOCK_PRESCRIPTIONS = [
  {
    id: "rx-1",
    date: "2026-03-15",
    doctor: "Д-р Иванов А.А.",
    specialization: "Терапевт",
    drugs: ["Ибупрофен 400мг — 3 раза/день, 5 дней"],
    diagnosis: "ОРВИ",
  },
  {
    id: "rx-2",
    date: "2026-02-10",
    doctor: "Д-р Петрова М.С.",
    specialization: "Кардиолог",
    drugs: ["Аспирин 75мг — 1 раз/день", "Метопролол 50мг — 2 раза/день"],
    diagnosis: "Плановый осмотр",
  },
  {
    id: "rx-3",
    date: "2026-01-20",
    doctor: "Д-р Смирнов В.П.",
    specialization: "Невролог",
    drugs: ["Суматриптан 50мг — при приступе", "Магний B6 — 2 раза/день, 30 дней"],
    diagnosis: "Мигрень",
  },
];

export default function PrescriptionsListPage() {
  const router = useRouter();

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "auto", display: "flex", alignItems: "center", gap: 14 }}>
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
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Мои рецепты</h1>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{MOCK_PRESCRIPTIONS.length} рецептов</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "24px 16px" }}>
        {MOCK_PRESCRIPTIONS.length === 0 ? (
          <div style={{ ...card, padding: 60, textAlign: "center" }}>
            <Pill size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Рецептов нет</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_PRESCRIPTIONS.map((rx) => (
              <button
                key={rx.id}
                onClick={() => router.push(`/patient/prescriptions/${rx.id}`)}
                style={{
                  ...card, padding: "18px 20px", textAlign: "left", width: "100%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: "#faf5ff", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FileText size={20} color="#9333ea" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Рецепт — {rx.diagnosis}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 3px" }}>{rx.doctor} · {rx.specialization}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                      {new Date(rx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {rx.drugs.map((d, idx) => (
                        <span key={idx} style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 6,
                          background: "#faf5ff", color: "#7c3aed", fontWeight: 600,
                        }}>
                          {d.split("—")[0].trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Clock, FileText, Heart, ChevronRight, ArrowLeft } from "lucide-react";

// Placeholder data — will be replaced when patient API is available
const MOCK_VISITS = [
  { id: "1", date: "2026-03-15", doctor: "Д-р Иванов А.А.", specialization: "Терапевт", diagnosis: "ОРВИ", status: "DONE" },
  { id: "2", date: "2026-02-10", doctor: "Д-р Петрова М.С.", specialization: "Кардиолог", diagnosis: "Плановый осмотр", status: "DONE" },
  { id: "3", date: "2026-01-20", doctor: "Д-р Смирнов В.П.", specialization: "Невролог", diagnosis: "Мигрень", status: "DONE" },
];

const MOCK_PRESCRIPTIONS = [
  { id: "rx-1", date: "2026-03-15", drug: "Ибупрофен 400мг", doctor: "Д-р Иванов А.А." },
  { id: "rx-2", date: "2026-02-10", drug: "Аспирин 75мг / Метопролол 50мг", doctor: "Д-р Петрова М.С." },
];

type Tab = "visits" | "prescriptions" | "medcard";
const TAB_LABELS: Record<Tab, string> = {
  visits: "История визитов",
  prescriptions: "Рецепты",
  medcard: "Медкарта",
};

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  DONE:    { background: "#f0fdf4", color: "#16a34a" },
  ACTIVE:  { background: "#fff7ed", color: "#ea580c" },
  PENDING: { background: "#eff6ff", color: "#2563eb" },
};

export default function PatientPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("visits");

  // Placeholder patient info — in real impl, fetch from API using stored token
  const patient = {
    name: "Пациент",
    phone: "+998 -- --- -- --",
    since: "2025",
  };

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488, #0f766e)",
        padding: "20px 20px 32px",
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 4, fontSize: 13, marginBottom: 20 }}
        >
          <ArrowLeft size={14} /> Назад
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{patient.name}</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>{patient.phone}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>Пациент с {patient.since}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -16, maxWidth: 720, margin: "auto" }}>
        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: -16, marginBottom: 20 }}>
          {[
            { icon: <Clock size={18} color="#0d9488" />, value: MOCK_VISITS.length, label: "Визитов" },
            { icon: <FileText size={18} color="#9333ea" />, value: MOCK_PRESCRIPTIONS.length, label: "Рецептов" },
            { icon: <Heart size={18} color="#ef4444" />, value: 0, label: "Аллергий" },
          ].map(({ icon, value, label }) => (
            <div key={label} style={{ ...card, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#94a3b8",
                boxShadow: tab === t ? "0 1px 3px rgba(15,23,42,0.1)" : "none",
                transition: "all 0.15s",
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "visits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_VISITS.map((v) => (
              <div key={v.id} style={{ ...card, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{v.doctor}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        ...(STATUS_STYLES[v.status] ?? { background: "#f1f5f9", color: "#64748b" }),
                      }}>Завершён</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>{v.specialization}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      {new Date(v.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, fontWeight: 600 }}>{v.diagnosis}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "prescriptions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_PRESCRIPTIONS.map((rx) => (
              <button
                key={rx.id}
                onClick={() => router.push(`/patient/prescriptions/${rx.id}`)}
                style={{
                  ...card, padding: 16, textAlign: "left", width: "100%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <FileText size={16} color="#9333ea" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Рецепт</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>{rx.drug}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{rx.doctor} • {new Date(rx.date).toLocaleDateString("ru-RU")}</p>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>
            ))}
            <button
              onClick={() => router.push("/patient/prescriptions")}
              style={{
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                padding: "12px 16px", cursor: "pointer", color: "#0d9488", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Все рецепты <ChevronRight size={14} />
            </button>
          </div>
        )}

        {tab === "medcard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Allergies */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={16} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Аллергии</h3>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                  Нет записей об аллергиях. Ваш врач может добавить эту информацию.
                </p>
              </div>
            </div>

            {/* Chronic diseases */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={16} color="#ea580c" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Хронические заболевания</h3>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                  Нет хронических заболеваний. Данные будут добавлены врачом.
                </p>
              </div>
            </div>

            {/* Blood type placeholder */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={16} color="#db2777" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Группа крови</h3>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                  Не указана. Обратитесь к врачу для уточнения.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

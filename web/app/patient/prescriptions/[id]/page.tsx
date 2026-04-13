"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, User, Calendar, Pill, AlertCircle } from "lucide-react";

// Placeholder data — replace with API when available
const MOCK_PRESCRIPTIONS: Record<string, {
  id: string;
  date: string;
  doctor: string;
  specialization: string;
  diagnosis: string;
  drugs: Array<{ name: string; dose: string; frequency: string; days: number }>;
  notes?: string;
}> = {
  "rx-1": {
    id: "rx-1",
    date: "2026-03-15",
    doctor: "Д-р Иванов А.А.",
    specialization: "Терапевт",
    diagnosis: "ОРВИ",
    drugs: [
      { name: "Ибупрофен", dose: "400 мг", frequency: "3 раза в день", days: 5 },
      { name: "Парацетамол", dose: "500 мг", frequency: "При температуре выше 38°С", days: 5 },
    ],
    notes: "Обильное питьё. Постельный режим 3 дня. Контроль через 5 дней.",
  },
  "rx-2": {
    id: "rx-2",
    date: "2026-02-10",
    doctor: "Д-р Петрова М.С.",
    specialization: "Кардиолог",
    diagnosis: "Плановый осмотр",
    drugs: [
      { name: "Аспирин", dose: "75 мг", frequency: "1 раз в день (утром)", days: 90 },
      { name: "Метопролол", dose: "50 мг", frequency: "2 раза в день", days: 90 },
    ],
    notes: "Контроль АД дважды в день. Следующий визит через 3 месяца.",
  },
  "rx-3": {
    id: "rx-3",
    date: "2026-01-20",
    doctor: "Д-р Смирнов В.П.",
    specialization: "Невролог",
    diagnosis: "Мигрень",
    drugs: [
      { name: "Суматриптан", dose: "50 мг", frequency: "При приступе (не более 2 в сутки)", days: 0 },
      { name: "Магний B6", dose: "1 таблетка", frequency: "2 раза в день", days: 30 },
    ],
    notes: "Вести дневник головных болей. Избегать триггеров (яркий свет, стресс). Контроль через месяц.",
  },
};

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const rx = MOCK_PRESCRIPTIONS[id];

  function handleDownloadPDF() {
    // Placeholder — will integrate with print/PDF API when available
    alert("Функция скачивания PDF будет доступна в ближайшее время.");
  }

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)", padding: 20,
  };

  if (!rx) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 16 }}>Рецепт не найден</p>
          <button
            onClick={() => router.back()}
            style={{ marginTop: 16, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#64748b" }}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 40 }}>
      {/* Header */}
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
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{rx.diagnosis}</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #9333ea, #7c3aed)", color: "#fff",
              border: "none", borderRadius: 10, padding: "9px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Download size={14} /> Скачать PDF
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
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#3b0764", margin: 0 }}>Медицинский рецепт</h2>
              <p style={{ fontSize: 12, color: "#7c3aed", margin: "3px 0 0" }}>№{rx.id.toUpperCase()}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <User size={14} color="#9333ea" />
              <div>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>Врач</p>
                <p style={{ fontSize: 13, color: "#3b0764", margin: 0, fontWeight: 700 }}>{rx.doctor}</p>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0 }}>{rx.specialization}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={14} color="#9333ea" />
              <div>
                <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>Дата выдачи</p>
                <p style={{ fontSize: 13, color: "#3b0764", margin: 0, fontWeight: 700 }}>
                  {new Date(rx.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Диагноз</h3>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{rx.diagnosis}</p>
        </div>

        {/* Drugs */}
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Назначения</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rx.drugs.map((drug, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "#faf5ff", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Pill size={16} color="#9333ea" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{drug.name}</p>
                  <p style={{ fontSize: 13, color: "#475569", margin: "0 0 2px" }}>
                    <span style={{ fontWeight: 600 }}>Доза:</span> {drug.dose}
                  </p>
                  <p style={{ fontSize: 13, color: "#475569", margin: "0 0 2px" }}>
                    <span style={{ fontWeight: 600 }}>Приём:</span> {drug.frequency}
                  </p>
                  {drug.days > 0 && (
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{drug.days} дней</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div style={{ ...card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Рекомендации врача</h3>
            <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.6, margin: 0 }}>{rx.notes}</p>
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownloadPDF}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "linear-gradient(135deg, #9333ea, #7c3aed)", color: "#fff",
            border: "none", borderRadius: 14, padding: "14px 0",
            fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%",
          }}
        >
          <Download size={18} /> Скачать PDF
        </button>
      </div>
    </div>
  );
}

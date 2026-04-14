"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface ClinicPrescription {
  id: string;
  patientName: string;
  patientPhone: string;
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

export default function PrescriptionPrintPage() {
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
        if (!res.ok) {
          if (!cancelled) { setError("Не удалось загрузить рецепт"); setLoading(false); }
          return;
        }
        const data: ClinicPrescription = await res.json();
        if (!cancelled) {
          setRx(data);
          setLoading(false);
          setTimeout(() => window.print(), 500);
        }
      } catch {
        if (!cancelled) { setError("Ошибка загрузки"); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, router]);

  const formattedDate = new Date().toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#64748b" }}>Загрузка...</div>;
  }
  if (error || !rx) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#ef4444" }}>{error ?? "Рецепт не найден"}</div>;
  }

  const rxDate = new Date(rx.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        body { background: #f1f5f9; margin: 0; }
      `}</style>
      <div style={{
        maxWidth: "210mm", margin: "0 auto", background: "#fff",
        padding: "20mm", fontFamily: "Arial, sans-serif", color: "#000",
        minHeight: "297mm", boxSizing: "border-box",
      }}>
        {/* Action buttons — hidden on print */}
        <div className="no-print" style={{ marginBottom: 20, display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Печать / Сохранить PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Закрыть
          </button>
        </div>

        {/* Header */}
        <div style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>HamshiraGo — Медицинский рецепт</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#333" }}>
            Документ сформирован: {formattedDate}
          </p>
        </div>

        {/* Patient info */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: "3px 0", fontSize: 13 }}>
            <strong>Пациент:</strong> {rx.patientName}
          </p>
          <p style={{ margin: "3px 0", fontSize: 13 }}>
            <strong>Телефон:</strong> {rx.patientPhone}
          </p>
          <p style={{ margin: "3px 0", fontSize: 13 }}>
            <strong>Дата выдачи:</strong> {rxDate}
          </p>
          <p style={{ margin: "3px 0", fontSize: 13 }}>
            <strong>Номер рецепта:</strong> {rx.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Prescription content */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px", color: "#333" }}>
            Назначения
          </h2>
          <div style={{
            border: "1px solid #000", borderRadius: 4, padding: "12px 14px",
            fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {rx.content}
          </div>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px", color: "#333" }}>
              Рекомендации врача
            </h2>
            <div style={{
              border: "1px solid #000", borderRadius: 4, padding: "12px 14px",
              fontSize: 13, lineHeight: 1.8,
            }}>
              {rx.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #000", fontSize: 12 }}>
          <p style={{ margin: "2px 0" }}>
            <strong>Статус рецепта:</strong> {STATUS_LABEL[rx.status] ?? rx.status}
          </p>
          <p style={{ margin: "2px 0" }}>
            <strong>Дата формирования документа:</strong> {formattedDate}
          </p>
          <p style={{ margin: "8px 0 0", color: "#555" }}>
            Документ выдан системой HamshiraGo. Действителен при наличии подписи и печати врача.
          </p>
        </div>
      </div>
    </>
  );
}

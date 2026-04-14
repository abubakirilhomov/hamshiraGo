"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface Visit {
  id: string;
  date: string;
  time: string;
  status: string;
  companyName: string | null;
  doctorName: string | null;
  serviceName: string | null;
  notes: string | null;
}

interface MeProfile {
  id: string;
  name: string | null;
  phone: string;
}

const STATUS_LABELS: Record<string, string> = {
  DONE: "Завершён",
  CHECKED_IN: "Ожидает",
  IN_PROGRESS: "На приёме",
  SCHEDULED: "Запланирован",
  CANCELLED: "Отменён",
};

export default function PatientVisitsPrintPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
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
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [meR, visitsR] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, { headers }),
          fetch(`${API_BASE}/patient/visits`, { headers }),
        ]);
        if (meR.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth");
          return;
        }
        if (!meR.ok) throw new Error("Ошибка загрузки профиля");
        const me = await meR.json();
        const visitsData = visitsR.ok ? await visitsR.json() : [];
        if (!cancelled) {
          setProfile(me);
          setVisits(visitsData);
          setLoading(false);
          setTimeout(() => window.print(), 500);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Ошибка");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const formattedDate = new Date().toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#64748b" }}>Загрузка...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#ef4444" }}>{error}</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        body { background: #f1f5f9; margin: 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
        th { background: #f1f5f9; font-weight: 700; }
      `}</style>
      <div style={{
        maxWidth: "210mm", margin: "0 auto", background: "#fff",
        padding: "20mm", fontFamily: "Arial, sans-serif", color: "#000",
        minHeight: "297mm", boxSizing: "border-box",
      }}>
        <div className="no-print" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>HamshiraGo — История визитов</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#333" }}>
            Документ сформирован: {formattedDate}
          </p>
        </div>

        {/* Patient info */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: "2px 0", fontSize: 13 }}>
            <strong>Пациент:</strong> {profile?.name || "—"}
          </p>
          <p style={{ margin: "2px 0", fontSize: 13 }}>
            <strong>Телефон:</strong> {profile?.phone || "—"}
          </p>
        </div>

        {/* Visits table */}
        <table>
          <thead>
            <tr>
              <th style={{ width: 30 }}>№</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Клиника</th>
              <th>Врач</th>
              <th>Услуга</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v, i) => (
              <tr key={v.id}>
                <td>{i + 1}</td>
                <td>{new Date(v.date).toLocaleDateString("ru-RU")}</td>
                <td>{v.time || "—"}</td>
                <td>{v.companyName || "—"}</td>
                <td>{v.doctorName || "—"}</td>
                <td>{v.serviceName || "—"}</td>
                <td>{STATUS_LABELS[v.status] ?? v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px solid #000", fontSize: 12 }}>
          <p style={{ margin: "2px 0" }}><strong>Всего визитов:</strong> {visits.length}</p>
          <p style={{ margin: "2px 0" }}><strong>Дата формирования:</strong> {formattedDate}</p>
        </div>
      </div>
    </>
  );
}

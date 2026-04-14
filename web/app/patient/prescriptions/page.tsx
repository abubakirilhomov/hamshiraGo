"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ChevronRight, Pill, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface ClinicPrescription {
  id: string;
  content: string;
  notes: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  patientName: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "#dcfce7", color: "#16a34a", label: "Активный" },
  COMPLETED: { bg: "#dbeafe", color: "#1d4ed8", label: "Завершён" },
  CANCELLED: { bg: "#fee2e2", color: "#dc2626", label: "Отменён" },
};

function formatDateRu(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PrescriptionsListPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<ClinicPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { router.replace("/auth"); return; }
      try {
        const res = await fetch(`${API_BASE}/patient/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth");
          return;
        }
        if (!res.ok) throw new Error("Ошибка загрузки рецептов");
        const data: ClinicPrescription[] = await res.json();
        if (!cancelled) { setPrescriptions(data); setLoading(false); }
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : "Ошибка"); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

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
              minHeight: 36,
            }}
          >
            <ArrowLeft size={14} /> Назад
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Мои рецепты</h1>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
              {loading ? "Загрузка..." : `${prescriptions.length} рецептов`}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "24px 16px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                ...card, padding: 20, height: 88,
                background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }} />
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ ...card, padding: "40px 24px", textAlign: "center" }}>
            <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 10 }} />
            <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 15, margin: "0 0 14px" }}>{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); }}
              style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Повторить
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && prescriptions.length === 0 && (
          <div style={{ ...card, padding: 60, textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", background: "#faf5ff",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
            }}>
              <Pill size={26} color="#9333ea" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>Рецептов нет</p>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Рецепты, выписанные врачом, появятся здесь</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && prescriptions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prescriptions.map((rx) => {
              const st = STATUS_STYLES[rx.status] ?? { bg: "#f1f5f9", color: "#64748b", label: rx.status };
              return (
                <button
                  key={rx.id}
                  onClick={() => router.push(`/patient/prescriptions/${rx.id}`)}
                  style={{
                    ...card, padding: "18px 20px", textAlign: "left", width: "100%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: "1px solid #f1f5f9", transition: "box-shadow 150ms ease, border-color 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: "#faf5ff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FileText size={20} color="#9333ea" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                          Рецепт #{rx.id.slice(-8).toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>
                        {formatDateRu(rx.createdAt)}
                      </p>
                      <p style={{
                        fontSize: 12, color: "#64748b", margin: 0,
                        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      }}>
                        {rx.content.length > 70 ? rx.content.slice(0, 70) + "..." : rx.content}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 8 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

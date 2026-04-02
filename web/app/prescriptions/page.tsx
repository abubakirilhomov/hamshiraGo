"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaFileMedical } from "react-icons/fa";
import { getMyPrescriptions, Prescription } from "@/lib/api";

const STATUS_CONFIG: Record<Prescription["status"], { color: string; bg: string; label: string }> = {
  PENDING:   { color: "#d97706", bg: "#fef3c7", label: "Ожидает" },
  CONFIRMED: { color: "#2563eb", bg: "#dbeafe", label: "Подтверждён" },
  CANCELED:  { color: "#dc2626", bg: "#fee2e2", label: "Отменён" },
  EXPIRED:   { color: "#6b7280", bg: "#f3f4f6", label: "Истёк" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
  }, [router]);

  const fetchPrescriptions = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await getMyPrescriptions(p, 20);
      setPrescriptions((prev) => append ? [...prev, ...res.data] : res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchPrescriptions(1, false); }, [fetchPrescriptions]);

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
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Мои рецепты</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 10 }}>

        {prescriptions.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaFileMedical size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, color: "#94a3b8" }}>Рецептов пока нет</p>
          </div>
        )}

        {prescriptions.map((item) => {
          const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
          const expired = item.status === "PENDING" && new Date(item.expiresAt) < new Date();
          return (
            <div
              key={item.id}
              onClick={() => item.status === "PENDING" && !expired ? router.push(`/prescriptions/${item.id}`) : undefined}
              style={{ background: "#fff", borderRadius: 14, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", cursor: item.status === "PENDING" && !expired ? "pointer" : "default" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{item.serviceTitle}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", marginTop: 2 }}>{item.servicePrice.toLocaleString("ru-RU")} сум</p>
                </div>
                <span style={{ background: expired ? "#f3f4f6" : st.bg, color: expired ? "#6b7280" : st.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  {expired ? "Истёк" : st.label}
                </span>
              </div>

              {item.doctorNotes && (
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, lineHeight: 1.5 }}>{item.doctorNotes}</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Выписан: {formatDate(item.createdAt)}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>До: {formatDate(item.expiresAt)}</span>
              </div>

              {item.status === "PENDING" && !expired && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf9", borderRadius: 8, border: "1px solid #99f6e4" }}>
                  <p style={{ fontSize: 12, color: "#0d9488", fontWeight: 600 }}>Нажмите, чтобы подтвердить заказ</p>
                </div>
              )}
            </div>
          );
        })}

        {page < totalPages && (
          <button
            onClick={() => fetchPrescriptions(page + 1, true)}
            disabled={loadingMore}
            style={{ background: "transparent", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "13px", fontSize: 14, color: "#0d9488", fontWeight: 600, cursor: "pointer" }}
          >
            {loadingMore ? "Загружаем..." : "Загрузить ещё"}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

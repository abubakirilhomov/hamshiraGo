"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMyPrescriptions, Prescription } from "@/lib/api";

const STATUS_CONFIG: Record<Prescription["status"], { color: string; bg: string; label: string }> = {
  PENDING:   { color: "#d97706", bg: "#fef3c7", label: "Ожидает" },
  CONFIRMED: { color: "#2563eb", bg: "#dbeafe", label: "Подтверждён" },
  CANCELED:  { color: "#dc2626", bg: "#fee2e2", label: "Отменён" },
  EXPIRED:   { color: "#6b7280", bg: "#f3f4f6", label: "Истёк" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
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
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .rx-card { background:#fff; border-radius:20px; padding:16px 18px; margin-bottom:12px;
          box-shadow:0 2px 12px rgba(0,0,0,0.06); animation:fadeUp 200ms ease; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 20px 32px", position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/profile")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>medication</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Мои рецепты</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {prescriptions.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "48px 24px", marginTop: 12, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f2f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span className="mat-icon" style={{ fontSize: 34, color: "#bcc9c6" }}>description</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>Рецептов пока нет</p>
              <p style={{ fontSize: 14, color: "#6d7a77" }}>Здесь появятся рецепты от врачей</p>
            </div>
          )}

          {prescriptions.map((item) => {
            const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
            const expired = item.status === "PENDING" && new Date(item.expiresAt) < new Date();
            return (
              <div
                key={item.id}
                className="rx-card"
                onClick={() => item.status === "PENDING" && !expired ? router.push(`/prescriptions/${item.id}`) : undefined}
                style={{ cursor: item.status === "PENDING" && !expired ? "pointer" : "default" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.serviceTitle}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#00685f", marginTop: 3 }}>{item.servicePrice.toLocaleString("ru-RU")} сум</p>
                  </div>
                  <span style={{
                    background: expired ? "#f2f4f6" : st.bg, color: expired ? "#6d7a77" : st.color,
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                  }}>
                    {expired ? "Истёк" : st.label}
                  </span>
                </div>

                {item.doctorNotes && (
                  <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 10, lineHeight: 1.5 }}>{item.doctorNotes}</p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#bcc9c6" }}>Выписан: {formatDate(item.createdAt)}</span>
                  <span style={{ fontSize: 12, color: "#bcc9c6" }}>До: {formatDate(item.expiresAt)}</span>
                </div>

                {item.status === "PENDING" && !expired && (
                  <div style={{ marginTop: 10, background: "#f0fdf9", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="mat-icon" style={{ fontSize: 14, color: "#00685f" }}>touch_app</span>
                    <p style={{ fontSize: 12, color: "#00685f", fontWeight: 600 }}>Нажмите, чтобы подтвердить заказ</p>
                  </div>
                )}
              </div>
            );
          })}

          {page < totalPages && (
            <button
              onClick={() => fetchPrescriptions(page + 1, true)}
              disabled={loadingMore}
              style={{ width: "100%", background: "transparent", border: "1.5px solid #eceef0", borderRadius: 14, padding: "14px", fontSize: 14, color: "#00685f", fontWeight: 700, cursor: "pointer" }}
            >
              {loadingMore ? "Загружаем..." : "Загрузить ещё"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getMyConsultations, rateConsultation, Consultation } from "@/lib/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}

export default function ConsultationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const STATUS_CONFIG: Record<Consultation["status"], { color: string; bg: string; label: string }> = {
    PENDING:   { color: "#d97706", bg: "#fef3c7", label: t("consultations.statusPending") },
    ACTIVE:    { color: "#2563eb", bg: "#dbeafe", label: t("consultations.statusActive") },
    COMPLETED: { color: "#16a34a", bg: "#dcfce7", label: t("consultations.statusCompleted") },
    CANCELED:  { color: "#dc2626", bg: "#fee2e2", label: t("consultations.statusCanceled") },
  };

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notesModal, setNotesModal] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<Consultation | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

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
      setFetchError(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : t("consultations.loadError"));
    }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchConsultations(1, false); }, [fetchConsultations]);

  async function handleRateSubmit() {
    if (!ratingModal || ratingValue === 0) return;
    setRatingSubmitting(true);
    try {
      await rateConsultation(ratingModal.id, ratingValue, ratingReview || undefined);
      setRatedIds((prev) => new Set([...prev, ratingModal.id]));
      setRatingModal(null);
      setRatingValue(0);
      setRatingReview("");
    } catch {}
    finally { setRatingSubmitting(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 16 }}>{fetchError}</p>
          <button onClick={() => fetchConsultations(1, false)} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .consult-card { background:#fff; border-radius:20px; padding:16px 18px; margin-bottom:12px;
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
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>video_call</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("consultations.title")}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {consultations.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "48px 24px", marginTop: 12, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f2f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span className="mat-icon" style={{ fontSize: 34, color: "#bcc9c6" }}>calendar_month</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>{t("consultations.empty")}</p>
              <p style={{ fontSize: 14, color: "#6d7a77", marginBottom: 20 }}>{t("consultations.bookNow")}</p>
              <button onClick={() => router.push("/doctors")} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,104,95,0.25)" }}>
                {t("consultations.findDoctor")}
              </button>
            </div>
          )}

          {consultations.map((item) => {
            const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
            return (
              <div key={item.id} className="consult-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.doctor?.name ?? "—"}</p>
                    <p style={{ fontSize: 13, color: "#6d7a77", marginTop: 2 }}>{item.doctor?.specialization ?? ""}</p>
                  </div>
                  <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>{st.label}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#bcc9c6" }}>{formatDate(item.createdAt)}</span>
                  {item.doctor?.pricePerConsultation != null && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#00685f" }}>{item.doctor.pricePerConsultation.toLocaleString("ru-RU")} сум</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(item.status === "PENDING" || item.status === "ACTIVE") && (
                    <button onClick={() => router.push(`/video-call/${item.id}`)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff",
                      border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(0,104,95,0.2)",
                    }}>
                      <span className="mat-icon" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>video_call</span>
                      {t("consultations.videoCall")}
                    </button>
                  )}
                  {item.status === "COMPLETED" && !ratedIds.has(item.id) && (
                    <button onClick={() => { setRatingModal(item); setRatingValue(0); setRatingReview(""); }} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#fffbeb", color: "#b45309",
                      border: "1.5px solid #fde68a", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                      <span className="mat-icon" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: "#f59e0b" }}>star</span>
                      {t("consultations.rateDoctor")}
                    </button>
                  )}
                  {item.status === "COMPLETED" && ratedIds.has(item.id) && (
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mat-icon" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: "#16a34a" }}>check_circle</span>
                      {t("consultations.rateSuccess")}
                    </span>
                  )}
                  {item.doctorNotes && (
                    <button onClick={() => setNotesModal(item.doctorNotes!)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#f7f9fb", border: "none", borderRadius: 10,
                      padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "#6d7a77", cursor: "pointer",
                    }}>
                      <span className="mat-icon" style={{ fontSize: 14 }}>description</span>
                      {t("consultations.doctorNotes")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {page < totalPages && (
            <button onClick={() => fetchConsultations(page + 1, true)} disabled={loadingMore} style={{
              width: "100%", background: "transparent", border: "1.5px solid #eceef0",
              borderRadius: 14, padding: "14px", fontSize: 14, color: "#00685f", fontWeight: 700, cursor: "pointer",
            }}>
              {loadingMore ? t("consultations.loading") : t("consultations.loadMore")}
            </button>
          )}
        </div>
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 600, animation: "slideUp 250ms ease" }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>{t("consultations.rateTitle")}</p>
            <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 16 }}>{ratingModal.doctor?.name}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }}>
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRatingValue(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <span className="mat-icon" style={{ fontSize: 36, color: s <= ratingValue ? "#f59e0b" : "#e2e8f0", fontVariationSettings: s <= ratingValue ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                </button>
              ))}
            </div>
            <textarea
              value={ratingReview}
              onChange={(e) => setRatingReview(e.target.value)}
              placeholder={t("consultations.ratePlaceholder")}
              rows={3}
              style={{ width: "100%", border: "1.5px solid #eceef0", borderRadius: 12, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRatingModal(null)} style={{ flex: 1, background: "#f7f9fb", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, color: "#6d7a77", cursor: "pointer" }}>
                {t("common.cancel") || "Отмена"}
              </button>
              <button
                onClick={handleRateSubmit}
                disabled={ratingValue === 0 || ratingSubmitting}
                style={{ flex: 2, background: ratingValue === 0 ? "#e2e8f0" : "linear-gradient(135deg,#00685f,#008378)", color: ratingValue === 0 ? "#9ca3af" : "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: ratingValue === 0 ? "not-allowed" : "pointer" }}
              >
                {ratingSubmitting ? "..." : t("consultations.rateSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {notesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 600, animation: "slideUp 250ms ease" }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>{t("consultations.doctorNotes")}</p>
            <p style={{ fontSize: 14, color: "#3d4947", lineHeight: 1.6, marginBottom: 20 }}>{notesModal}</p>
            <button onClick={() => setNotesModal(null)} style={{ width: "100%", background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

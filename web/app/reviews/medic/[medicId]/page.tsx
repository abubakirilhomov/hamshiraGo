"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getMedicReviews, type Review } from "@/lib/api";

export default function MedicReviewsPage() {
  const router = useRouter();
  const params = useParams();
  const medicId = params.medicId as string;
  const { t } = useTranslation();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async (p: number) => {
    setLoading(true); setError("");
    try {
      const res = await getMedicReviews(medicId, p);
      setReviews(res.data); setTotal(res.total);
      setPage(res.page); setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("reviews.error"));
    } finally { setLoading(false); }
  }, [medicId, t]);

  useEffect(() => { loadReviews(1); }, [loadReviews]);

  const avgRating = total > 0 && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1,2,3,4,5].map((s) => (
          <span key={s} style={{ fontSize: size, color: s <= rating ? "#eab308" : "#eceef0" }}>★</span>
        ))}
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
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 32px", position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>reviews</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("reviews.title")}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {/* Summary card */}
          {!loading && !error && total > 0 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "22px 24px", marginBottom: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", animation: "fadeUp 200ms ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: 42, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1, margin: "0 0 6px" }}>
                    {avgRating !== null ? avgRating.toFixed(1) : "—"}
                  </p>
                  {avgRating !== null && <Stars rating={Math.round(avgRating)} size={18} />}
                  <p style={{ fontSize: 12, color: "#bcc9c6", marginTop: 6 }}>{t("reviews.avgRating")}</p>
                </div>
                <div style={{ width: 1, height: 60, background: "#f2f4f6", flexShrink: 0, margin: "0 16px" }} />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: 42, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1, margin: "0 0 6px" }}>{total}</p>
                  <p style={{ fontSize: 12, color: "#bcc9c6", marginTop: 10 }}>{t("reviews.totalReviews")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 14, color: "#6d7a77" }}>{t("reviews.loading")}</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <span className="mat-icon" style={{ fontSize: 44, color: "#ef4444", display: "block", marginBottom: 12 }}>error_outline</span>
              <p style={{ fontSize: 14, color: "#ef4444", marginBottom: 16 }}>{error}</p>
              <button onClick={() => loadReviews(page)} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {t("reviews.retry")}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && total === 0 && (
            <div style={{ background: "#fff", borderRadius: 24, padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#f2f4f6", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mat-icon" style={{ fontSize: 32, color: "#bcc9c6" }}>star_border</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>{t("reviews.empty")}</p>
              <p style={{ fontSize: 13, color: "#6d7a77" }}>{t("reviews.emptyHint")}</p>
            </div>
          )}

          {/* Review cards */}
          {!loading && !error && reviews.map((review) => (
            <div key={review.id} style={{ background: "#fff", borderRadius: 20, padding: "16px 18px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "fadeUp 200ms ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <Stars rating={review.rating} />
                  <span style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {review.authorRole === "client" ? t("reviews.roleClient") : t("reviews.roleMedic")}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#bcc9c6", whiteSpace: "nowrap", marginLeft: 8, marginTop: 2 }}>
                  {new Date(review.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              {review.comment
                ? <p style={{ fontSize: 14, color: "#3d4947", lineHeight: 1.6 }}>{review.comment}</p>
                : <p style={{ fontSize: 13, color: "#bcc9c6", fontStyle: "italic" }}>{t("reviews.noComment")}</p>
              }
            </div>
          ))}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
              <button disabled={page <= 1} onClick={() => loadReviews(page - 1)} style={{ background: page <= 1 ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)", color: page <= 1 ? "#bcc9c6" : "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
                {t("reviews.prevPage")}
              </button>
              <span style={{ fontSize: 13, color: "#6d7a77", fontWeight: 600 }}>
                {t("reviews.pageOf", { page, total: totalPages })}
              </span>
              <button disabled={page >= totalPages} onClick={() => loadReviews(page + 1)} style={{ background: page >= totalPages ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)", color: page >= totalPages ? "#bcc9c6" : "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
                {t("reviews.nextPage")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

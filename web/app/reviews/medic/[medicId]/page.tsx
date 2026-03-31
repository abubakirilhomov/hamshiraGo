"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaStar } from "react-icons/fa";
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
    setLoading(true);
    setError("");
    try {
      const res = await getMedicReviews(medicId, p);
      setReviews(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("reviews.error"));
    } finally {
      setLoading(false);
    }
  }, [medicId, t]);

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  const avgRating = total > 0 && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : null;

  function renderStars(rating: number, size = 14) {
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <FaStar key={s} size={size} color={s <= rating ? "#eab308" : "#e2e8f0"} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", padding: "20px 20px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", flexShrink: 0,
            }}
          >
            <FaArrowLeft size={14} />
          </button>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{t("reviews.title")}</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "-12px auto 0", padding: "0 20px 100px" }}>

        {/* Summary card */}
        {!loading && !error && total > 0 && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#0d9488", lineHeight: 1 }}>
                  {avgRating !== null ? avgRating.toFixed(1) : "—"}
                </p>
                <div style={{ marginTop: 6 }}>
                  {avgRating !== null && renderStars(Math.round(avgRating), 16)}
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{t("reviews.avgRating")}</p>
              </div>
              <div style={{ width: 1, height: 56, background: "#e2e8f0", flexShrink: 0 }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{total}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>{t("reviews.totalReviews")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 14, color: "#64748b" }}>{t("reviews.loading")}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ ...card, textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
            <p style={{ fontSize: 14, color: "#ef4444", marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => loadReviews(page)}
              style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {t("reviews.retry")}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && total === 0 && (
          <div style={{ ...card, textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaStar size={24} color="#cbd5e1" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{t("reviews.empty")}</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>{t("reviews.emptyHint")}</p>
          </div>
        )}

        {/* Review cards */}
        {!loading && !error && reviews.map((review) => (
          <div key={review.id} style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {renderStars(review.rating)}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                  {review.authorRole === "client" ? t("reviews.roleClient") : t("reviews.roleMedic")}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, marginTop: 2 }}>
                {new Date(review.createdAt).toLocaleString("ru-RU", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
            {review.comment ? (
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.55 }}>{review.comment}</p>
            ) : (
              <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>{t("reviews.noComment")}</p>
            )}
          </div>
        ))}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
            <button
              disabled={page <= 1}
              onClick={() => loadReviews(page - 1)}
              style={{
                background: page <= 1 ? "#f1f5f9" : "#0d9488",
                color: page <= 1 ? "#94a3b8" : "#fff",
                border: "none", borderRadius: 10,
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              {t("reviews.prevPage")}
            </button>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
              {t("reviews.pageOf", { page, total: totalPages })}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadReviews(page + 1)}
              style={{
                background: page >= totalPages ? "#f1f5f9" : "#0d9488",
                color: page >= totalPages ? "#94a3b8" : "#fff",
                border: "none", borderRadius: 10,
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              {t("reviews.nextPage")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

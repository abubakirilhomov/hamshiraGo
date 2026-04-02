"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaHeart, FaArrowLeft } from "react-icons/fa";
import { submitNps } from "@/lib/api";

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getScoreColor(score: number): string {
  if (score <= 6) return "#ef4444";
  if (score <= 8) return "#f59e0b";
  return "#10b981";
}

export default function NpsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (selected === null || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitNps(selected, comment.trim() || undefined);
      // Mark as shown for this session
      try { sessionStorage.setItem("nps_shown", "1"); } catch {}
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
      setSubmitting(false);
    }
  }

  function handleSkip() {
    try { sessionStorage.setItem("nps_shown", "1"); } catch {}
    router.back();
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 16, textAlign: "center" }}>
        <FaHeart size={64} color="#0d9488" />
        <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Спасибо!</p>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 300, lineHeight: 1.6 }}>Ваш отзыв поможет нам стать лучше</p>
        <button
          onClick={() => router.push("/")}
          style={{ marginTop: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 14, padding: "14px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          На главную
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={handleSkip} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Оцените приложение</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 20px 80px" }}>

        {/* Question card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 12 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 6 }}>
            Насколько вы готовы рекомендовать нас друзьям?
          </p>
          <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 24 }}>
            Оцените от 0 (совсем нет) до 10 (обязательно)
          </p>

          {/* Score buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 10 }}>
            {SCORES.map((score) => {
              const isSelected = selected === score;
              const color = getScoreColor(score);
              return (
                <button
                  key={score}
                  onClick={() => setSelected(score)}
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: `2px solid ${isSelected ? color : "#e2e8f0"}`,
                    background: isSelected ? color : "#fff",
                    color: isSelected ? "#fff" : "#374151",
                    fontSize: 16, fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {score}
                </button>
              );
            })}
          </div>

          {/* Scale labels */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingInline: 4 }}>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Не рекомендую</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Обязательно рекомендую</span>
          </div>
        </div>

        {/* Comment — shown after score selected */}
        {selected !== null && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Комментарий (необязательно)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите подробнее о вашем опыте..."
              maxLength={2000}
              rows={4}
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", color: "#0f172a", boxSizing: "border-box" }}
            />
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selected === null || submitting}
          style={{ width: "100%", background: selected === null ? "#e2e8f0" : "#0d9488", color: selected === null ? "#94a3b8" : "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: selected === null ? "not-allowed" : "pointer", marginBottom: 10 }}
        >
          {submitting ? "Отправляем..." : "Отправить оценку"}
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          style={{ width: "100%", background: "transparent", color: "#94a3b8", border: "none", padding: "12px", fontSize: 14, cursor: "pointer" }}
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}

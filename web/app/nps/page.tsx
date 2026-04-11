"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitNps } from "@/lib/api";

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getScoreColor(score: number) {
  if (score <= 6) return { bg: "#fef2f2", color: "#ef4444", border: "#ef4444" };
  if (score <= 8) return { bg: "#fffbeb", color: "#f59e0b", border: "#f59e0b" };
  return { bg: "#f0fdf4", color: "#16a34a", border: "#16a34a" };
}

export default function NpsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [commentFocused, setCommentFocused] = useState(false);

  async function handleSubmit() {
    if (selected === null || submitting) return;
    setSubmitting(true); setError("");
    try {
      await submitNps(selected, comment.trim() || undefined);
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
      <>
        <style>{`.mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; -webkit-font-smoothing:antialiased; }`}</style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 8px 30px rgba(0,104,95,0.2)" }}>
            <span className="mat-icon" style={{ fontSize: 48, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>Спасибо!</h1>
          <p style={{ fontSize: 16, color: "#6d7a77", maxWidth: 300, lineHeight: 1.6, marginBottom: 32 }}>Ваш отзыв поможет нам стать лучше</p>
          <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 16, padding: "14px 40px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,104,95,0.25)" }}>
            На главную
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={handleSkip} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Оцените приложение</p>
            <div style={{ width: 38 }} />
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px" }}>

          {/* Question card */}
          <div style={{ background: "#fff", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span className="mat-icon" style={{ fontSize: 38, color: "#00685f", fontVariationSettings: "'FILL' 1", display: "block", marginBottom: 12 }}>reviews</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 6 }}>
                Насколько вы готовы рекомендовать нас друзьям?
              </p>
              <p style={{ fontSize: 14, color: "#6d7a77" }}>
                Оцените от 0 (совсем нет) до 10 (обязательно)
              </p>
            </div>

            {/* Score buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {SCORES.map((score) => {
                const isSelected = selected === score;
                const c = getScoreColor(score);
                return (
                  <button key={score} onClick={() => setSelected(score)} style={{
                    width: 46, height: 46, borderRadius: "50%", border: "none",
                    background: isSelected ? c.color : "#f2f4f6",
                    color: isSelected ? "#fff" : "#6d7a77",
                    fontSize: 15, fontWeight: 800, cursor: "pointer",
                    boxShadow: isSelected ? `0 4px 12px ${c.color}40` : "none",
                    transition: "all 150ms", fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}>
                    {score}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingInline: 4 }}>
              <span style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 500 }}>Не рекомендую</span>
              <span style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 500 }}>Обязательно рекомендую</span>
            </div>
          </div>

          {/* Comment */}
          {selected !== null && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 12, animation: "pop 200ms ease" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#191c1e", marginBottom: 10 }}>Комментарий <span style={{ color: "#bcc9c6", fontWeight: 500 }}>(необязательно)</span></p>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                onFocus={() => setCommentFocused(true)} onBlur={() => setCommentFocused(false)}
                placeholder="Расскажите подробнее о вашем опыте..." maxLength={2000} rows={4}
                style={{ width: "100%", border: "none", outline: "none", borderRadius: 14, padding: "12px 14px", fontSize: 14, resize: "vertical", fontFamily: "inherit", color: "#191c1e", boxSizing: "border-box", background: "#f7f9fb", lineHeight: 1.6, boxShadow: commentFocused ? "0 0 0 2px #00685f40" : "0 0 0 1.5px #eceef0", transition: "box-shadow 150ms" }}
              />
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
              <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={selected === null || submitting} style={{
            width: "100%",
            background: selected === null ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)",
            color: selected === null ? "#bcc9c6" : "#fff",
            border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700,
            cursor: selected === null ? "not-allowed" : "pointer", marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: selected !== null ? "0 6px 18px rgba(0,104,95,0.25)" : "none",
            transition: "all 200ms",
          }}>
            {submitting && <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
            {submitting ? "Отправляем..." : "Отправить оценку"}
          </button>

          <button onClick={handleSkip} style={{ width: "100%", background: "transparent", color: "#bcc9c6", border: "none", padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
            Пропустить
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://hamshirago-production-739a.up.railway.app";

const DISCLAIMER_KEY = "salomat_disclaimer_shown";

const CHIPS = [
  "Голова болит уже 2 дня",
  "Высокая температура у ребёнка",
  "Боль в груди при вдохе",
  "Тошнота и рвота",
  "Сильная боль в животе",
  "Не могу спать, тревога",
];

type Recommendation =
  | { type: "doctor"; specialization: string; summary: string }
  | { type: "nurse" }
  | null;

interface Message {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
}

// ── Disclaimer modal ──────────────────────────────────────────────────────────

function DisclaimerModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: "24px 24px 0 0",
          padding: "28px 24px 36px", maxWidth: 480, width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Salomat AI</p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Медицинский ассистент</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, marginBottom: 20 }}>
          <strong>Важно:</strong> Salomat AI — информационный помощник и не является заменой
          консультации врача. Все рекомендации носят ориентировочный характер.
          При угрозе жизни немедленно звоните <strong>103</strong>.
        </p>

        <div style={{
          background: "#f0fdfa", border: "1px solid #99f6e4",
          borderRadius: 12, padding: "12px 16px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, color: "#0f766e", margin: 0, lineHeight: 1.5 }}>
            Ваши данные используются только для персонализации ответов и не передаются третьим лицам.
          </p>
        </div>

        <button
          onClick={onAccept}
          style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}
        >
          Понятно, начать
        </button>
      </div>
    </div>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 8,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #0d9488, #0f766e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginRight: 8, alignSelf: "flex-end",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      )}
      <div style={{
        maxWidth: "78%",
        background: isUser
          ? "linear-gradient(135deg, #0d9488, #0f766e)"
          : "#f1f5f9",
        color: isUser ? "#fff" : "#1e293b",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 14, lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}>
        {msg.text}
        {msg.streaming && (
          <span style={{
            display: "inline-block", width: 6, height: 14,
            background: "#0d9488", borderRadius: 2, marginLeft: 4,
            animation: "blink 0.8s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onDoctor,
  onNurse,
}: {
  rec: Recommendation;
  onDoctor: () => void;
  onNurse: () => void;
}) {
  if (!rec) return null;

  if (rec.type === "doctor") {
    return (
      <div style={{
        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
        border: "1.5px solid #93c5fd", borderRadius: 16, padding: "14px 16px",
        marginBottom: 8,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>
          💊 Рекомендуем врача
        </p>
        <p style={{ fontSize: 13, color: "#1e40af", margin: "0 0 12px" }}>
          {rec.specialization}{rec.summary ? ` — ${rec.summary}` : ""}
        </p>
        <button
          onClick={onDoctor}
          style={{
            width: "100%", padding: "11px 0",
            background: "#2563eb", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: "pointer",
          }}
        >
          Записаться к врачу
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
      border: "1.5px solid #5eead4", borderRadius: 16, padding: "14px 16px",
      marginBottom: 8,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", margin: "0 0 4px" }}>
        🩺 Рекомендуем медсестру
      </p>
      <p style={{ fontSize: 13, color: "#0d9488", margin: "0 0 12px" }}>
        Медсестра поможет с процедурой на дому
      </p>
      <button
        onClick={onNurse}
        style={{
          width: "100%", padding: "11px 0",
          background: "#0d9488", color: "#fff",
          border: "none", borderRadius: 10, fontSize: 14,
          fontWeight: 700, cursor: "pointer",
        }}
      >
        Вызвать медсестру
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SalomatPage() {
  const router = useRouter();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(DISCLAIMER_KEY)) {
      setShowDisclaimer(true);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "1");
    setShowDisclaimer(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setInput("");
      setRecommendation(null);

      const userMsg: Message = { role: "user", text: text.trim() };
      const history = [...messages, userMsg];
      setMessages([...history, { role: "assistant", text: "", streaming: true }]);
      setLoading(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Try SSE streaming first
      try {
        const res = await fetch(`${BASE_URL}/consultations/ai-chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.text })),
          }),
        });

        if (!res.ok || !res.body) throw new Error("stream_fail");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.error) throw new Error(payload.error);
              if (payload.done) {
                // parse recommendation
                const rec = payload.recommendation;
                if (rec?.specialization) {
                  setRecommendation({ type: "doctor", specialization: rec.specialization, summary: rec.summary ?? "" });
                } else if (rec?.type === "nurse" || fullText.toLowerCase().includes("медсест")) {
                  setRecommendation({ type: "nurse" });
                }
              } else if (payload.text) {
                fullText += payload.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", text: fullText, streaming: true };
                  return next;
                });
              }
            } catch { /* skip bad lines */ }
          }
        }

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: fullText, streaming: false };
          return next;
        });
      } catch {
        // Fallback: non-streaming
        try {
          const res = await fetch(`${BASE_URL}/consultations/ai-chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              messages: history.map((m) => ({ role: m.role, content: m.text })),
            }),
          });
          const data = await res.json();
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", text: data.reply ?? "Ошибка", streaming: false };
            return next;
          });
          if (data.recommendation?.specialization) {
            setRecommendation({ type: "doctor", specialization: data.recommendation.specialization, summary: data.recommendation.summary ?? "" });
          }
        } catch {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", text: "Произошла ошибка. Попробуйте ещё раз.", streaming: false };
            return next;
          });
        }
      }

      setLoading(false);
    },
    [messages, loading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
      `}</style>

      {showDisclaimer && <DisclaimerModal onAccept={acceptDisclaimer} />}

      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f8fafc", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", background: "#fff",
          borderBottom: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Salomat AI</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Медицинский ассистент</p>
          </div>
          <a
            href="tel:103"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "6px 10px", textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>103</span>
          </a>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {isEmpty ? (
            <div style={{ paddingTop: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                  Привет! Я Salomat
                </p>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Опишите свои симптомы, и я помогу понять,<br />к какому специалисту обратиться
                </p>
              </div>

              <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Примеры вопросов
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    style={{
                      background: "#fff", border: "1.5px solid #e2e8f0",
                      borderRadius: 20, padding: "8px 14px",
                      fontSize: 13, color: "#334155", cursor: "pointer",
                      lineHeight: 1.4,
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <Bubble key={i} msg={m} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Recommendation card */}
        {recommendation && (
          <div style={{ padding: "0 16px 4px", flexShrink: 0 }}>
            <RecommendationCard
              rec={recommendation}
              onDoctor={() => router.push("/doctors")}
              onNurse={() => router.push("/order/location")}
            />
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "10px 16px 24px", background: "#fff",
          borderTop: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Опишите симптомы..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 16,
                padding: "10px 14px", fontSize: 14, resize: "none",
                outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
                background: loading ? "#f8fafc" : "#fff",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: loading || !input.trim()
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #0d9488, #0f766e)",
                border: "none", cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              {loading ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                  </path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "8px 0 0" }}>
            Salomat AI не заменяет врача. При угрозе жизни — <a href="tel:103" style={{ color: "#dc2626", fontWeight: 700 }}>103</a>
          </p>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";
const DISCLAIMER_KEY = "salomat_disclaimer_accepted";
const CHIPS = [
  "У меня болит голова и температура",
  "Боль в животе уже 2 дня",
  "Кашель и насморк неделю",
  "Высокое давление, что делать?",
  "Нужна консультация педиатра",
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="mat-icon" style={{ fontSize: 26, color: "#fff", fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>Salomat AI</p>
            <p style={{ fontSize: 12, color: "#6d7a77", margin: 0 }}>Медицинский ассистент</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: "#3d4947", lineHeight: 1.6, marginBottom: 16 }}>
          <strong>Важно:</strong> Salomat AI — информационный помощник и не является заменой консультации врача.
          Все рекомендации носят ориентировочный характер. При угрозе жизни немедленно звоните <strong>103</strong>.
        </p>

        <div style={{ background: "#f0fdf9", border: "1.5px solid #c2ebe3", borderRadius: 12, padding: "12px 14px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "#00685f", margin: 0, lineHeight: 1.5 }}>
            Ваши данные используются только для персонализации ответов и не передаются третьим лицам.
          </p>
        </div>

        <button onClick={onAccept} style={{
          width: "100%", background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff",
          border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 6px 18px rgba(0,104,95,0.25)",
        }}>
          Понятно, начать
        </button>
      </div>
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#00685f,#008378)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginRight: 8, alignSelf: "flex-end", flexShrink: 0,
        }}>
          <span className="mat-icon" style={{ fontSize: 16, color: "#fff", fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
        </div>
      )}
      <div style={{
        maxWidth: "78%",
        background: isUser ? "linear-gradient(135deg,#00685f,#008378)" : "#fff",
        color: isUser ? "#fff" : "#191c1e",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px", fontSize: 14, lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        boxShadow: isUser ? "0 3px 12px rgba(0,104,95,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {msg.text}
        {msg.streaming && (
          <span style={{
            display: "inline-block", width: 6, height: 14,
            background: isUser ? "rgba(255,255,255,0.7)" : "#00685f",
            borderRadius: 2, marginLeft: 4,
            animation: "blink 0.8s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────

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
      <div style={{ background: "#fff", border: "1.5px solid #dbeafe", borderRadius: 16, padding: "14px 16px", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="mat-icon" style={{ fontSize: 16, color: "#2563eb" }}>stethoscope</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", margin: 0 }}>Рекомендуем врача</p>
        </div>
        <p style={{ fontSize: 13, color: "#3d4947", margin: "0 0 12px" }}>
          {rec.specialization}{rec.summary ? ` — ${rec.summary}` : ""}
        </p>
        <button onClick={onDoctor} style={{
          width: "100%", background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff",
          border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          Записаться к врачу
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid #c2ebe3", borderRadius: 16, padding: "14px 16px", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span className="mat-icon" style={{ fontSize: 16, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>medical_services</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00685f", margin: 0 }}>Рекомендуем медсестру</p>
      </div>
      <p style={{ fontSize: 13, color: "#3d4947", margin: "0 0 12px" }}>Медсестра поможет с процедурой на дому</p>
      <button onClick={onNurse} style={{
        width: "100%", background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff",
        border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>
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
    if (!localStorage.getItem(DISCLAIMER_KEY)) setShowDisclaimer(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "1");
    setShowDisclaimer(false);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput(""); setRecommendation(null);

    const userMsg: Message = { role: "user", text: text.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", text: "", streaming: true }]);
    setLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(`${BASE_URL}/consultations/ai-chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.text })) }),
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
      try {
        const res = await fetch(`${BASE_URL}/consultations/ai-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.text })) }),
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
  }, [messages, loading]);

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
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing:border-box; }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      {showDisclaimer && <DisclaimerModal onAccept={acceptDisclaimer} />}

      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f7f9fb", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)", flexShrink: 0 }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff", fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>Salomat AI</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: 0 }}>Медицинский ассистент</p>
            </div>
            <a href="tel:103" style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.85)", borderRadius: 10, padding: "6px 10px", textDecoration: "none" }}>
              <span className="mat-icon" style={{ fontSize: 14, color: "#fff", fontVariationSettings: "'FILL' 1" }}>call</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>103</span>
            </a>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {isEmpty ? (
            <div style={{ paddingTop: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 76, height: 76, borderRadius: 22, margin: "0 auto 16px", background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,104,95,0.25)" }}>
                  <span className="mat-icon" style={{ fontSize: 38, color: "#fff", fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: "0 0 8px" }}>Привет! Я Salomat</p>
                <p style={{ fontSize: 14, color: "#6d7a77", margin: 0, lineHeight: 1.6 }}>
                  Опишите симптомы, и я помогу понять,<br />к какому специалисту обратиться
                </p>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Примеры вопросов
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CHIPS.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)} style={{
                    background: "#fff", border: "none", borderRadius: 20, padding: "9px 14px",
                    fontSize: 13, color: "#3d4947", cursor: "pointer", lineHeight: 1.4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
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

        {/* Recommendation */}
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
        <div style={{ padding: "10px 16px 24px", background: "#fff", borderTop: "1px solid #eceef0", flexShrink: 0 }}>
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
                flex: 1, border: "none", outline: "none", borderRadius: 16,
                padding: "11px 14px", fontSize: 14, resize: "none",
                fontFamily: "inherit", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
                background: "#f7f9fb",
                boxShadow: "0 0 0 1.5px #eceef0",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0, border: "none",
                background: loading || !input.trim() ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)",
                cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: !loading && input.trim() ? "0 4px 12px rgba(0,104,95,0.3)" : "none",
                transition: "all 200ms",
              }}
            >
              {loading
                ? <span className="mat-icon" style={{ fontSize: 20, color: "#bcc9c6", animation: "spin 0.8s linear infinite" }}>progress_activity</span>
                : <span className="mat-icon" style={{ fontSize: 20, color: loading || !input.trim() ? "#bcc9c6" : "#fff", fontVariationSettings: "'FILL' 1" }}>send</span>
              }
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#bcc9c6", textAlign: "center", margin: "8px 0 0" }}>
            Salomat AI не заменяет врача. При угрозе жизни — <a href="tel:103" style={{ color: "#ef4444", fontWeight: 700 }}>103</a>
          </p>
        </div>
      </div>
    </>
  );
}

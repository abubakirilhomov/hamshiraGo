"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { consultationsApi, AiChatMessage as ChatMessage } from "@/lib/api";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendation?: { specialization: string; summary: string };
}

export default function AiChatPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: "greeting", role: "assistant", content: "..." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const idCounter = useRef(1);
  const apiMessages = useRef<ChatMessage[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    setMessages([{ id: "greeting", role: "assistant", content: t("aiChat.greeting") }]);
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: DisplayMessage = { id: String(++idCounter.current), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    apiMessages.current.push({ role: "user", content: text });
    scrollToBottom();
    setLoading(true);
    try {
      const res = await consultationsApi.aiChat(apiMessages.current);
      apiMessages.current.push({ role: "assistant", content: res.reply });
      setMessages((prev) => [...prev, { id: String(++idCounter.current), role: "assistant", content: res.reply, recommendation: res.recommendation }]);
    } catch {
      setMessages((prev) => [...prev, { id: String(++idCounter.current), role: "assistant", content: t("aiChat.unavailable") }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, scrollToBottom]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const symptoms = apiMessages.current.filter((m) => m.role === "user").map((m) => m.content).join("; ");

  return (
    <>
      <style>{`
        @keyframes dot { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-4px); opacity:1; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", flexShrink: 0 }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                  <span className="mat-icon" style={{ fontSize: 22, color: "#fff", fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1.2 }}>{t("aiChat.title")}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#89f5e7" }} />
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{t("aiChat.subtitle")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 640, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} style={{ animation: "fadeUp 200ms ease" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  {!isUser && (
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="mat-icon" style={{ fontSize: 17, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%",
                    background: isUser ? "linear-gradient(135deg,#00685f,#008378)" : "#fff",
                    color: isUser ? "#fff" : "#191c1e",
                    borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                    padding: "12px 16px", fontSize: 15, lineHeight: 1.6,
                    boxShadow: isUser ? "0 4px 14px rgba(0,104,95,0.22)" : "0 2px 10px rgba(0,0,0,0.06)",
                  }}>
                    {msg.content}
                  </div>
                  {isUser && (
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eceef0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="mat-icon" style={{ fontSize: 17, color: "#6d7a77" }}>person</span>
                    </div>
                  )}
                </div>

                {/* Recommendation card */}
                {msg.recommendation && (
                  <div style={{ marginTop: 10, marginLeft: 42, maxWidth: "78%", background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1.5px solid rgba(0,104,95,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span className="mat-icon" style={{ fontSize: 16, color: "#00685f" }}>stethoscope</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#00685f", textTransform: "uppercase", letterSpacing: 0.6 }}>{t("aiChat.recommend")}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 6 }}>
                      {msg.recommendation.specialization}
                    </p>
                    <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 14, lineHeight: 1.6 }}>{msg.recommendation.summary}</p>
                    <button
                      onClick={() => router.push(`/doctors?spec=${encodeURIComponent(msg.recommendation!.specialization)}&symptoms=${encodeURIComponent(symptoms)}`)}
                      style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,104,95,0.2)" }}>
                      <span className="mat-icon" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>search</span>
                      {t("aiChat.findDoctor")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 200ms ease" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="mat-icon" style={{ fontSize: 17, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div style={{ background: "#fff", borderRadius: "20px 20px 20px 4px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00685f", animation: `dot 1.2s ${i * 0.2}s infinite`, display: "block" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #f2f4f6", padding: "12px 16px 24px", flexShrink: 0 }}>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={t("aiChat.placeholder")}
              disabled={loading}
              rows={1}
              maxLength={1000}
              style={{
                flex: 1, fontSize: 15, color: "#191c1e", background: "#f7f9fb",
                border: "none", outline: "none",
                borderRadius: 18, padding: "12px 16px",
                resize: "none", maxHeight: 110, fontFamily: "inherit", lineHeight: 1.5,
                boxShadow: inputFocused ? "0 0 0 2px #00685f40" : "0 0 0 1.5px #eceef0",
                transition: "box-shadow 150ms",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 46, height: 46, borderRadius: "50%",
                background: input.trim() && !loading ? "linear-gradient(135deg,#00685f,#008378)" : "#eceef0",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                flexShrink: 0, transition: "background 200ms",
                boxShadow: input.trim() && !loading ? "0 4px 12px rgba(0,104,95,0.25)" : "none",
              }}>
              <span className="mat-icon" style={{ fontSize: 20, color: input.trim() && !loading ? "#fff" : "#bcc9c6", fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

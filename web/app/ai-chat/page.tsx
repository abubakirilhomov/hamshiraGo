"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaHeartbeat, FaStethoscope, FaPaperPlane, FaSearch } from "react-icons/fa";
import { consultationsApi, AiChatMessage as ChatMessage } from "@/lib/api";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendation?: { specialization: string; summary: string };
}

export default function AiChatPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: "greeting", role: "assistant", content: "Здравствуйте! Я медицинский ИИ-ассистент HamshiraGo. Опишите ваши симптомы, и я помогу разобраться — при необходимости порекомендую специалиста." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const idCounter = useRef(1);
  const apiMessages = useRef<ChatMessage[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
  }, [router]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
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
      setMessages((prev) => [...prev, {
        id: String(++idCounter.current),
        role: "assistant",
        content: res.reply,
        recommendation: res.recommendation,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: String(++idCounter.current),
        role: "assistant",
        content: "Извините, сервис временно недоступен. Попробуйте позже.",
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, scrollToBottom]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const symptoms = apiMessages.current.filter((m) => m.role === "user").map((m) => m.content).join("; ");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}
            >
              <FaArrowLeft size={15} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaHeartbeat size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>ИИ-ассистент</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Медицинская консультация</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <FaHeartbeat size={13} color="#0d9488" />
                  </div>
                )}
                <div style={{ maxWidth: "80%", background: isUser ? "#0d9488" : "#fff", color: isUser ? "#fff" : "#0f172a", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", fontSize: 15, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: isUser ? "none" : "1px solid #f1f5f9" }}>
                  {msg.content}
                </div>
              </div>

              {/* Recommendation card */}
              {msg.recommendation && (
                <div style={{ marginTop: 8, marginLeft: 40, maxWidth: "80%", background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <FaStethoscope size={13} color="#0d9488" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: 0.5 }}>Рекомендация</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                    Специалист: {msg.recommendation.specialization}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>{msg.recommendation.summary}</p>
                  <button
                    onClick={() => router.push(`/doctors?spec=${encodeURIComponent(msg.recommendation!.specialization)}&symptoms=${encodeURIComponent(symptoms)}`)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    <FaSearch size={11} /> Найти врача
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FaHeartbeat size={13} color="#0d9488" />
            </div>
            <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Печатает</span>
              <span style={{ display: "flex", gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#0d9488", animation: `dot 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #f1f5f9", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите симптомы..."
            disabled={loading}
            rows={1}
            maxLength={1000}
            style={{ flex: 1, fontSize: 15, color: "#0f172a", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "11px 14px", outline: "none", resize: "none", maxHeight: 100, fontFamily: "inherit", lineHeight: 1.5 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{ width: 44, height: 44, borderRadius: "50%", background: input.trim() && !loading ? "#0d9488" : "#e2e8f0", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !loading ? "pointer" : "not-allowed", flexShrink: 0, transition: "background 0.2s" }}
          >
            <FaPaperPlane size={15} color={input.trim() && !loading ? "#fff" : "#94a3b8"} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

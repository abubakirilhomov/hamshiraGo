"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VoiceAssistant from "@/components/VoiceAssistant";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function VoiceAgentPage() {
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Голосовой ассистент</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0 }}>AI врач-консультант</p>
            </div>
            <div style={{ width: 36 }} />
          </div>
        </div>
        <svg viewBox="0 0 1440 36" xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", marginTop: -1, width: "100%" }}
          preserveAspectRatio="none">
          <path d="M0,36 C360,0 1080,0 1440,36 L1440,36 L0,36 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Info banner */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
          padding: "16px 18px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#f0fdfa",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, marginBottom: 2 }}>
              Как пользоваться
            </p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Опишите симптомы голосом. AI оценит жалобы и порекомендует — обратиться к врачу или вызвать медсестру.
            </p>
          </div>
        </div>

        <VoiceAssistant lang={language as "ru" | "uz"} onClose={() => router.push("/")} />
      </div>
    </div>
  );
}

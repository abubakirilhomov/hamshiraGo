"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useLanguage } from "@/context/LanguageContext";

export default function VoiceAgentPage() {
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth");
  }, [router]);

  return (
    <>
      <style>{`
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 32px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
              </button>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>Голосовой ассистент</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0 }}>AI врач-консультант</p>
              </div>
              <div style={{ width: 38 }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 520, margin: "-16px auto 0", padding: "0 20px 60px" }}>
          {/* Info banner */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#00685f" }}>info</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#191c1e", margin: "0 0 2px", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Как пользоваться
              </p>
              <p style={{ fontSize: 12, color: "#6d7a77", margin: 0, lineHeight: 1.5 }}>
                Опишите симптомы голосом. AI оценит жалобы и порекомендует — обратиться к врачу или вызвать медсестру.
              </p>
            </div>
          </div>

          <VoiceAssistant lang={language as "ru" | "uz"} onClose={() => router.push("/")} />
        </div>
      </div>
    </>
  );
}

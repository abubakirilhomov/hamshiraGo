"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);

  const SLIDES = [
    { icon: "stethoscope", color: "#00685f", bg: "#c2ebe3", title: t("onboarding.slide1title"), desc: t("onboarding.slide1desc") },
    { icon: "location_on", color: "#0284c7", bg: "#dbeafe", title: t("onboarding.slide2title"), desc: t("onboarding.slide2desc") },
    { icon: "star", color: "#d97706", bg: "#fef3c7", title: t("onboarding.slide3title"), desc: t("onboarding.slide3desc") },
  ];

  function finish() {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/auth");
  }

  function next() {
    if (current < SLIDES.length - 1) setCurrent((c) => c + 1);
    else finish();
  }

  const slide = SLIDES[current];

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateX(28px); } to { opacity:1; transform:translateX(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", flexDirection: "column" }}>

        {/* Skip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>HamshiraGo</span>
          <button onClick={finish} style={{ display: "flex", alignItems: "center", gap: 5, background: "#f2f4f6", border: "none", color: "#6d7a77", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "7px 14px", borderRadius: 999 }}>
            <span className="mat-icon" style={{ fontSize: 14 }}>close</span>
            {t("onboarding.skip")}
          </button>
        </div>

        {/* Slide */}
        <div key={current} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center", animation: "fadeSlide 0.35s ease" }}>
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: slide.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36, boxShadow: `0 8px 30px ${slide.color}25` }}>
            <span className="mat-icon" style={{ fontSize: 58, color: slide.color, fontVariationSettings: "'FILL' 1" }}>{slide.icon}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 14, letterSpacing: "-0.4px" }}>
            {slide.title}
          </h1>
          <p style={{ fontSize: 16, color: "#6d7a77", lineHeight: 1.7, maxWidth: 320 }}>{slide.desc}</p>
        </div>

        {/* Bottom */}
        <div style={{ padding: "0 24px 52px" }}>
          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{
                height: 8, borderRadius: 999,
                width: i === current ? 28 : 8,
                background: i === current ? "#00685f" : "#eceef0",
                transition: "width 300ms ease, background 300ms ease",
              }} />
            ))}
          </div>

          <button onClick={next} style={{
            width: "100%", background: "linear-gradient(135deg,#00685f,#008378)",
            color: "#fff", border: "none", borderRadius: 18, padding: "17px",
            fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 6px 20px rgba(0,104,95,0.28)",
          }}>
            {current < SLIDES.length - 1 ? t("onboarding.next") : t("onboarding.start")}
            <span className="mat-icon" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
}

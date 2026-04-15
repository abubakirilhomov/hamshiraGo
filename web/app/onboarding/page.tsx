"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);

  const SLIDES = [
    {
      icon: "medical_services",
      color: "#00685f",
      bg: "#c2ebe3",
      title: t("onboarding.slide1title") || "Медсестра на дом",
      desc: t("onboarding.slide1desc") || "Вызовите медсестру на дом за 15–30 минут. Уколы, капельницы, перевязки и другие медицинские процедуры.",
      steps: ["Уколы и инъекции", "Капельницы", "Измерение давления", "Перевязки"],
    },
    {
      icon: "touch_app",
      color: "#0284c7",
      bg: "#dbeafe",
      title: t("onboarding.slide2title") || "Как сделать заказ",
      desc: t("onboarding.slide2desc") || "Выберите услугу, укажите адрес и время — медсестра приедет к вам.",
      steps: ["Выберите услугу", "Укажите адрес", "Подтвердите заказ", "Ждите медсестру"],
    },
    {
      icon: "location_on",
      color: "#7c3aed",
      bg: "#ede9fe",
      title: "Отслеживайте в реальном времени",
      desc: "Следите за статусом заказа и местоположением медсестры прямо в приложении.",
      steps: ["Заказ принят", "Медик в пути", "Медик прибыл", "Услуга оказана"],
    },
    {
      icon: "verified_user",
      color: "#d97706",
      bg: "#fef3c7",
      title: t("onboarding.slide3title") || "Безопасность и доверие",
      desc: t("onboarding.slide3desc") || "Все медсестры проходят верификацию. Оценивайте работу после каждого визита.",
      steps: ["Верифицированные медики", "Страховка", "Рейтинг и отзывы", "Поддержка 24/7"],
    },
  ];

  function finish() {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/");
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
        <div key={current} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center", animation: "fadeSlide 0.35s ease" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: slide.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: `0 8px 30px ${slide.color}25` }}>
            <span className="mat-icon" style={{ fontSize: 54, color: slide.color, fontVariationSettings: "'FILL' 1" }}>{slide.icon}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12, letterSpacing: "-0.4px" }}>
            {slide.title}
          </h1>
          <p style={{ fontSize: 15, color: "#6d7a77", lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>{slide.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 320 }}>
            {slide.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: slide.bg, borderRadius: 20, padding: "7px 12px" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: slide.color, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: slide.color }}>{step}</span>
              </div>
            ))}
          </div>
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

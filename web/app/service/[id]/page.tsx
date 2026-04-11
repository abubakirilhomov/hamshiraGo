"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTelegramBackButton, useHaptic } from "@/hooks/useTelegram";
import { api, Service, formatPrice } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  "Уколы":      "vaccines",
  "Капельницы": "water_drop",
  "Измерения":  "monitor_heart",
  "Анализы":    "biotech",
  "Перевязки":  "healing",
  "Уход":       "personal_injury",
};

export default function ServicePage() {
  const router = useRouter();
  const { impact } = useHaptic();
  useTelegramBackButton(() => router.back());
  const { id } = useParams<{ id: string }>();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.services.get(id)
      .then(setService)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6d7a77", fontSize: 14, fontWeight: 500 }}>Загружаем...</p>
        </div>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <span className="mat-icon" style={{ fontSize: 52, color: "#bcc9c6", marginBottom: 16 }}>search_off</span>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#191c1e", marginBottom: 20 }}>Услуга не найдена</p>
        <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          На главную
        </button>
      </div>
    );
  }

  const iconName = CATEGORY_ICONS[service.category] ?? "medical_services";

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", padding: "20px 20px 60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "3px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 38, color: "#fff", fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.4px", marginBottom: 8 }}>
                {service.title}
              </h1>
              <span style={{ display: "inline-block", background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 16px", fontSize: 14, fontWeight: 700, color: "#fff", backdropFilter: "blur(4px)" }}>
                {service.category}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 720, margin: "-28px auto 0", padding: "0 16px 48px" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>

            {/* Price row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f9fb", borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>payments</span>
                </div>
                <span style={{ fontSize: 14, color: "#6d7a77", fontWeight: 500 }}>Стоимость</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {formatPrice(service.price)} UZS
              </span>
            </div>

            {/* Duration */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,104,95,0.07)", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#00685f" }}>schedule</span>
              <span style={{ fontSize: 14, color: "#00685f", fontWeight: 600 }}>
                Время процедуры: ~{service.durationMinutes} мин
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: 15, color: "#3d4947", lineHeight: 1.7, marginBottom: 28 }}>
              {service.description}
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "#f2f4f6", marginBottom: 20 }} />

            {/* Trust points */}
            {[
              { icon: "verified_user", text: "Проверенные медики с опытом работы" },
              { icon: "schedule", text: "Выезд медика в течение 30–60 минут" },
              { icon: "star", text: "Оценка качества после каждого визита" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="mat-icon" style={{ fontSize: 16, color: "#00685f" }}>{icon}</span>
                </div>
                <span style={{ fontSize: 13, color: "#6d7a77", fontWeight: 500 }}>{text}</span>
              </div>
            ))}

            {/* CTA */}
            <button
              onClick={() => {
                impact("medium");
                router.push(`/order/location?service=${service.id}&title=${encodeURIComponent(service.title)}&price=${service.price}`);
              }}
              style={{
                width: "100%", background: "linear-gradient(135deg,#00685f,#008378)",
                color: "#fff", fontSize: 17, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                borderRadius: 16, padding: "17px 24px",
                border: "none", cursor: "pointer", marginTop: 20,
                boxShadow: "0 6px 20px rgba(0,104,95,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "opacity 150ms",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <span className="mat-icon" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Заказать услугу
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

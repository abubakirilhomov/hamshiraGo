import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HamshiraGo — Медик на дому";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isUz = lang === "uz";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: "linear-gradient(135deg, #0c2338 0%, #040c18 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)", borderRadius: "50%" }} />

        {/* Logo badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #0d9488, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            🏥
          </div>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>HamshiraGo</span>
        </div>

        {/* Main headline */}
        <div style={{ fontSize: 62, fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.1, marginBottom: 20, maxWidth: 900 }}>
          {isUz ? "Uyda hamshira" : "Медик на дому"}
          <span style={{ color: "#0d9488", display: "block" }}>
            {isUz ? "30 daqiqada 🚀" : "за 30 минут 🚀"}
          </span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 800 }}>
          {isUz
            ? "In'ektsiya · Tomchi · Qon bosimi · 24/7 · Toshkent"
            : "Укол · Капельница · Давление · 24/7 · Ташкент"}
        </div>

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          {[
            isUz ? "✓ Tasdiqlangan hamshiralar" : "✓ Верифицированные медики",
            isUz ? "⭐ 4.8 reyting" : "⭐ 4.8 рейтинг",
            isUz ? "🕐 24/7" : "🕐 24/7",
          ].map((badge) => (
            <div key={badge} style={{ background: "rgba(13,148,136,0.2)", border: "1px solid rgba(13,148,136,0.4)", borderRadius: 100, padding: "10px 22px", color: "#5eead4", fontSize: 20, fontWeight: 600 }}>
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

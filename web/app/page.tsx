"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, Service, formatPrice, checkNps } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_ICONS: Record<string, string> = {
  "Уколы": "vaccines", "Инъекции": "vaccines",
  "Капельницы": "bloodtype", "Измерения": "monitor_heart",
  "Анализы": "biotech", "Перевязки": "healing", "Уход": "favorite",
};
const DEFAULT_ICON = "medical_services";

const CATEGORY_UZ: Record<string, string> = {
  "Уколы": "In'ektsiyalar", "Инъекции": "In'ektsiyalar",
  "Капельницы": "Tomchilar", "Измерения": "O'lchashlar",
  "Анализы": "Tahlillar", "Перевязки": "Bog'lamlar", "Уход": "Parvarish",
};

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  function loadServices() {
    setLoading(true);
    setError("");
    api.services.list()
      .then((data) => setServices(data.filter((s) => s.isActive)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t("home.errorLoad")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as { name?: string | null; phone?: string };
        const initials = u.name
          ? u.name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
          : (u.phone ?? "").slice(-2);
        setUserInitials(initials);
      }
    } catch { /* ignore */ }
    loadServices();
    try {
      if (!sessionStorage.getItem("nps_shown")) {
        checkNps().then((res) => { if (res.shouldShow) router.push("/nps"); }).catch(() => {});
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const q = search.trim().toLowerCase();
  const categories = [...new Set(services.map((s) => s.category))].sort((a, b) => a.localeCompare(b, "ru"));
  const filteredServices = services.filter((s) => {
    const matchSearch = !q || s.title.toLowerCase().includes(q) || (s.titleUz ?? "").toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    const matchCategory = !selectedCategory || s.category === selectedCategory;
    return matchSearch && matchCategory;
  });
  const grouped = filteredServices.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s); return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb", fontFamily: "Inter, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      <style>{`
        .mat-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: 400;
          line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block;
          white-space: nowrap; word-wrap: normal; -webkit-font-smoothing: antialiased; }
        .svc-card { transition: box-shadow 200ms ease, transform 200ms ease; }
        .svc-card:hover { box-shadow: 0 8px 32px rgba(0,104,95,0.12) !important; transform: translateY(-2px); }
        .cat-chip { transition: all 150ms ease; }
        .cat-chip:hover { opacity: 0.85; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 300ms ease forwards; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 0 rgba(0,104,95,0.08)",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "#00685f", letterSpacing: "-0.3px" }}>
            HamshiraGo
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Language */}
            <div style={{ display: "flex", gap: 2, background: "#f2f4f6", borderRadius: 10, padding: 3 }}>
              {(["ru", "uz"] as const).map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)} style={{
                  padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: language === lang ? "#fff" : "transparent",
                  color: language === lang ? "#00685f" : "#6d7a77",
                  fontSize: 12, fontWeight: 700,
                  boxShadow: language === lang ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 150ms",
                }}>{lang.toUpperCase()}</button>
              ))}
            </div>
            {/* Orders */}
            <button onClick={() => router.push("/orders")} style={{
              background: "#f2f4f6", border: "none", borderRadius: 10,
              padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              color: "#3d4947", fontSize: 13, fontWeight: 600,
            }}>
              <span className="mat-icon" style={{ fontSize: 16 }}>receipt_long</span>
              <span>Заказы</span>
            </button>
            {/* Avatar */}
            <button onClick={() => router.push("/profile")} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,#00685f,#008378)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 13, fontWeight: 800,
              boxShadow: "0 2px 8px rgba(0,104,95,0.25)",
            }}>
              {userInitials || <span className="mat-icon" style={{ fontSize: 16 }}>person</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "40px 20px 80px" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #00685f 0%, #008378 60%, #6bd8cb 100%)",
          zIndex: 0,
        }} />
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(137,245,231,0.15)", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(137,245,231,0.9)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            Медицинская помощь на дому
          </p>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(28px,6vw,48px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
            {t("home.headline")}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, maxWidth: 440, marginBottom: 28 }}>
            {t("home.subheadline")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/voice-agent")} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#00685f",
              border: "none", borderRadius: 12, padding: "13px 22px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              transition: "transform 150ms",
            }}>
              <span className="mat-icon" style={{ fontSize: 18 }}>mic</span>
              Записаться сейчас
            </button>
            <button onClick={() => router.push("/salomat")} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 12, padding: "13px 22px",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              backdropFilter: "blur(8px)", transition: "transform 150ms",
            }}>
              <span className="mat-icon" style={{ fontSize: 18 }}>smart_toy</span>
              Salomat AI
            </button>
          </div>
        </div>
      </section>

      {/* ── Search floating ── */}
      <div style={{ maxWidth: 720, margin: "-32px auto 0", padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,104,95,0.12)",
          display: "flex", alignItems: "center", padding: "6px 6px 6px 18px", gap: 8,
        }}>
          <span className="mat-icon" style={{ fontSize: 20, color: "#00685f" }}>search</span>
          <input
            type="search" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("home.search")}
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 15, color: "#191c1e",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "#f2f4f6", border: "none", borderRadius: 8, width: 28, height: 28,
              cursor: "pointer", color: "#6d7a77", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          )}
          <button style={{
            background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff",
            border: "none", borderRadius: 12, padding: "10px 18px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>Найти</button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* Category chips */}
        {!loading && categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 28, scrollbarWidth: "none" }}>
            <button className="cat-chip" onClick={() => setSelectedCategory(null)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "none",
              background: selectedCategory === null ? "#00685f" : "#f2f4f6",
              color: selectedCategory === null ? "#fff" : "#3d4947",
              boxShadow: selectedCategory === null ? "0 2px 8px rgba(0,104,95,0.2)" : "none",
            }}>
              <span className="mat-icon" style={{ fontSize: 16 }}>grid_view</span>
              {t("home.allCategories")}
            </button>
            {categories.map((cat) => (
              <button key={cat} className="cat-chip" onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "none",
                background: selectedCategory === cat ? "#00685f" : "#f2f4f6",
                color: selectedCategory === cat ? "#fff" : "#3d4947",
                boxShadow: selectedCategory === cat ? "0 2px 8px rgba(0,104,95,0.2)" : "none",
              }}>
                <span className="mat-icon" style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat] ?? DEFAULT_ICON}</span>
                {language === "uz" ? (CATEGORY_UZ[cat] ?? cat) : cat}
              </button>
            ))}
          </div>
        )}

        {/* AI banners */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <button onClick={() => router.push("/voice-agent")} style={{
            background: "linear-gradient(135deg,#00685f,#008378)",
            border: "none", borderRadius: 20, padding: "18px 16px", cursor: "pointer", textAlign: "left",
            boxShadow: "0 4px 20px rgba(0,104,95,0.2)",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "#fff" }}>mic</span>
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Голосовой ассистент</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>Опишите симптомы голосом</p>
          </button>
          <button onClick={() => router.push("/salomat")} style={{
            background: "#fff", border: "none", borderRadius: 20, padding: "18px 16px", cursor: "pointer", textAlign: "left",
            boxShadow: "0 4px 20px rgba(0,104,95,0.06)",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "#00685f" }}>smart_toy</span>
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#191c1e", marginBottom: 4 }}>Salomat AI</p>
            <p style={{ fontSize: 11, color: "#6d7a77", lineHeight: 1.4 }}>AI подберёт специалиста</p>
          </button>
        </div>

        {/* Services */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#6d7a77" }}>{t("home.loadingServices")}</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 15, color: "#ef4444", marginBottom: 16 }}>{error}</p>
            <button onClick={loadServices} style={{ background: "#00685f", color: "#fff", border: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {t("home.tryAgain")}
            </button>
          </div>
        ) : filteredServices.length === 0 && q ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <span className="mat-icon" style={{ fontSize: 48, color: "#bcc9c6", display: "block", marginBottom: 12 }}>search_off</span>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "#191c1e", marginBottom: 6 }}>{t("home.notFound")}</p>
            <p style={{ fontSize: 14, color: "#6d7a77" }}>{t("home.tryOtherSearch")}</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b, "ru"))
            .map(([category, items], groupIdx) => (
              <div key={category} className="fade-up" style={{ marginBottom: 32, animationDelay: `${groupIdx * 40}ms` }}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>{CATEGORY_ICONS[category] ?? DEFAULT_ICON}</span>
                    </div>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: "#191c1e" }}>
                      {language === "uz" ? (items[0]?.categoryUz ?? CATEGORY_UZ[category] ?? category) : category}
                    </h2>
                  </div>
                  <span style={{ fontSize: 12, color: "#6d7a77", fontWeight: 500 }}>{items.length} услуг</span>
                </div>

                {/* Cards grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 12 }}>
                  {items.sort((a, b) => a.sortOrder - b.sortOrder).map((service) => (
                    <button
                      key={service.id}
                      className="svc-card"
                      onClick={() => router.push(`/service/${service.id}`)}
                      style={{
                        background: "#fff", borderRadius: 20, padding: "18px",
                        boxShadow: "0 2px 12px rgba(0,104,95,0.06)",
                        border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                        display: "flex", flexDirection: "column", gap: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="mat-icon" style={{ fontSize: 26, color: "#00685f" }}>{CATEGORY_ICONS[category] ?? DEFAULT_ICON}</span>
                        </div>
                        <span className="mat-icon" style={{ fontSize: 18, color: "#bcc9c6" }}>arrow_forward</span>
                      </div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#191c1e", marginBottom: 4, lineHeight: 1.3 }}>
                        {language === "uz" ? (service.titleUz ?? service.title) : service.title}
                      </p>
                      <p style={{ fontSize: 12, color: "#6d7a77", lineHeight: 1.5, marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                        {language === "uz" ? (service.descriptionUz ?? service.description) : service.description}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {formatPrice(service.price)} UZS
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}

        {/* Trust section */}
        {!loading && !error && (
          <div style={{ background: "#f2f4f6", borderRadius: 28, padding: "28px 24px", marginTop: 8 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: "#191c1e", marginBottom: 20 }}>
              Почему доверяют HamshiraGo?
            </h3>
            {[
              { icon: "verified_user", title: "Только проверенный персонал", sub: "Все медсестры проходят многоэтапную проверку квалификации" },
              { icon: "schedule", title: "Оперативность", sub: "Среднее время прибытия — 45 минут после подтверждения заказа" },
              { icon: "payments", title: "Прозрачные цены", sub: "Никаких скрытых платежей. Вы платите ровно столько, сколько указано" },
            ].map((item) => (
              <div key={item.icon} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,104,95,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="mat-icon" style={{ fontSize: 20, color: "#00685f" }}>{item.icon}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#191c1e", marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: "#6d7a77", lineHeight: 1.5 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 -4px 20px rgba(0,104,95,0.08)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 max(10px, env(safe-area-inset-bottom))",
      }}>
        {[
          { icon: "home", label: "Главная", path: "/" },
          { icon: "receipt_long", label: "Заказы", path: "/orders" },
          { icon: "smart_toy", label: "AI", path: "/salomat" },
          { icon: "person", label: "Профиль", path: "/profile" },
        ].map((item) => {
          const isActive = pathname === item.path;
          return (
            <button key={item.path} onClick={() => router.push(item.path)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: isActive ? "#c2ebe3" : "transparent", border: "none", cursor: "pointer",
              padding: "8px 16px", borderRadius: 14,
              color: isActive ? "#00685f" : "#6d7a77",
            }}>
              <span className="mat-icon" style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

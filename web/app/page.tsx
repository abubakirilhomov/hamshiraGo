"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaMedkit, FaTint, FaHeartbeat, FaChevronRight,
  FaSignOutAlt, FaListAlt, FaSyringe, FaThermometerHalf,
  FaFlask, FaBandAid,
} from "react-icons/fa";
import { api, Service, formatPrice, checkNps } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_META: Record<string, { icon: React.ElementType }> = {
  "Уколы":      { icon: FaSyringe        },
  "Инъекции":   { icon: FaSyringe        },
  "Капельницы": { icon: FaTint           },
  "Измерения":  { icon: FaThermometerHalf},
  "Анализы":    { icon: FaFlask          },
  "Перевязки":  { icon: FaBandAid        },
  "Уход":       { icon: FaHeartbeat      },
};

const CATEGORY_UZ: Record<string, string> = {
  "Уколы":      "In'ektsiyalar",
  "Инъекции":   "In'ektsiyalar",
  "Капельницы": "Tomchilar",
  "Измерения":  "O'lchashlar",
  "Анализы":    "Tahlillar",
  "Перевязки":  "Bog'lamlar",
  "Уход":       "Parvarish",
};

const TEAL = { color: "#0d9488", bg: "#f0fdfa" };
const DEFAULT_META = { icon: FaMedkit };

export default function HomePage() {
  const router = useRouter();
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
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("home.errorLoad"));
      })
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
    // NPS auto-check — once per session
    try {
      if (!sessionStorage.getItem("nps_shown")) {
        checkNps().then((res) => {
          if (res.shouldShow) router.push("/nps");
        }).catch(() => {});
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const q = search.trim().toLowerCase();
  const categories = [...new Set(services.map((s) => s.category))].sort((a, b) => a.localeCompare(b, "ru"));
  const filteredServices = services.filter((s) => {
    const matchSearch = !q ||
      s.title.toLowerCase().includes(q) ||
      (s.titleUz ?? "").toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q) ||
      (s.descriptionUz ?? "").toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);
    const matchCategory = !selectedCategory || s.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const grouped = filteredServices.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        .page-wrap { max-width: 680px; margin: 0 auto; width: 100%; }
        .hero-wrap { max-width: 680px; margin: 0 auto; padding: 20px 20px 0; }
        .services-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 540px) { .services-grid { grid-template-columns: 1fr 1fr; } }
        .svc-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09) !important; transform: translateY(-1px); }
        .svc-card { transition: box-shadow 150ms ease, transform 150ms ease; }
        .header-brand-text { display: inline; }
        .header-orders-text { display: inline; }
        @media (max-width: 420px) {
          .header-brand-text { display: none; }
          .header-orders-text { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", paddingBottom: 28, position: "relative" }}>
        <div className="hero-wrap">
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logo.png" alt="HamshiraGo" style={{ width: 35, height: 35, borderRadius: 10, objectFit: "cover" }} />
              <span className="header-brand-text" style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>HamshiraGo</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Language switcher */}
              <div style={{ display: "flex", gap: 4 }}>
                {(["ru", "uz"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: `1px solid ${language === lang ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}`,
                      background: language === lang ? "rgba(255,255,255,0.25)" : "transparent",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => router.push("/orders")}
                style={{
                  background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 10, padding: "7px 14px",
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <FaListAlt size={12} /> <span className="header-orders-text">{t("home.myOrders")}</span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                title="Profile"
                style={{
                  background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)",
                  borderRadius: "50%", width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                  fontSize: 13, fontWeight: 800,
                }}
              >
                {userInitials || <FaSignOutAlt size={14} />}
              </button>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 6 }}>
            {t("home.headline")}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.82)" }}>
            {t("home.subheadline")}
          </p>
        </div>

        <svg viewBox="0 0 1440 36" xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", position: "absolute", bottom: -1, left: 0, width: "100%" }}
          preserveAspectRatio="none">
          <path d="M0,36 C360,0 1080,0 1440,36 L1440,36 L0,36 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* Content */}
      <div className="page-wrap" style={{ padding: "20px 20px 60px" }}>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("home.search")}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "12px 14px 12px 42px",
              background: "#fff", border: "1.5px solid #e2e8f0",
              borderRadius: 14, fontSize: 15, color: "#0f172a",
              outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: 4,
              }}
            >×</button>
          )}
        </div>

        {/* Category filter chips */}
        {!loading && categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: selectedCategory === null ? "none" : "1px solid #e2e8f0",
                background: selectedCategory === null ? "#0d9488" : "#fff",
                color: selectedCategory === null ? "#fff" : "#64748b",
              }}
            >{t("home.allCategories")}</button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  border: selectedCategory === cat ? "none" : "1px solid #e2e8f0",
                  background: selectedCategory === cat ? "#0d9488" : "#fff",
                  color: selectedCategory === cat ? "#fff" : "#64748b",
                }}
              >{language === "uz" ? (CATEGORY_UZ[cat] ?? cat) : cat}</button>
            ))}
          </div>
        )}

        {/* Discount banner */}
        <div style={{
          background: "linear-gradient(135deg, #fef3c7, #fef9ec)",
          border: "1px solid #fde68a",
          borderRadius: 14, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 1 }}>{t("home.discountBanner")}</p>
            <p style={{ fontSize: 12, color: "#b45309" }}>{t("home.discountBannerSub")}</p>
          </div>
        </div>

        {/* Services */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "3px solid #e2e8f0", borderTopColor: "#0d9488",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            <p style={{ fontSize: 14, color: "#94a3b8" }}>{t("home.loadingServices")}</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 15, color: "#ef4444", marginBottom: 16 }}>{error}</p>
            <button
              onClick={loadServices}
              style={{
                background: "#0d9488", color: "#fff", border: "none",
                borderRadius: 12, padding: "11px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              {t("home.tryAgain")}
            </button>
          </div>
        ) : filteredServices.length === 0 && q ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{t("home.notFound")}</p>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>{t("home.tryOtherSearch")}</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b, "ru"))
            .map(([category, items]) => {
              const Icon = (CATEGORY_META[category] ?? DEFAULT_META).icon;
              return (
                <div key={category} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: TEAL.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} color={TEAL.color} />
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.2px" }}>
                      {language === "uz" ? (items[0]?.categoryUz ?? CATEGORY_UZ[category] ?? category) : category}
                    </h2>
                  </div>

                  <div className="services-grid">
                    {items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((service) => (
                        <button
                          key={service.id}
                          className="svc-card"
                          onClick={() => router.push(`/service/${service.id}`)}
                          style={{
                            background: "#fff", borderRadius: 14,
                            padding: "14px 14px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            border: "1px solid #f1f5f9",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 12,
                            textAlign: "left", width: "100%",
                          }}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: TEAL.bg, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon size={20} color={TEAL.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                              {language === "uz" ? (service.titleUz ?? service.title) : service.title}
                            </p>
                            <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {language === "uz" ? (service.descriptionUz ?? service.description) : service.description}
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: TEAL.color }}>
                              {formatPrice(service.price)} UZS
                            </p>
                          </div>
                          <FaChevronRight size={11} color="#cbd5e1" style={{ flexShrink: 0 }} />
                        </button>
                      ))}
                  </div>
                </div>
              );
            })
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

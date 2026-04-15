"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, Building2, MapPin, Star, ChevronRight } from "lucide-react";

// Mock clinic data — will be replaced with real API when public endpoint is available
const MOCK_CLINICS = [
  {
    id: "clinic-1",
    name: "Медцентр «Здоровье»",
    address: "ул. Амира Темура 22, Ташкент",
    specializations: ["Терапия", "Кардиология", "Неврология"],
    rating: 4.8,
    reviewCount: 124,
    logoUrl: null as string | null,
    doctorsCount: 12,
  },
  {
    id: "clinic-2",
    name: "Клиника «Омина»",
    address: "ул. Навои 5, Ташкент",
    specializations: ["Педиатрия", "Гинекология", "УЗИ"],
    rating: 4.6,
    reviewCount: 87,
    logoUrl: null as string | null,
    doctorsCount: 8,
  },
  {
    id: "clinic-3",
    name: "МедПлюс",
    address: "пр. Мустакиллик 40, Ташкент",
    specializations: ["Хирургия", "Ортопедия", "Урология"],
    rating: 4.7,
    reviewCount: 63,
    logoUrl: null as string | null,
    doctorsCount: 15,
  },
  {
    id: "clinic-4",
    name: "Центральная клиника",
    address: "ул. Шота Руставели 3, Ташкент",
    specializations: ["Терапия", "Дерматология", "Офтальмология"],
    rating: 4.5,
    reviewCount: 210,
    logoUrl: null as string | null,
    doctorsCount: 20,
  },
  {
    id: "clinic-5",
    name: "Детский медцентр «Нафосат»",
    address: "ул. Бунёдкор 18, Ташкент",
    specializations: ["Педиатрия", "Детская неврология", "Логопедия"],
    rating: 4.9,
    reviewCount: 340,
    logoUrl: null as string | null,
    doctorsCount: 18,
  },
];

const AVATAR_COLORS = [
  { bg: "#f0fdfa", color: "#0d9488" },
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#faf5ff", color: "#9333ea" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#f0fdf4", color: "#16a34a" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Star size={13} color="#f59e0b" fill="#f59e0b" />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ClinicsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CLINICS;
    const q = search.toLowerCase();
    return MOCK_CLINICS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488, #0f766e)",
        padding: "24px 20px 32px",
      }}>
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{t("clinics.title")}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 20px" }}>{t("clinics.subtitle")}</p>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              style={{
                width: "100%", padding: "12px 12px 12px 42px", borderRadius: 12,
                border: "none", fontSize: 14, color: "#0f172a",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(15,23,42,0.1)",
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("clinics.searchPlaceholder")}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "24px 16px" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
          Найдено: {filtered.length} клиник{filtered.length !== MOCK_CLINICS.length && ` из ${MOCK_CLINICS.length}`}
        </p>

        {filtered.length === 0 ? (
          <div style={{ ...card, padding: 60, textAlign: "center" }}>
            <Building2 size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>{t("clinics.notFound")}</p>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>{t("clinics.tryChange")}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((clinic, idx) => {
              const c = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <button
                  key={clinic.id}
                  onClick={() => router.push(`/clinics/${clinic.id}`)}
                  style={{
                    ...card, padding: 0, textAlign: "left", width: "100%", cursor: "pointer",
                    border: "1px solid #f1f5f9", overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    {clinic.logoUrl ? (
                      <img
                        src={clinic.logoUrl}
                        alt={clinic.name}
                        style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                        background: c.bg, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 800, color: c.color,
                      }}>
                        {clinic.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {clinic.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <StarRating rating={clinic.rating} />
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>({clinic.reviewCount})</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                        <MapPin size={12} color="#94a3b8" />
                        <span style={{ fontSize: 12, color: "#64748b" }}>{clinic.address}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {clinic.specializations.slice(0, 3).map((spec) => (
                          <span key={spec} style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                            background: c.bg, color: c.color,
                          }}>
                            {spec}
                          </span>
                        ))}
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#f8fafc", color: "#94a3b8" }}>
                          {clinic.doctorsCount} {t("clinics.doctorsWord")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

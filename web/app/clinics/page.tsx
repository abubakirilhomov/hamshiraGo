"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, MapPin, Phone, X, Users } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface PublicClinic {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  phone: string;
  specializations: string[];
  doctorsCount: number;
}

const AVATAR_COLORS = [
  { bg: "linear-gradient(135deg, #0d9488, #0f766e)", color: "#fff" },
  { bg: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff" },
  { bg: "linear-gradient(135deg, #9333ea, #7e22ce)", color: "#fff" },
  { bg: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff" },
  { bg: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff" },
];

const SPEC_COLORS = [
  { bg: "#f0fdfa", color: "#0d9488" },
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#faf5ff", color: "#9333ea" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#f0fdf4", color: "#16a34a" },
];

export default function ClinicsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [clinics, setClinics] = useState<PublicClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/companies`)
      .then((r) => {
        if (!r.ok) throw new Error("Ошибка загрузки клиник");
        return r.json();
      })
      .then((data: PublicClinic[]) => {
        if (!cancelled) setClinics(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clinics;
    const q = search.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q)),
    );
  }, [search, clinics]);

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdfa", paddingBottom: 48, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
        padding: "32px 20px 56px",
      }}>
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", borderRadius: 99,
            padding: "4px 12px", marginBottom: 14,
          }}>
            <Building2 size={13} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {loading ? "Загрузка..." : `${clinics.length} клиник доступно`}
            </span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px", lineHeight: 1.25 }}>
            Клиники HamshiraGo
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            Найдите подходящую клинику и запишитесь
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "0 16px" }}>

        {/* Floating search bar */}
        <div style={{
          position: "relative",
          marginTop: -24,
          marginBottom: 24,
        }}>
          <Search
            size={16}
            color={searchFocused ? "#0d9488" : "#94a3b8"}
            style={{
              position: "absolute", left: 16, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
              transition: "color 150ms ease",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Поиск по названию, адресу, специализации..."
            style={{
              width: "100%",
              padding: "15px 44px",
              borderRadius: 14,
              border: `1.5px solid ${searchFocused ? "#0d9488" : "#e2e8f0"}`,
              fontSize: 14,
              color: "#0f172a",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              background: "#fff",
              boxShadow: "0 4px 20px rgba(15,23,42,0.08)",
              transition: "border-color 150ms ease",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "#f1f5f9", border: "none", borderRadius: 99,
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0,
              }}
            >
              <X size={13} color="#64748b" />
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  height: 160,
                  background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            padding: "48px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Building2 size={24} color="#ef4444" />
            </div>
            <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>{error}</p>
            <button
              onClick={() => location.reload()}
              style={{
                background: "#f0fdfa", border: "1.5px solid #ccfbf1", borderRadius: 10,
                padding: "10px 20px", cursor: "pointer", color: "#0d9488",
                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                minHeight: 44,
              }}
            >
              Повторить
            </button>
          </div>
        ) : (
          <>
            {/* Result count */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>
                {search.trim()
                  ? `${filtered.length} из ${clinics.length} клиник`
                  : `${filtered.length} клиник`}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div style={{
                background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                padding: "56px 24px", textAlign: "center",
                animation: "fadeInUp 200ms ease",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, background: "#f0fdfa",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Building2 size={28} color="#0d9488" />
                </div>
                <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>Клиники не найдены</p>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>Попробуйте изменить поисковый запрос</p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      background: "#0d9488", border: "none", borderRadius: 10,
                      padding: "12px 24px", cursor: "pointer", color: "#fff",
                      fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                      minHeight: 44,
                    }}
                  >
                    Сбросить поиск
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
                {filtered.map((clinic, idx) => {
                  const av = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const sc = SPEC_COLORS[idx % SPEC_COLORS.length];
                  const isHovered = hoveredId === clinic.id;
                  return (
                    <div
                      key={clinic.id}
                      onClick={() => router.push(`/clinics/${clinic.id}`)}
                      onMouseEnter={() => setHoveredId(clinic.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: `1px solid ${isHovered ? "#ccfbf1" : "#e2e8f0"}`,
                        boxShadow: isHovered
                          ? "0 4px 12px rgba(13,148,136,0.12)"
                          : "0 1px 4px rgba(15,23,42,0.06)",
                        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                        transition: "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: `fadeInUp 200ms ease ${Math.min(idx * 40, 200)}ms both`,
                      }}
                    >
                      {/* Card top row */}
                      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                        {/* Avatar */}
                        {clinic.logoUrl ? (
                          <img
                            src={clinic.logoUrl}
                            alt={clinic.name}
                            style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                            background: av.bg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, fontWeight: 800, color: av.color,
                          }}>
                            {clinic.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Name + city */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 15, fontWeight: 700, color: "#0f172a",
                            margin: "0 0 4px", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {clinic.name}
                          </p>
                          {clinic.city && (
                            <span style={{
                              display: "inline-block",
                              fontSize: 11, fontWeight: 600, color: "#0d9488",
                              background: "#f0fdfa",
                              padding: "2px 8px", borderRadius: 99,
                              letterSpacing: "0.3px",
                            }}>
                              {clinic.city}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: address + phone */}
                      <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {clinic.address && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <span style={{
                              fontSize: 13, color: "#64748b",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {clinic.address}
                            </span>
                          </div>
                        )}
                        {clinic.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Phone size={13} color="#0d9488" style={{ flexShrink: 0 }} />
                            <a
                              href={`tel:${clinic.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontSize: 13, color: "#0d9488", fontWeight: 500, textDecoration: "none" }}
                            >
                              {clinic.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: "#f1f5f9", margin: "0 20px" }} />

                      {/* Bottom: specs + doctors + link */}
                      <div style={{
                        padding: "12px 20px",
                        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        flex: 1,
                      }}>
                        {clinic.specializations.slice(0, 3).map((spec) => (
                          <span key={spec} style={{
                            fontSize: 11, fontWeight: 600,
                            padding: "3px 9px", borderRadius: 99,
                            background: sc.bg, color: sc.color,
                            whiteSpace: "nowrap",
                          }}>
                            {spec}
                          </span>
                        ))}
                        {clinic.specializations.length > 3 && (
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            padding: "3px 9px", borderRadius: 99,
                            background: "#f8fafc", color: "#94a3b8",
                          }}>
                            +{clinic.specializations.length - 3}
                          </span>
                        )}

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                          {clinic.doctorsCount > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Users size={12} color="#94a3b8" />
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                                {clinic.doctorsCount}
                              </span>
                            </div>
                          )}
                          <span style={{
                            fontSize: 13, color: "#0d9488", fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}>
                            Подробнее →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

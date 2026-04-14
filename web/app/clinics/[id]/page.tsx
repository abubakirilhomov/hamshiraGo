"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Users, Stethoscope, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface ClinicDoctor {
  id: string;
  name: string;
  specialization?: string | null;
}

interface ClinicServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number | null;
}

interface PublicClinicDetail {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string;
  logoUrl: string | null;
  doctors: ClinicDoctor[];
  services: ClinicServiceItem[];
}

const DOCTOR_AVATAR_COLORS = [
  { bg: "#f0fdfa", color: "#0d9488" },
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#faf5ff", color: "#9333ea" },
  { bg: "#fff7ed", color: "#ea580c" },
];

const CATEGORY_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  CONSULTATION: { bg: "#f0fdfa", color: "#0d9488", label: "Консультация" },
  LAB:          { bg: "#eff6ff", color: "#2563eb", label: "Лаборатория" },
  DIAGNOSTIC:   { bg: "#faf5ff", color: "#9333ea", label: "Диагностика" },
  PROCEDURE:    { bg: "#fff7ed", color: "#ea580c", label: "Процедуры" },
};

const shimmerKeyframes = `
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
`;

function SkeletonBlock({ w = "100%", h = 16, radius = 8, style = {} }: {
  w?: string | number; h?: number; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg, #e2e8f0 25%, #f0fdfa 50%, #e2e8f0 75%)",
      backgroundSize: "600px 100%",
      animation: "shimmer 1.4s infinite linear",
      flexShrink: 0,
      ...style,
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 88 }}>
      {/* Hero skeleton */}
      <div style={{
        background: "linear-gradient(135deg, #ccfbf1, #e0f2fe)",
        padding: "20px 20px 52px", height: 200,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        <div style={{ maxWidth: 720, margin: "auto", width: "100%" }}>
          <SkeletonBlock w={100} h={14} radius={6} style={{ marginBottom: 20, opacity: 0.5 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <SkeletonBlock w={72} h={72} radius={16} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonBlock w="60%" h={20} radius={8} />
              <SkeletonBlock w="40%" h={14} radius={6} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "0 16px" }}>
        {/* Info card skeleton */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(15,23,42,0.06)", padding: 20, marginTop: -20, marginBottom: 16,
        }}>
          <SkeletonBlock w={140} h={16} radius={6} />
        </div>

        {/* Stats skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(15,23,42,0.06)", padding: 20,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minHeight: 90,
            }}>
              <SkeletonBlock w={40} h={40} radius={99} />
              <SkeletonBlock w={48} h={22} radius={6} />
              <SkeletonBlock w={56} h={12} radius={4} />
            </div>
          ))}
        </div>

        {/* Content card skeleton */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(15,23,42,0.06)", padding: 20,
        }}>
          <SkeletonBlock w={100} h={18} radius={6} style={{ marginBottom: 20 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 16 : 0 }}>
              <SkeletonBlock w={52} h={52} radius={14} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <SkeletonBlock w="55%" h={14} radius={5} />
                <SkeletonBlock w="35%" h={12} radius={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClinicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [clinic, setClinic] = useState<PublicClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const CATEGORY_LABELS: Record<string, string> = {
    ALL: "Все",
    CONSULTATION: "Консультация",
    LAB: "Лаборатория",
    DIAGNOSTIC: "Диагностика",
    PROCEDURE: "Процедуры",
  };

  const availableCategories = useMemo(() => {
    if (!clinic) return [];
    const cats = Array.from(new Set(clinic.services.map((s) => s.category)));
    return ["ALL", ...cats.sort()];
  }, [clinic]);

  const filteredServices = useMemo(() => {
    if (!clinic) return [];
    if (activeCategory === "ALL") return clinic.services;
    return clinic.services.filter((s) => s.category === activeCategory);
  }, [clinic, activeCategory]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/companies/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("Клиника не найдена");
        if (!r.ok) throw new Error("Ошибка загрузки клиники");
        return r.json();
      })
      .then((data: PublicClinicDetail) => {
        if (!cancelled) setClinic(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
    padding: 20,
  };

  if (loading) {
    return (
      <>
        <style>{shimmerKeyframes}</style>
        <LoadingSkeleton />
      </>
    );
  }

  if (error || !clinic) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 16 }}>{error ?? "Клиника не найдена"}</p>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: 16, background: "#f1f5f9", border: "none", borderRadius: 10,
              padding: "10px 24px", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: 14,
            }}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  const cleanPhone = clinic.phone.replace(/\s/g, "");

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 88 }}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          padding: "20px 20px 48px",
        }}>
          <div style={{ maxWidth: 720, margin: "auto" }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 10,
                padding: "9px 14px",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 24,
                transition: "background 150ms ease",
              }}
            >
              <ArrowLeft size={15} /> Все клиники
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {clinic.logoUrl ? (
                <img
                  src={clinic.logoUrl}
                  alt={clinic.name}
                  style={{
                    width: 76, height: 76, borderRadius: 18, objectFit: "cover", flexShrink: 0,
                    border: "3px solid rgba(255,255,255,0.35)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                />
              ) : (
                <div style={{
                  width: 76, height: 76, borderRadius: 18, flexShrink: 0,
                  background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 800, color: "#fff",
                }}>
                  {clinic.name.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  fontSize: 22, fontWeight: 800, color: "#fff",
                  margin: "0 0 6px", lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {clinic.name}
                </h1>
                {(clinic.address || clinic.city) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={13} color="rgba(255,255,255,0.75)" />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                      {[clinic.address, clinic.city].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "auto", padding: "0 16px" }}>

          {/* Phone info card */}
          <div style={{ ...card, marginTop: -24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Phone size={16} color="#0d9488" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Телефон
                </p>
                <a
                  href={`tel:${cleanPhone}`}
                  style={{ fontSize: 15, color: "#0d9488", fontWeight: 700, textDecoration: "none" }}
                >
                  {clinic.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* Doctors stat */}
            <div style={{
              ...card, padding: 20, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: 90, gap: 6,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 99, flexShrink: 0,
                background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={18} color="#0d9488" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {clinic.doctors.length}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Врачей</div>
            </div>

            {/* Services stat */}
            <div style={{
              ...card, padding: 20, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: 90, gap: 6,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 99, flexShrink: 0,
                background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Stethoscope size={18} color="#9333ea" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {clinic.services.length}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Услуг</div>
            </div>
          </div>

          {/* Doctors */}
          {clinic.doctors.length > 0 && (
            <div style={{ ...card, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Врачи</h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {clinic.doctors.map((doc, idx) => {
                  const c = DOCTOR_AVATAR_COLORS[idx % DOCTOR_AVATAR_COLORS.length];
                  const isLast = idx === clinic.doctors.length - 1;
                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 0",
                        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: c.bg, color: c.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 800,
                      }}>
                        {doc.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>
                          {doc.name}
                        </p>
                        <p style={{
                          fontSize: 13, margin: 0, fontWeight: 500,
                          color: doc.specialization ? "#64748b" : "#cbd5e1",
                        }}>
                          {doc.specialization ?? "Специализация не указана"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services */}
          {clinic.services.length > 0 && (
            <div style={{ ...card, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Услуги и цены</h2>

              {/* Category filter tabs */}
              {availableCategories.length > 2 && (
                <div style={{
                  display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16,
                  overflowX: "auto", paddingBottom: 4,
                }}>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                        border: "1.5px solid",
                        cursor: "pointer", whiteSpace: "nowrap", minHeight: 36,
                        transition: "all 150ms ease",
                        background: activeCategory === cat ? "#0d9488" : "#fff",
                        color: activeCategory === cat ? "#fff" : "#64748b",
                        borderColor: activeCategory === cat ? "#0d9488" : "#e2e8f0",
                      }}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Service rows */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredServices.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    Нет услуг в этой категории
                  </div>
                ) : filteredServices.map((svc, idx) => {
                  const catMeta = CATEGORY_COLOR[svc.category];
                  const isLast = idx === filteredServices.length - 1;
                  return (
                    <div
                      key={svc.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 0",
                        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                      }}
                    >
                      {/* Category pill */}
                      {catMeta && (
                        <span style={{
                          display: "inline-block", flexShrink: 0,
                          background: catMeta.bg, color: catMeta.color,
                          fontSize: 11, fontWeight: 700, padding: "3px 9px",
                          borderRadius: 99, whiteSpace: "nowrap",
                          letterSpacing: "0.02em",
                        }}>
                          {catMeta.label}
                        </span>
                      )}

                      {/* Name + duration */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, color: "#0f172a",
                          margin: "0 0 2px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {svc.name}
                        </p>
                        {svc.durationMinutes != null && (
                          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontWeight: 500 }}>
                            {svc.durationMinutes} мин
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <span style={{
                        fontSize: 14, fontWeight: 800, color: "#0d9488",
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}>
                        {svc.price.toLocaleString("ru-RU")} сум
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Floating CTA — call clinic */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
          padding: "16px 20px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          zIndex: 20,
        }}>
          <div style={{ maxWidth: 720, margin: "auto" }}>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                color: "#fff", fontSize: 16, fontWeight: 800,
                textDecoration: "none", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(13,148,136,0.25)",
                transition: "opacity 150ms ease",
              }}
            >
              <Phone size={18} />
              Позвонить в клинику
            </a>
          </div>
        </div>

      </div>
    </>
  );
}

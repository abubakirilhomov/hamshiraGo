"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Clock, FileText, Heart, ChevronRight, ArrowLeft, Download } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";

interface Visit {
  id: string;
  date: string;
  time: string;
  status: string;
  companyName: string | null;
  doctorName: string | null;
  serviceName: string | null;
  notes: string | null;
}

interface Prescription {
  id: string;
  createdAt: string;
  content: string;
}

interface MeProfile {
  id: string;
  name: string | null;
  phone: string;
  createdAt?: string;
}

type Tab = "visits" | "prescriptions" | "medcard";

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ReactNode; color: string }> = {
  visits:        { label: "Визиты",   icon: <Clock size={15} />,     color: "#0d9488" },
  prescriptions: { label: "Рецепты",  icon: <FileText size={15} />,  color: "#9333ea" },
  medcard:       { label: "Медкарта", icon: <Heart size={15} />,     color: "#ef4444" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; accent: string; label: string }> = {
  DONE:        { bg: "#f0fdf4", color: "#16a34a", accent: "#16a34a", label: "Завершён" },
  CHECKED_IN:  { bg: "#eff6ff", color: "#2563eb", accent: "#2563eb", label: "Ожидает" },
  IN_PROGRESS: { bg: "#fff7ed", color: "#ea580c", accent: "#ea580c", label: "На приёме" },
  SCHEDULED:   { bg: "#f1f5f9", color: "#64748b", accent: "#94a3b8", label: "Запланирован" },
  CANCELLED:   { bg: "#fef2f2", color: "#ef4444", accent: "#ef4444", label: "Отменён" },
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateRu(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Skeleton shimmer ─────────────────────────────────────────────────── */
function Skeleton({ w, h, r = 8 }: { w?: string | number; h: number; r?: number }) {
  return (
    <div
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: r,
        background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        flexShrink: 0,
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
      {/* profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Skeleton w={64} h={64} r={99} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton w="55%" h={16} />
          <Skeleton w="38%" h={12} />
        </div>
      </div>
      {/* tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[100, 90, 100].map((w, i) => <Skeleton key={i} w={w} h={44} r={99} />)}
      </div>
      {/* cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} h={90} r={14} />)}
      </div>
    </>
  );
}

export default function PatientPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("visits");
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = authHeaders();
        if (!("Authorization" in headers)) {
          router.replace("/auth");
          return;
        }
        const [meR, visitsR, rxR] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, { headers }),
          fetch(`${API_BASE}/patient/visits`, { headers }),
          fetch(`${API_BASE}/patient/prescriptions`, { headers }),
        ]);
        if (meR.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth");
          return;
        }
        if (!meR.ok) throw new Error("Ошибка загрузки профиля");
        const me = await meR.json();
        const visitsData = visitsR.ok ? await visitsR.json() : [];
        const rxData = rxR.ok ? await rxR.json() : [];
        if (!cancelled) {
          setProfile(me);
          setVisits(visitsData);
          setPrescriptions(rxData);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const sinceYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 48 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .tab-bar { overflow-x: auto; display: flex; gap: 8px; scrollbar-width: none; }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-pill { transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease; }
        .tab-pill:hover { filter: brightness(0.97); }
        .rx-card:hover { border-color: #d8b4fe !important; box-shadow: 0 2px 8px rgba(147,51,234,0.10) !important; }
        .visit-card:hover { border-color: #cbd5e1 !important; box-shadow: 0 2px 8px rgba(15,23,42,0.08) !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
        padding: "20px 20px 48px",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={14} /> Назад
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <User size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              {profile?.name || "Пациент"}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "5px 0 0" }}>
              {profile?.phone || "+998 -- --- -- --"}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "3px 0 0" }}>
              Пациент с {sinceYear}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px", maxWidth: 720, margin: "0 auto" }}>

        {/* Quick stats — floated up over header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginTop: -28,
          marginBottom: 20,
        }}>
          {[
            { icon: <Clock size={18} color="#0d9488" />, value: visits.length, label: "Визитов" },
            { icon: <FileText size={18} color="#9333ea" />, value: prescriptions.length, label: "Рецептов" },
            { icon: <Heart size={18} color="#ef4444" />, value: 0, label: "Аллергий" },
          ].map(({ icon, value, label }) => (
            <div key={label} style={{ ...card, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                {loading ? "—" : value}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            ...card,
            padding: "12px 16px",
            marginBottom: 16,
            background: "#fef2f2",
            borderColor: "#fecaca",
          }}>
            <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* ── Tab bar ──────────────────────────────────────── */}
            <div className="tab-bar" style={{ marginBottom: 20 }}>
              {(Object.keys(TAB_CONFIG) as Tab[]).map((t) => {
                const cfg = TAB_CONFIG[t];
                const active = tab === t;
                return (
                  <button
                    key={t}
                    className="tab-pill"
                    onClick={() => setTab(t)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      height: 44,
                      padding: "0 20px",
                      borderRadius: 99,
                      border: active ? "none" : "1px solid #e2e8f0",
                      background: active ? cfg.color : "#fff",
                      color: active ? "#fff" : "#64748b",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      boxShadow: active
                        ? `0 2px 8px ${cfg.color}33`
                        : "0 1px 3px rgba(15,23,42,0.05)",
                    }}
                  >
                    <span style={{ color: active ? "#fff" : "#94a3b8", display: "flex" }}>
                      {cfg.icon}
                    </span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* ── Visits tab ───────────────────────────────────── */}
            {tab === "visits" && (
              <div>
                {visits.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button
                      onClick={() => window.open("/patient/visits/print", "_blank")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: "1px solid #0d9488",
                        background: "transparent",
                        color: "#0d9488",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={13} /> Скачать историю PDF
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {visits.length === 0 ? (
                    <div style={{ ...card, padding: "48px 24px", textAlign: "center" }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: "#f0fdfa",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 14px",
                      }}>
                        <Clock size={24} color="#0d9488" />
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>
                        Визитов пока нет
                      </p>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                        История ваших посещений клиник будет отображаться здесь
                      </p>
                    </div>
                  ) : (
                    visits.map((v) => {
                      const stt = STATUS_STYLES[v.status] ?? {
                        bg: "#f1f5f9", color: "#64748b", accent: "#94a3b8", label: v.status,
                      };
                      return (
                        <div
                          key={v.id}
                          className="visit-card"
                          style={{
                            ...card,
                            display: "flex",
                            overflow: "hidden",
                            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                          }}
                        >
                          {/* color accent bar */}
                          <div style={{
                            width: 4,
                            borderRadius: "2px 0 0 2px",
                            background: stt.accent,
                            flexShrink: 0,
                          }} />

                          <div style={{ flex: 1, padding: "14px 16px" }}>
                            <div style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 10,
                              marginBottom: 8,
                            }}>
                              <div>
                                <p style={{
                                  fontSize: 15, fontWeight: 700, color: "#0f172a",
                                  margin: "0 0 3px",
                                }}>
                                  {v.doctorName ?? "Врач"}
                                </p>
                                {v.companyName && (
                                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                                    {v.companyName}
                                  </p>
                                )}
                              </div>

                              {/* status badge */}
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                padding: "3px 10px",
                                borderRadius: 99,
                                background: stt.bg,
                                color: stt.color,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}>
                                {stt.label}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                                {formatDateRu(v.date)} &bull; {v.time || "—"}
                              </p>

                              {v.serviceName && (
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "3px 10px",
                                  borderRadius: 99,
                                  background: "#f0fdfa",
                                  color: "#0d9488",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}>
                                  {v.serviceName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── Prescriptions tab ────────────────────────────── */}
            {tab === "prescriptions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prescriptions.length === 0 ? (
                  <div style={{ ...card, padding: "48px 24px", textAlign: "center" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "#faf5ff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 14px",
                    }}>
                      <FileText size={24} color="#9333ea" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>
                      Рецептов пока нет
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                      Рецепты, выписанные врачом, появятся здесь
                    </p>
                  </div>
                ) : (
                  <>
                    {prescriptions.slice(0, 3).map((rx) => (
                      <button
                        key={rx.id}
                        className="rx-card"
                        onClick={() => router.push(`/patient/prescriptions/${rx.id}`)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: 14,
                          border: "1px solid #e9d5ff",
                          background: "linear-gradient(135deg, #faf5ff, #f5f3ff)",
                          boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                          padding: 0,
                          overflow: "hidden",
                          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        }}
                      >
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: "rgba(147,51,234,0.10)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                <FileText size={16} color="#9333ea" />
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                  Рецепт #{rx.id.slice(-8).toUpperCase()}
                                </p>
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
                                  {formatDateRu(rx.createdAt)}
                                </p>
                              </div>
                            </div>

                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#9333ea",
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}>
                              Открыть <ChevronRight size={13} />
                            </span>
                          </div>

                          <p style={{
                            fontSize: 12,
                            color: "#64748b",
                            margin: 0,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: 1.5,
                          }}>
                            {rx.content.length > 60 ? rx.content.slice(0, 60) + "..." : rx.content}
                          </p>
                        </div>
                      </button>
                    ))}

                    {prescriptions.length > 3 && (
                      <button
                        onClick={() => router.push("/patient/prescriptions")}
                        style={{
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: "13px 16px",
                          cursor: "pointer",
                          color: "#9333ea",
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          minHeight: 44,
                        }}
                      >
                        Все рецепты ({prescriptions.length}) <ChevronRight size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Medcard tab ──────────────────────────────────── */}
            {tab === "medcard" && (
              <div style={{ ...card, padding: "48px 24px", textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <Heart size={32} color="#ef4444" />
                </div>

                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 10px",
                }}>
                  Медкарта в разработке
                </h3>

                <p style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: "0 auto 24px",
                  maxWidth: 400,
                  lineHeight: 1.6,
                }}>
                  Ваша медицинская карта будет доступна после первого визита.
                  Здесь будут отображаться ваш анамнез, хронические заболевания
                  и рекомендации врачей.
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}>
                  {["Анамнез", "Аллергии", "Диагнозы"].map((chip) => (
                    <span
                      key={chip}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 16px",
                        borderRadius: 99,
                        background: "#f0fdfa",
                        color: "#0d9488",
                        border: "1px solid #ccfbf1",
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaSyringe, FaCalendarAlt, FaTrash, FaPlus } from "react-icons/fa";
import {
  getTreatmentCourses,
  createTreatmentCourse,
  deleteTreatmentCourse,
  type TreatmentCourse,
} from "@/lib/api";

const STATUS_COLOR: Record<TreatmentCourse["status"], { text: string; bg: string; border: string }> = {
  ACTIVE:    { text: "#0d9488", bg: "#f0fdf9", border: "#99f6e4" },
  COMPLETED: { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  PAUSED:    { text: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [totalProcedures, setTotalProcedures] = useState("");
  const [intervalDays, setIntervalDays] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function fetchCourses() {
    setLoading(true);
    getTreatmentCourses()
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    setFormError("");
    if (!title.trim() || !totalProcedures || !intervalDays) {
      setFormError(t("courses.fillRequired"));
      return;
    }
    const total = parseInt(totalProcedures, 10);
    const interval = parseInt(intervalDays, 10);
    if (isNaN(total) || total < 1 || isNaN(interval) || interval < 1) {
      setFormError(t("courses.fillRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createTreatmentCourse({
        title: title.trim(),
        totalProcedures: total,
        intervalDays: interval,
        ...(nextDate ? { nextDate: new Date(nextDate).toISOString() } : {}),
      });
      setTitle("");
      setTotalProcedures("");
      setIntervalDays("");
      setNextDate("");
      setShowForm(false);
      fetchCourses();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("courses.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await deleteTreatmentCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", padding: "20px 20px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/profile")}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", flexShrink: 0,
            }}
          >
            <FaArrowLeft size={14} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaSyringe size={18} color="rgba(255,255,255,0.85)" />
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{t("courses.title")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "-12px auto 0", padding: "0 20px 100px" }}>

        {/* Add course button */}
        {!showForm && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%", background: "#0d9488", color: "#fff",
                border: "none", borderRadius: 14, padding: "14px 16px",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <FaPlus size={14} />
              {t("courses.addCourse")}
            </button>
          </div>
        )}

        {/* Inline form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <p style={sectionLabel}>{t("courses.create")}</p>

            <p style={fieldLabel}>{t("courses.fieldTitle")}</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("courses.fieldTitlePlaceholder")}
              style={inputStyle}
            />

            <p style={fieldLabel}>{t("courses.fieldTotal")}</p>
            <input
              type="number"
              min={1}
              value={totalProcedures}
              onChange={(e) => setTotalProcedures(e.target.value)}
              placeholder="10"
              style={inputStyle}
            />

            <p style={fieldLabel}>{t("courses.fieldInterval")}</p>
            <input
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              placeholder="7"
              style={inputStyle}
            />

            <p style={fieldLabel}>{t("courses.fieldNextDate")}</p>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              style={inputStyle}
            />

            {formError && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowForm(false); setFormError(""); }}
                style={{
                  flex: 1, background: "#f1f5f9", color: "#64748b",
                  border: "none", borderRadius: 12, padding: "13px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                {t("common.close")}
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                style={{
                  flex: 2, background: "#0d9488", color: "#fff",
                  border: "none", borderRadius: 12, padding: "13px",
                  fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? t("common.loading") : t("courses.create")}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {courses.length === 0 && !showForm && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "48px 20px",
            textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <FaSyringe size={28} color="#0d9488" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {t("courses.empty")}
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              {t("courses.emptyHint")}
            </p>
          </div>
        )}

        {/* Courses list */}
        {courses.map((course) => {
          const colors = STATUS_COLOR[course.status] ?? STATUS_COLOR.ACTIVE;
          const pct = course.totalProcedures > 0
            ? Math.min(course.completedProcedures / course.totalProcedures, 1)
            : 0;
          const statusLabel: Record<TreatmentCourse["status"], string> = {
            ACTIVE:    t("courses.statusActive"),
            COMPLETED: t("courses.statusDone"),
            PAUSED:    t("courses.statusPaused"),
          };

          return (
            <div key={course.id} style={cardStyle}>
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", flex: 1, lineHeight: 1.3 }}>
                  {course.title}
                </p>
                <span style={{
                  padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                }}>
                  {statusLabel[course.status]}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${pct * 100}%`, background: "#0d9488", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 12, color: "#64748b" }}>
                  {course.completedProcedures}/{course.totalProcedures} {t("courses.procedures")}
                </p>
              </div>

              {/* Info row */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{t("courses.interval")}:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                    {t("courses.everyNDays", { n: course.intervalDays })}
                  </span>
                </div>

                {course.nextDate && course.status === "ACTIVE" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FaCalendarAlt size={11} color="#94a3b8" />
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{t("courses.nextDate")}:</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      {new Date(course.nextDate).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(course.id)}
                disabled={deletingId === course.id}
                style={{
                  background: "transparent", border: "1px solid #fee2e2",
                  borderRadius: 10, padding: "8px 14px",
                  fontSize: 13, fontWeight: 600, color: "#ef4444",
                  cursor: deletingId === course.id ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: deletingId === course.id ? 0.6 : 1,
                }}
              >
                <FaTrash size={11} />
                {deletingId === course.id ? t("common.loading") : t("courses.delete")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 15, fontWeight: 800, color: "#0f172a",
  marginBottom: 16,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.5px",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10,
  padding: "10px 12px", fontSize: 14, color: "#0f172a",
  fontFamily: "inherit", outline: "none",
  boxSizing: "border-box", marginBottom: 14,
  background: "#f8fafc",
};

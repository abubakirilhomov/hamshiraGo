"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaHeartbeat } from "react-icons/fa";
import { getMedicalCard, saveMedicalCard, type MedicalCard } from "@/lib/api";

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

export default function MedicalCardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicDiseases, setChronicDiseases] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }

    getMedicalCard()
      .then((card) => {
        if (card) {
          setBloodType(card.bloodType ?? "");
          setAllergies(card.allergies ?? "");
          setChronicDiseases(card.chronicDiseases ?? "");
          setNotes(card.notes ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveMedicalCard({
        bloodType: bloodType.trim() || null,
        allergies: allergies.trim() || null,
        chronicDiseases: chronicDiseases.trim() || null,
        notes: notes.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
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
            <FaHeartbeat size={18} color="rgba(255,255,255,0.85)" />
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{t("medcard.title")}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 680, margin: "-12px auto 0", padding: "0 20px 100px" }}>

        {/* Blood type */}
        <div style={card}>
          <p style={fieldLabel}>{t("medcard.bloodType")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                onClick={() => setBloodType(bloodType === bt ? "" : bt)}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${bloodType === bt ? "#0d9488" : "#e2e8f0"}`,
                  background: bloodType === bt ? "#0d9488" : "#fff",
                  color: bloodType === bt ? "#fff" : "#64748b",
                }}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div style={card}>
          <p style={fieldLabel}>{t("medcard.allergies")}</p>
          <textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={t("medcard.allergiesPlaceholder")}
            maxLength={1000}
            rows={3}
            style={textarea}
          />
        </div>

        {/* Chronic diseases */}
        <div style={card}>
          <p style={fieldLabel}>{t("medcard.chronicDiseases")}</p>
          <textarea
            value={chronicDiseases}
            onChange={(e) => setChronicDiseases(e.target.value)}
            placeholder={t("medcard.chronicPlaceholder")}
            maxLength={1000}
            rows={3}
            style={textarea}
          />
        </div>

        {/* Notes */}
        <div style={card}>
          <p style={fieldLabel}>{t("medcard.notes")}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("medcard.notesPlaceholder")}
            maxLength={2000}
            rows={4}
            style={textarea}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            background: saved ? "#22c55e" : "#0d9488",
            color: "#fff", border: "none", borderRadius: 14,
            padding: "16px", fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            marginTop: 8,
            transition: "background 0.3s",
          }}
        >
          {saving ? t("common.loading") : saved ? t("medcard.saved") : t("medcard.save")}
        </button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.5px",
  marginBottom: 10,
};

const textarea: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10,
  padding: "10px 12px", fontSize: 14, color: "#0f172a",
  fontFamily: "inherit", resize: "vertical", outline: "none",
  boxSizing: "border-box",
};

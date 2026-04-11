"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getMedicalCard, saveMedicalCard } from "@/lib/api";

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
  const [focused, setFocused] = useState<string | null>(null);

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
    setSaving(true); setSaved(false);
    try {
      await saveMedicalCard({ bloodType: bloodType.trim() || null, allergies: allergies.trim() || null, chronicDiseases: chronicDiseases.trim() || null, notes: notes.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  }

  function taStyle(name: string): React.CSSProperties {
    return {
      width: "100%", border: "none", outline: "none", borderRadius: 14,
      padding: "12px 14px", fontSize: 14, color: "#191c1e",
      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
      background: "#f7f9fb", lineHeight: 1.6,
      boxShadow: focused === name ? "0 0 0 2px #00685f40" : "0 0 0 1.5px #eceef0",
      transition: "box-shadow 150ms",
    };
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

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

        {/* Header */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 32px", position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/profile")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("medcard.title")}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {/* Blood type */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={secLabel}>{t("medcard.bloodType")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BLOOD_TYPES.map((bt) => (
                <button key={bt} onClick={() => setBloodType(bloodType === bt ? "" : bt)} style={{
                  padding: "8px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  border: "none",
                  background: bloodType === bt ? "linear-gradient(135deg,#00685f,#008378)" : "#f2f4f6",
                  color: bloodType === bt ? "#fff" : "#6d7a77",
                  boxShadow: bloodType === bt ? "0 3px 10px rgba(0,104,95,0.2)" : "none",
                  transition: "all 150ms",
                }}>
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>warning</span>
              <p style={secLabel}>{t("medcard.allergies")}</p>
            </div>
            <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)}
              onFocus={() => setFocused("allergies")} onBlur={() => setFocused(null)}
              placeholder={t("medcard.allergiesPlaceholder")} maxLength={1000} rows={3}
              style={taStyle("allergies")} />
          </div>

          {/* Chronic diseases */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>medication</span>
              <p style={secLabel}>{t("medcard.chronicDiseases")}</p>
            </div>
            <textarea value={chronicDiseases} onChange={(e) => setChronicDiseases(e.target.value)}
              onFocus={() => setFocused("chronic")} onBlur={() => setFocused(null)}
              placeholder={t("medcard.chronicPlaceholder")} maxLength={1000} rows={3}
              style={taStyle("chronic")} />
          </div>

          {/* Notes */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>notes</span>
              <p style={secLabel}>{t("medcard.notes")}</p>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)}
              placeholder={t("medcard.notesPlaceholder")} maxLength={2000} rows={4}
              style={taStyle("notes")} />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: "100%",
            background: saved ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#00685f,#008378)",
            color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.75 : 1,
            boxShadow: "0 6px 20px rgba(0,104,95,0.25)", transition: "background 300ms",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving
              ? <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>
              : <span className="mat-icon" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{saved ? "check_circle" : "save"}</span>
            }
            {saving ? t("common.loading") : saved ? t("medcard.saved") : t("medcard.save")}
          </button>
        </div>
      </div>
    </>
  );
}

const secLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#bcc9c6",
  textTransform: "uppercase", letterSpacing: "0.6px", margin: 0,
};

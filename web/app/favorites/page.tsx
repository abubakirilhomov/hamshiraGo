"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getFavorites, removeFavorite, type FavoriteMedic } from "@/lib/api";

export default function FavoritesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [medics, setMedics] = useState<FavoriteMedic[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    getFavorites().then(setMedics).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function handleRemove(medicId: string) {
    if (removing) return;
    setRemoving(medicId);
    try {
      await removeFavorite(medicId);
      setMedics((prev) => prev.filter((m) => m.medicId !== medicId));
    } catch {}
    finally { setRemoving(null); }
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
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .medic-card { background:#fff; border-radius:20px; padding:16px; margin-bottom:12px;
          box-shadow:0 2px 12px rgba(0,0,0,0.06); display:flex; align-items:center; gap:14px;
          animation: fadeUp 200ms ease; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 32px", position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/profile")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.9)", fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("favorites.title")}</p>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 680, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {medics.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 24, padding: "48px 24px", marginTop: 12, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f2f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <span className="mat-icon" style={{ fontSize: 34, color: "#bcc9c6" }}>favorite_border</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>
                {t("favorites.empty")}
              </p>
              <p style={{ fontSize: 14, color: "#6d7a77", lineHeight: 1.5 }}>
                {t("favorites.emptyHint")}
              </p>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {medics.map((medic) => (
                <MedicCard
                  key={medic.medicId}
                  medic={medic}
                  removing={removing === medic.medicId}
                  onRemove={() => handleRemove(medic.medicId)}
                  removeLabel={t("favorites.remove")}
                  removingLabel={t("common.loading")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MedicCard({
  medic, removing, onRemove, removeLabel, removingLabel,
}: {
  medic: FavoriteMedic;
  removing: boolean;
  onRemove: () => void;
  removeLabel: string;
  removingLabel: string;
}) {
  const initials = medic.name
    ? medic.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="medic-card">
      {/* Avatar */}
      <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2.5px solid #00685f" }}>
        {medic.profilePhotoUrl ? (
          <img src={medic.profilePhotoUrl} alt={medic.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", marginBottom: 5, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{medic.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {medic.rating !== null && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6d7a77" }}>
              <span style={{ color: "#eab308", fontSize: 13 }}>★</span>
              {Number(medic.rating).toFixed(1)}
            </span>
          )}
          {medic.experienceYears !== null && medic.experienceYears !== undefined && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6d7a77" }}>
              <span className="mat-icon" style={{ fontSize: 13, color: "#bcc9c6" }}>work</span>
              {medic.experienceYears} лет
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      <button onClick={onRemove} disabled={removing} style={{
        background: removing ? "#f2f4f6" : "#fef2f2",
        border: "none", borderRadius: 12,
        padding: "8px 14px", fontSize: 12, fontWeight: 700,
        color: removing ? "#bcc9c6" : "#ef4444",
        cursor: removing ? "not-allowed" : "pointer",
        flexShrink: 0, whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 5,
        transition: "all 150ms",
      }}>
        <span className="mat-icon" style={{ fontSize: 14 }}>{removing ? "progress_activity" : "heart_broken"}</span>
        {removing ? removingLabel : removeLabel}
      </button>
    </div>
  );
}

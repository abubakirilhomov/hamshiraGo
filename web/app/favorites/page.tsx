"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaStar, FaUserNurse, FaBriefcaseMedical } from "react-icons/fa";
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

    getFavorites()
      .then(setMedics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleRemove(medicId: string) {
    if (removing) return;
    setRemoving(medicId);
    try {
      await removeFavorite(medicId);
      setMedics((prev) => prev.filter((m) => m.medicId !== medicId));
    } catch {
      // ignore
    } finally {
      setRemoving(null);
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
            <FaStar size={18} color="rgba(255,255,255,0.85)" />
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{t("favorites.title")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "-12px auto 0", padding: "0 20px 100px" }}>

        {medics.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "40px 20px",
            marginTop: 12, textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <FaStar size={28} color="#cbd5e1" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {t("favorites.empty")}
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
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
  );
}

function MedicCard({
  medic,
  removing,
  onRemove,
  removeLabel,
  removingLabel,
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
    <div style={{
      background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      {/* Avatar */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: "2px solid #0d9488",
      }}>
        {medic.profilePhotoUrl ? (
          <img
            src={medic.profilePhotoUrl}
            alt={medic.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#fff",
          }}>
            {initials || <FaUserNurse size={22} color="#fff" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{medic.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {medic.rating !== null && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b" }}>
              <FaStar size={11} color="#eab308" />
              {Number(medic.rating).toFixed(1)}
            </span>
          )}
          {medic.experienceYears !== null && medic.experienceYears !== undefined && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b" }}>
              <FaBriefcaseMedical size={11} color="#94a3b8" />
              {medic.experienceYears} лет
            </span>
          )}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={removing}
        style={{
          background: removing ? "#f1f5f9" : "#fff0f0",
          border: `1.5px solid ${removing ? "#e2e8f0" : "#fca5a5"}`,
          borderRadius: 10,
          padding: "7px 12px",
          fontSize: 12, fontWeight: 700,
          color: removing ? "#94a3b8" : "#ef4444",
          cursor: removing ? "not-allowed" : "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {removing ? removingLabel : removeLabel}
      </button>
    </div>
  );
}

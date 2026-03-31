"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaGift, FaCopy, FaCheck, FaShareAlt, FaUsers, FaStar } from "react-icons/fa";
import { getReferralInfo, type ReferralInfo } from "@/lib/api";

export default function ReferralPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }

    getReferralInfo()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const inviteLink = data?.referralCode
    ? `https://app.hamshirago.uz?ref=${data.referralCode}`
    : "";

  function handleCopyCode() {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!data?.referralCode) return;
    const shareText = `${t("referral.shareText")} ${data.referralCode}\n${inviteLink}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "HamshiraGo", text: shareText, url: inviteLink });
        return;
      } catch {
        // fallback to copy
      }
    }
    // fallback — copy link
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleCopyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
            <FaGift size={18} color="rgba(255,255,255,0.85)" />
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{t("referral.title")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "-12px auto 0", padding: "0 20px 100px" }}>

        {/* Referral code card */}
        <div style={card}>
          <p style={fieldLabel}>{t("referral.yourCode")}</p>
          <p style={{
            fontSize: 38, fontWeight: 800, color: "#0d9488",
            letterSpacing: 6, margin: "12px 0 16px", textAlign: "center",
          }}>
            {data?.referralCode ?? "—"}
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            {/* Copy code button */}
            <button
              onClick={handleCopyCode}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "11px 16px", borderRadius: 10,
                border: `1.5px solid ${copied ? "#22c55e" : "#0d9488"}`,
                background: copied ? "#f0fdf4" : "#f0fdf9",
                color: copied ? "#22c55e" : "#0d9488",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
              {copied ? t("referral.copied") : t("referral.copy")}
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "11px 16px", borderRadius: 10,
                border: "none",
                background: "#0d9488",
                color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              <FaShareAlt size={14} />
              {t("referral.share")}
            </button>
          </div>
        </div>

        {/* Invite link card */}
        <div style={card}>
          <p style={fieldLabel}>{t("referral.inviteLink")}</p>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 6,
            background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0",
            padding: "10px 14px",
          }}>
            <p style={{
              flex: 1, fontSize: 13, color: "#0d9488", fontWeight: 600,
              wordBreak: "break-all", margin: 0,
            }}>
              {inviteLink || "—"}
            </p>
            <button
              onClick={handleCopyLink}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: linkCopied ? "#22c55e" : "#94a3b8", flexShrink: 0,
                transition: "color 0.2s",
              }}
            >
              {linkCopied ? <FaCheck size={15} /> : <FaCopy size={15} />}
            </button>
          </div>
        </div>

        {/* Bonus explanation card */}
        <div style={{
          background: "#f0fdf9", borderRadius: 14, padding: 18,
          border: "1px solid #99f6e410", marginBottom: 12,
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <FaGift size={20} color="#fff" />
          </div>
          <p style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.6, margin: 0 }}>
            {t("referral.bonus")}
          </p>
        </div>

        {/* Stats card */}
        <div style={card}>
          <p style={fieldLabel}>{t("referral.stats")}</p>
          <div style={{ display: "flex", marginTop: 8 }}>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FaUsers size={20} color="#0d9488" />
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#0d9488", margin: 0 }}>
                {data?.referredCount ?? 0}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: 0 }}>
                {t("referral.friendsInvited")}
              </p>
            </div>

            <div style={{ width: 1, background: "#e2e8f0", margin: "0 8px" }} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FaStar size={20} color="#0d9488" />
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#0d9488", margin: 0 }}>
                {data?.bonusPaidCount ?? 0}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: 0 }}>
                {t("referral.bonusPaid")}
              </p>
            </div>

          </div>
        </div>

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
  textAlign: "center" as const,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.5px",
  marginBottom: 4,
};

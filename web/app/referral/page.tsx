"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
    getReferralInfo().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const inviteLink = data?.referralCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.hamshirago.uz"}?ref=${data.referralCode}`
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
      try { await navigator.share({ title: "HamshiraGo", text: shareText, url: inviteLink }); return; }
      catch {}
    }
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
        @keyframes pop { 0% { transform:scale(0.9); opacity:0; } 100% { transform:scale(1); opacity:1; } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
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
              <span className="mat-icon" style={{ fontSize: 22, color: "rgba(255,255,255,0.85)", fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("referral.title")}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "-16px auto 0", padding: "0 16px 100px" }}>

          {/* Referral code card */}
          <div style={{ background: "#fff", borderRadius: 24, padding: "24px 20px", marginBottom: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <p style={secLabel}>{t("referral.yourCode")}</p>

            {/* Code display */}
            <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", borderRadius: 18, padding: "22px 24px", margin: "14px 0 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <p style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: 8, fontFamily: "'Plus Jakarta Sans',sans-serif", margin: 0 }}>
                {data?.referralCode ?? "—"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCopyCode} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 16px", borderRadius: 14, border: "none",
                background: copied ? "#f0fdf4" : "#f2f4f6",
                color: copied ? "#16a34a" : "#00685f",
                fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 200ms",
              }}>
                <span className="mat-icon" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{copied ? "check_circle" : "content_copy"}</span>
                {copied ? t("referral.copied") : t("referral.copy")}
              </button>
              <button onClick={handleShare} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 16px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg,#00685f,#008378)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,104,95,0.22)",
              }}>
                <span className="mat-icon" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>share</span>
                {t("referral.share")}
              </button>
            </div>
          </div>

          {/* Invite link card */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={secLabel}>{t("referral.inviteLink")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: "#f7f9fb", borderRadius: 14, padding: "12px 14px" }}>
              <p style={{ flex: 1, fontSize: 13, color: "#00685f", fontWeight: 600, wordBreak: "break-all", margin: 0, lineHeight: 1.4 }}>
                {inviteLink || "—"}
              </p>
              <button onClick={handleCopyLink} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 4 }}>
                <span className="mat-icon" style={{ fontSize: 20, color: linkCopied ? "#16a34a" : "#bcc9c6", transition: "color 200ms", fontVariationSettings: "'FILL' 1" }}>
                  {linkCopied ? "check_circle" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Bonus explanation */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="mat-icon" style={{ fontSize: 22, color: "#fff", fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
            </div>
            <p style={{ fontSize: 14, color: "#3d4947", lineHeight: 1.7, margin: 0 }}>
              {t("referral.bonus")}
            </p>
          </div>

          {/* Stats */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={secLabel}>{t("referral.stats")}</p>
            <div style={{ display: "flex", marginTop: 14, gap: 12 }}>

              <div style={{ flex: 1, background: "#f7f9fb", borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <span className="mat-icon" style={{ fontSize: 24, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>group</span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: "0 0 4px" }}>
                  {data?.referredCount ?? 0}
                </p>
                <p style={{ fontSize: 12, color: "#6d7a77", margin: 0, lineHeight: 1.4 }}>
                  {t("referral.friendsInvited")}
                </p>
              </div>

              <div style={{ flex: 1, background: "#f7f9fb", borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <span className="mat-icon" style={{ fontSize: 24, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif", margin: "0 0 4px" }}>
                  {data?.bonusPaidCount ?? 0}
                </p>
                <p style={{ fontSize: 12, color: "#6d7a77", margin: 0, lineHeight: 1.4 }}>
                  {t("referral.bonusPaid")}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const secLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#bcc9c6",
  textTransform: "uppercase", letterSpacing: "0.6px",
  marginBottom: 4,
};

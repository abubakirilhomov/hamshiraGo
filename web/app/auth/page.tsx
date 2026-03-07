"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram, useHaptic } from "@/hooks/useTelegram";
import { getTelegramUserName } from "@/lib/telegram";
import {
  FaExclamationCircle,
  FaUser,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaClock,
  FaStar,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { subscribeWebPush } from "@/lib/webPush";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

type Mode = "login" | "register";

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  const d = digits.startsWith("998") ? digits.slice(3) : digits;
  let result = "+998";
  if (d.length > 0) result += " " + d.slice(0, 2);
  if (d.length > 2) result += " " + d.slice(2, 5);
  if (d.length > 5) result += " " + d.slice(5, 7);
  if (d.length > 7) result += " " + d.slice(7, 9);
  return result;
}

export default function AuthPage() {
  const router = useRouter();
  const { inTelegram } = useTelegram();
  const { notify, impact } = useHaptic();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setPhone(formatPhone(raw));
  }

  useEffect(() => {
    if (mode === "register") {
      const tgName = getTelegramUserName();
      if (tgName) setName(tgName);
    }
  }, [mode]);

  function switchMode(m: Mode) {
    impact("light");
    setMode(m);
    setError("");
    setName("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const rawPhone = "+" + phone.replace(/\D/g, "");
    try {
      const res =
        mode === "login"
          ? await api.auth.login(rawPhone, password)
          : await api.auth.register(name, rawPhone, password);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      subscribeWebPush();
      notify("success");
      router.push("/");
    } catch (err: unknown) {
      notify("error");
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "TOO_MANY_REQUESTS" ? t("auth.tooManyAttempts") : msg || t("auth.errorGeneral"));
    } finally {
      setLoading(false);
    }
  }

  function fieldStyle(fieldName: string): React.CSSProperties {
    const focused = focusedField === fieldName;
    return {
      background: focused ? "#fff" : "#f8fafc",
      border: `1.5px solid ${focused ? "#0d9488" : "#e2e8f0"}`,
      borderRadius: 12,
      padding: "0 14px 0 46px",
      fontSize: 15,
      color: "#0f172a",
      width: "100%",
      height: 52,
      outline: "none",
      transition: "all 150ms ease",
      boxShadow: focused ? "0 0 0 3px #0d948820" : "none",
    };
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .auth-left {
          display: flex;
          width: 50%;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          background: linear-gradient(145deg, #0d9488 0%, #0f766e 60%, #065f46 100%);
          position: relative;
          overflow: hidden;
        }

        .auth-right {
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: #f8fafc;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right {
            width: 100% !important;
            padding: 32px 20px !important;
            align-items: flex-start !important;
          }
          .mobile-logo { display: flex !important; align-items: center; gap: 10px; margin-bottom: 28px; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Left branding panel */}
        <div className="auth-left">
          <div style={{
            position: "absolute", top: -80, right: -80,
            width: 280, height: 280, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} />
          <div style={{
            position: "absolute", bottom: -60, left: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <img src="/logo.png" alt="HamshiraGo" style={{ width: 72, height: 72, borderRadius: 20, objectFit: "cover" }} />
            <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              HamshiraGo
            </span>
          </div>

          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.5px" }}>
            {t("auth.headline")}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 48 }}>
            {t("auth.tagline")}
          </p>

          {[
            { Icon: FaClock,     key: "feature1" as const },
            { Icon: FaShieldAlt, key: "feature2" as const },
            { Icon: FaStar,      key: "feature3" as const },
          ].map(({ Icon, key }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                {t(`auth.${key}`)}
              </span>
            </div>
          ))}
        </div>

        {/* Right form panel */}
        <div className="auth-right">
          <div style={{ width: "100%", maxWidth: 400 }}>

            {/* Mobile logo */}
            <div style={{ display: "none" }} className="mobile-logo">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                <img src="/logo.png" alt="HamshiraGo" style={{ width: 45, height: 45, borderRadius: 13, objectFit: "cover" }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: "#0d9488" }}>HamshiraGo</span>
              </div>
            </div>

            {/* Language switcher */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "flex-end" }}>
              {(["ru", "uz"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${language === lang ? "#0d9488" : "#e2e8f0"}`,
                    background: language === lang ? "#0d9488" : "#fff",
                    color: language === lang ? "#fff" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.3px" }}>
              {mode === "login" ? t("auth.welcomeTitle") : t("auth.createAccountTitle")}
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>
              {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
            </p>

            {/* Toggle */}
            <div style={{
              background: "#f1f5f9",
              borderRadius: 12,
              padding: 4,
              display: "flex",
              marginBottom: 28,
            }}>
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    transition: "all 200ms ease",
                    background: mode === m ? "#fff" : "transparent",
                    color: mode === m ? "#0d9488" : "#64748b",
                    boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {m === "login" ? t("auth.loginBtn") : t("auth.register")}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Name */}
              {mode === "register" && (
                <div style={{ animation: "fadeIn 200ms ease" }}>
                  <label style={labelStyle}>{t("auth.yourName")}</label>
                  <div style={{ position: "relative" }}>
                    <FaUser size={15} color={focusedField === "name" ? "#0d9488" : "#94a3b8"}
                      style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", transition: "color 150ms" }} />
                    <input
                      type="text" value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t("auth.namePlaceholderInput")}
                      required
                      style={fieldStyle("name")}
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label style={labelStyle}>{t("auth.phoneLabel")}</label>
                <div style={{ position: "relative" }}>
                  <FaPhone size={14} color={focusedField === "phone" ? "#0d9488" : "#94a3b8"}
                    style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", transition: "color 150ms" }} />
                  <input
                    type="tel" value={phone}
                    onChange={handlePhoneChange}
                    onFocus={() => { setFocusedField("phone"); if (!phone) setPhone("+998 "); }}
                    onBlur={() => { setFocusedField(null); if (phone === "+998 ") setPhone(""); }}
                    placeholder="+998 90 123 45 67"
                    required
                    style={fieldStyle("phone")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>{t("auth.passwordLabel")}</label>
                <div style={{ position: "relative" }}>
                  <FaLock size={14} color={focusedField === "password" ? "#0d9488" : "#94a3b8"}
                    style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", transition: "color 150ms" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t("auth.passwordPlaceholder")}
                    required minLength={6}
                    style={{ ...fieldStyle("password"), paddingRight: 48 }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#94a3b8", display: "flex", alignItems: "center", padding: 4,
                    }}>
                    {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: "#ef444412", borderRadius: 10, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  color: "#ef4444", fontSize: 13, fontWeight: 500,
                }}>
                  <FaExclamationCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#0d9488",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 12,
                  padding: "15px 24px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  marginTop: 4,
                  transition: "opacity 150ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {loading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                )}
                {loading ? t("auth.wait") : mode === "login" ? t("auth.loginBtn") : t("auth.registerBtn")}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#64748b" }}>
              {mode === "login" ? t("auth.noAccount") + " " : t("auth.hasAccount") + " "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                style={{ background: "none", border: "none", color: "#0d9488", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {mode === "login" ? t("auth.registerBtn") : t("auth.loginBtn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 7,
  display: "block",
};

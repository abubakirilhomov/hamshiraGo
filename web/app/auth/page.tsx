"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram, useHaptic } from "@/hooks/useTelegram";
import { getTelegramUserName } from "@/lib/telegram";
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
  const { notify, impact } = useHaptic();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/");
  }, [router]);

  useEffect(() => {
    if (mode === "register") {
      const tgName = getTelegramUserName();
      if (tgName) setName(tgName);
    }
  }, [mode]);

  function switchMode(m: Mode) {
    impact("light");
    setMode(m); setError(""); setName(""); setPassword(""); setReferralCode(""); setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const rawPhone = "+" + phone.replace(/\D/g, "");
    try {
      const res = mode === "login"
        ? await api.auth.login(rawPhone, password)
        : await api.auth.register(name, rawPhone, password, referralCode.trim() || undefined);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      subscribeWebPush();
      notify("success");
      if (mode === "register") {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      notify("error");
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "TOO_MANY_REQUESTS" ? t("auth.tooManyAttempts") : msg || t("auth.errorGeneral"));
    } finally { setLoading(false); }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", height: 52, border: "none", outline: "none",
    background: focused === field ? "#fff" : "#f2f4f6",
    borderRadius: 14, padding: "0 48px 0 48px", fontSize: 15,
    color: "#191c1e", transition: "all 150ms",
    boxShadow: focused === field ? "0 0 0 2px #00685f40" : "none",
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .auth-panel { display:flex; }
        .auth-left { width:45%; display:flex; flex-direction:column; justify-content:center;
          padding:60px 52px; background:linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%);
          position:relative; overflow:hidden; }
        .auth-right { flex:1; display:flex; align-items:center; justify-content:center;
          padding:48px 40px; background:#f7f9fb; overflow-y:auto; }
        @media(max-width:768px){
          .auth-left { display:none!important; }
          .auth-right { padding:32px 20px!important; align-items:flex-start!important; }
        }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div className="auth-panel" style={{ minHeight: "100vh" }}>

        {/* ── Left branding ── */}
        <div className="auth-left">
          <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
          <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

          <div style={{ marginBottom: 40 }}>
            <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.4px" }}>HamshiraGo</span>
          </div>

          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:14, letterSpacing:"-0.5px" }}>
            {t("auth.headline")}
          </h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.72)", lineHeight:1.65, marginBottom:44 }}>
            {t("auth.tagline")}
          </p>

          {[
            { icon: "schedule", key: "feature1" },
            { icon: "verified_user", key: "feature2" },
            { icon: "star", key: "feature3" },
          ].map(({ icon, key }) => (
            <div key={key} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span className="mat-icon" style={{ fontSize:20, color:"#fff" }}>{icon}</span>
              </div>
              <span style={{ fontSize:14, color:"rgba(255,255,255,0.88)", fontWeight:500 }}>{t(`auth.${key}`)}</span>
            </div>
          ))}
        </div>

        {/* ── Right form ── */}
        <div className="auth-right">
          <div style={{ width:"100%", maxWidth:400 }}>

            {/* Mobile logo */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }} className="md-hidden">
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800, color:"#00685f" }}>HamshiraGo</span>
            </div>

            {/* Language */}
            <div style={{ display:"flex", gap:4, marginBottom:24, justifyContent:"flex-end" }}>
              <div style={{ display:"flex", gap:2, background:"#eceef0", borderRadius:10, padding:3 }}>
                {(["ru","uz"] as const).map((lang) => (
                  <button key={lang} type="button" onClick={() => setLanguage(lang)} style={{
                    padding:"4px 12px", borderRadius:7, border:"none", cursor:"pointer",
                    background: language === lang ? "#fff" : "transparent",
                    color: language === lang ? "#00685f" : "#6d7a77",
                    fontSize:12, fontWeight:700,
                    boxShadow: language === lang ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition:"all 150ms",
                  }}>{lang.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:800, color:"#191c1e", marginBottom:6, letterSpacing:"-0.3px" }}>
              {mode === "login" ? t("auth.welcomeTitle") : t("auth.createAccountTitle")}
            </h1>
            <p style={{ fontSize:14, color:"#6d7a77", marginBottom:28, lineHeight:1.5 }}>
              {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
            </p>

            {/* Mode toggle */}
            <div style={{ background:"#eceef0", borderRadius:14, padding:4, display:"flex", marginBottom:28 }}>
              {(["login","register"] as Mode[]).map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)} style={{
                  flex:1, padding:"11px", borderRadius:11, border:"none", cursor:"pointer",
                  fontSize:14, fontWeight:700, transition:"all 200ms",
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#00685f" : "#6d7a77",
                  boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}>
                  {m === "login" ? t("auth.loginBtn") : t("auth.register")}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Name */}
              {mode === "register" && (
                <div style={{ animation:"fadeIn 200ms ease" }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6d7a77", marginBottom:6, display:"block" }}>{t("auth.yourName")}</label>
                  <div style={{ position:"relative" }}>
                    <span className="mat-icon" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:20, color: focused==="name" ? "#00685f" : "#bcc9c6", transition:"color 150ms" }}>person</span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                      placeholder={t("auth.namePlaceholderInput")} required
                      style={inputStyle("name")} />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#6d7a77", marginBottom:6, display:"block" }}>{t("auth.phoneLabel")}</label>
                <div style={{ position:"relative" }}>
                  <span className="mat-icon" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:20, color: focused==="phone" ? "#00685f" : "#bcc9c6", transition:"color 150ms" }}>phone</span>
                  <input type="tel" value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value.replace(/\D/g,"")))}
                    onFocus={() => { setFocused("phone"); if (!phone) setPhone("+998 "); }}
                    onBlur={() => { setFocused(null); if (phone === "+998 ") setPhone(""); }}
                    placeholder="+998 90 123 45 67" required
                    style={inputStyle("phone")} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#6d7a77", marginBottom:6, display:"block" }}>{t("auth.passwordLabel")}</label>
                <div style={{ position:"relative" }}>
                  <span className="mat-icon" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:20, color: focused==="password" ? "#00685f" : "#bcc9c6", transition:"color 150ms" }}>lock</span>
                  <input type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    placeholder={t("auth.passwordPlaceholder")} required minLength={6}
                    style={{ ...inputStyle("password"), paddingRight:48 }} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} style={{
                    position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center",
                  }}>
                    <span className="mat-icon" style={{ fontSize:20, color:"#bcc9c6" }}>{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* Referral code */}
              {mode === "register" && (
                <div style={{ animation:"fadeIn 200ms ease" }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#6d7a77", marginBottom:6, display:"block" }}>{t("auth.referralLabel")}</label>
                  <div style={{ position:"relative" }}>
                    <span className="mat-icon" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:20, color: focused==="referral" ? "#00685f" : "#bcc9c6", transition:"color 150ms" }}>card_giftcard</span>
                    <input type="text" value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                      onFocus={() => setFocused("referral")} onBlur={() => setFocused(null)}
                      placeholder={t("auth.referralPlaceholder")}
                      style={inputStyle("referral")} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background:"#fef2f2", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, color:"#ef4444", fontSize:13, fontWeight:500 }}>
                  <span className="mat-icon" style={{ fontSize:18, flexShrink:0 }}>error</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                background: "linear-gradient(135deg,#00685f,#008378)",
                color:"#fff", fontSize:15, fontWeight:700, borderRadius:14,
                padding:"15px 24px", border:"none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                marginTop:4, transition:"opacity 150ms, transform 150ms",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                boxShadow:"0 4px 16px rgba(0,104,95,0.25)",
              }}>
                {loading && <span className="mat-icon" style={{ fontSize:18, animation:"spin 0.8s linear infinite" }}>progress_activity</span>}
                {loading ? t("auth.wait") : mode === "login" ? t("auth.loginBtn") : t("auth.registerBtn")}
              </button>
            </form>

            <p style={{ textAlign:"center", marginTop:20, fontSize:14, color:"#6d7a77" }}>
              {mode === "login" ? t("auth.noAccount") + " " : t("auth.hasAccount") + " "}
              <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}
                style={{ background:"none", border:"none", color:"#00685f", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                {mode === "login" ? t("auth.registerBtn") : t("auth.loginBtn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

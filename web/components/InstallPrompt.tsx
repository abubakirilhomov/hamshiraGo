"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;
const FROM_LANDING_KEY = "pwa-from-landing";

function isDismissed() {
  if (typeof window === "undefined") return false;
  // If came from landing — override dismiss snooze
  if (localStorage.getItem(FROM_LANDING_KEY)) return false;
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return false;
  return Date.now() - Number(val) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
}

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    // Check if came from landing page
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "landing") {
      localStorage.setItem(FROM_LANDING_KEY, "1");
      // Clean up URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("from");
      window.history.replaceState({}, "", url.toString());
    }

    // Already installed or dismissed recently — don't show
    if (isInStandaloneMode() || isDismissed()) return;

    const fromLanding = !!localStorage.getItem(FROM_LANDING_KEY);

    // iOS: show manual instruction — immediately if from landing, else after 2s
    if (isIos()) {
      const delay = fromLanding ? 500 : 2000;
      const timer = setTimeout(() => setShowIos(true), delay);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    localStorage.removeItem(FROM_LANDING_KEY);
    setShowAndroid(false);
    setShowIos(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    localStorage.removeItem(FROM_LANDING_KEY);
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowAndroid(false);
    }
  }

  // ── Android / Chrome banner ───────────────────────────────────────────────
  if (showAndroid && deferredPrompt) {
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
        background: "#0f172a", color: "#f8fafc",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.3)",
      }}>
        <img src="/logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{t("install.title")}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{t("install.androidSub")}</div>
        </div>
        <button onClick={dismiss} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "4px 8px", lineHeight: 1 }} aria-label={t("common.close")}>×</button>
        <button onClick={install} style={{ background: "#0d9488", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          {t("install.installBtn")}
        </button>
      </div>
    );
  }

  // ── iOS Safari bottom sheet ───────────────────────────────────────────────
  if (showIos) {
    return (
      <>
        <div onClick={dismiss} style={{ position: "fixed", inset: 0, zIndex: 9997, background: "rgba(0,0,0,0.4)" }} />
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
          background: "#fff", borderRadius: "20px 20px 0 0",
          padding: "24px 20px 40px", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          animation: "slideUp 250ms cubic-bezier(0.32,0.72,0,1)",
        }}>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

          {/* Handle */}
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <img src="/logo.png" alt="" style={{ width: 52, height: 52, borderRadius: 12 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{t("install.title")}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{t("install.iosSub")}</div>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {/* iOS Share icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: "#0f172a" }}>
                {t("install.step1")} <span style={{ fontSize: 16 }}>⎙</span> {t("install.step1hint")}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, color: "#0f172a" }}>
                {t("install.step2")}
              </div>
            </div>
          </div>

          <button onClick={dismiss} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1.5px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {t("install.understand")}
          </button>
        </div>
      </>
    );
  }

  return null;
}

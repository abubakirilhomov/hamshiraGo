"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { unsubscribeWebPush } from "@/lib/webPush";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const MENU_ITEMS = [
  { icon: "favorite", label_key: "favorites.myMedics", sub_key: "favorites.myMedicsDescription", path: "/favorites" },
  { icon: "receipt_long", label_key: "profile.orders", sub_key: "profile.ordersDescription", path: "/orders" },
  { icon: "monitor_heart", label_key: "medcard.title", sub_key: "medcard.subtitle", path: "/medical-card" },
  { icon: "workspace_premium", label_key: null, sub_key: null, label: "Мои бонусы", sub: "Баллы, тир и история начислений", path: "/loyalty" },
  { icon: "layers", label_key: null, sub_key: null, label: "Подписки", sub: "Скидки на заказы по подписке", path: "/subscriptions" },
  { icon: "card_giftcard", label_key: "referral.title", sub_key: "referral.bonus", path: "/referral" },
  { icon: "video_call", label_key: null, sub_key: null, label: "Консультации", sub: "История онлайн-консультаций с врачами", path: "/consultations" },
  { icon: "clinical_notes", label_key: null, sub_key: null, label: "Мои рецепты", sub: "Рецепты от врачей и оформление заказов", path: "/prescriptions" },
  { icon: "smart_toy", label_key: null, sub_key: null, label: "ИИ-ассистент", sub: "Медицинская консультация с ИИ", path: "/ai-chat" },
  { icon: "vaccines", label_key: "courses.title", sub_key: "courses.subtitle", path: "/courses" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, setUser } = useUser();
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); }
    const savedAvatar = localStorage.getItem("user_avatar");
    if (savedAvatar) setAvatarUrl(savedAvatar);
  }, [router]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 128;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      URL.revokeObjectURL(objectUrl);
      const result = canvas.toDataURL("image/jpeg", 0.8);
      setAvatarUrl(result);
      try {
        localStorage.setItem("user_avatar", result);
      } catch { /* QuotaExceededError — аватар показывается но не сохраняется */ }
    };
    img.src = objectUrl;
  }

  async function handleSaveName() {
    if (!editName.trim()) return;
    setEditLoading(true);
    setEditError("");
    try {
      const updated = await api.auth.updateProfile(editName.trim());
      if (user) setUser({ ...user, name: updated.name });
      setEditModal(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally { setEditLoading(false); }
  }

  function handleLogout() {
    unsubscribeWebPush();
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth");
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.auth.deleteAccount();
      unsubscribeWebPush();
      localStorage.removeItem("token");
      setUser(null);
      router.push("/auth");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Ошибка удаления");
      setDeleteLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const initials = user.name
    ? user.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user.phone.slice(-2);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .menu-row { width:100%; background:#fff; border:none; cursor:pointer; display:flex; align-items:center;
          gap:14px; padding:14px 18px; text-align:left; transition:background 150ms; }
        .menu-row:hover { background:#f7f9fb; }
        .menu-row:first-child { border-radius:20px 20px 0 0; }
        .menu-row:last-child { border-radius:0 0 20px 20px; }
        .menu-row:only-child { border-radius:20px; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 52px", position: "relative" }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
              </button>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t("profile.title")}</p>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>logout</span>
              </button>
            </div>

            {/* Avatar + name */}
            <div style={{ textAlign: "center" }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              <div style={{ position: "relative", width: 84, margin: "0 auto 12px", display: "inline-block" }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", backdropFilter: "blur(4px)", cursor: "pointer", overflow: "hidden" }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (initials || <span className="mat-icon" style={{ fontSize: 36, color: "#fff" }}>person</span>)
                  }
                </div>
                <button onClick={() => fileInputRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span className="mat-icon" style={{ fontSize: 13, color: "#00685f" }}>photo_camera</span>
                </button>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4, letterSpacing: "-0.3px" }}>
                {user.name ?? t("profile.user")}
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>{user.phone}</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "-24px auto 0", padding: "0 16px 96px" }}>

          {/* Personal data card */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <p style={sectionLabel}>{t("profile.personalData")}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #f2f4f6" }}>
              <div style={iconWrap("#c2ebe3","#00685f")}>
                <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>person</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("profile.name")}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e" }}>{user.name ?? "—"}</p>
              </div>
              <button onClick={() => { setEditName(user.name ?? ""); setEditError(""); setEditModal(true); }}
                style={{ background: "#f2f4f6", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#00685f", fontSize: 12, fontWeight: 700 }}>
                <span className="mat-icon" style={{ fontSize: 14 }}>edit</span>
                Изменить
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconWrap("#c2ebe3","#00685f")}>
                <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>phone</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.4px" }}>{t("profile.phone")}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e" }}>{user.phone}</p>
              </div>
              <a href="mailto:support@hamshirago.uz" style={{ background: "#f2f4f6", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#6d7a77", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                <span className="mat-icon" style={{ fontSize: 14 }}>support_agent</span>
                Поддержка
              </a>
            </div>
          </div>

          {/* Language */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={sectionLabel}>{t("profile.language")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["ru", "uz"] as const).map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)} style={{
                  padding: "10px 24px", borderRadius: 12, border: "none",
                  background: language === lang ? "linear-gradient(135deg,#00685f,#008378)" : "#f2f4f6",
                  color: language === lang ? "#fff" : "#6d7a77",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: language === lang ? "0 4px 12px rgba(0,104,95,0.22)" : "none",
                  transition: "all 150ms",
                }}>
                  {lang === "ru" ? "Русский" : "O'zbek"}
                </button>
              ))}
            </div>
          </div>

          {/* Menu list */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 12 }}>
            {MENU_ITEMS.map(({ icon, label_key, sub_key, label, sub, path }, i) => {
              const displayLabel = label_key ? t(label_key) : (label ?? "");
              const displaySub = sub_key ? t(sub_key) : (sub ?? "");
              return (
                <button key={path} className="menu-row" onClick={() => router.push(path)}
                  style={{ borderTop: i > 0 ? "1px solid #f2f4f6" : "none" }}>
                  <div style={iconWrap("#f2f4f6","#6d7a77")}>
                    <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#191c1e" }}>{displayLabel}</p>
                    <p style={{ fontSize: 12, color: "#6d7a77", marginTop: 1 }}>{displaySub}</p>
                  </div>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#bcc9c6" }}>chevron_right</span>
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            width: "100%", background: "transparent", color: "#ef4444",
            border: "1.5px solid #ef4444", borderRadius: 16, padding: "15px 24px",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 150ms",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="mat-icon" style={{ fontSize: 18 }}>logout</span>
            {t("profile.logout")}
          </button>

          {/* Delete account */}
          <button onClick={() => { setDeleteError(""); setDeleteModal(true); }} style={{
            width: "100%", background: "transparent", color: "#9ca3af",
            border: "none", borderRadius: 16, padding: "12px 24px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 4,
          }}>
            <span className="mat-icon" style={{ fontSize: 15 }}>delete_forever</span>
            Удалить аккаунт
          </button>
        </div>

        {/* ── Edit name modal ── */}
        {editModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,30,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)", animation: "fadeIn 150ms ease" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={iconWrap("#c2ebe3","#00685f")}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>edit</span>
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Изменить имя</p>
              </div>
              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                placeholder="Ваше имя" autoFocus
                style={{ width: "100%", border: "1.5px solid #eceef0", borderRadius: 14, padding: "13px 16px", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12, background: "#f7f9fb", transition: "border-color 150ms", fontFamily: "inherit" }}
                onFocus={(e) => e.target.style.borderColor = "#00685f"}
                onBlur={(e) => e.target.style.borderColor = "#eceef0"}
              />
              {editError && (
                <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
                  {editError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditModal(false)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Отмена
                </button>
                <button onClick={handleSaveName} disabled={editLoading || !editName.trim()}
                  style={{ flex: 1, background: editLoading || !editName.trim() ? "#eceef0" : "linear-gradient(135deg,#00685f,#008378)", color: editLoading || !editName.trim() ? "#bcc9c6" : "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: editLoading || !editName.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {editLoading && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  {editLoading ? "Сохраняем..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete account modal ── */}
        {deleteModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,30,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)", animation: "fadeIn 150ms ease" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ ...iconWrap("#fef2f2", "#ef4444") }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#ef4444" }}>delete_forever</span>
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Удалить аккаунт?</p>
              </div>
              <p style={{ fontSize: 14, color: "#6d7a77", marginBottom: 20, lineHeight: 1.5 }}>
                Все ваши данные, заказы и история будут удалены безвозвратно. Это действие нельзя отменить.
              </p>
              {deleteError && (
                <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
                  {deleteError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteModal(false)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Отмена
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading}
                  style={{ flex: 1, background: deleteLoading ? "#eceef0" : "#ef4444", color: deleteLoading ? "#bcc9c6" : "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: deleteLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {deleteLoading && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  {deleteLoading ? "Удаляем..." : "Удалить"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderTop: "1px solid #f2f4f6", display: "flex", justifyContent: "space-around", padding: "8px 0 20px", zIndex: 100 }}>
          {[
            { icon: "home", label: "Главная", path: "/" },
            { icon: "receipt_long", label: "Заказы", path: "/orders" },
            { icon: "smart_toy", label: "ИИ", path: "/ai-chat" },
            { icon: "person", label: "Профиль", path: "/profile" },
          ].map(({ icon, label, path }) => {
            const active = path === "/profile";
            return (
              <button key={path} onClick={() => router.push(path)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" }}>
                <span className="mat-icon" style={{ fontSize: 22, color: active ? "#00685f" : "#bcc9c6", fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#00685f" : "#bcc9c6" }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#bcc9c6",
  textTransform: "uppercase", letterSpacing: "0.6px",
  marginBottom: 14,
};

function iconWrap(bg: string, _color: string): React.CSSProperties {
  return {
    width: 38, height: 38, borderRadius: 12,
    background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLoyaltyBalance, getLoyaltyHistory, redeemLoyaltyPoints, LoyaltyBalance, LoyaltyTransaction } from "@/lib/api";

const TIER_CONFIG = {
  BRONZE: { icon: "military_tech", color: "#CD7F32", bg: "#fdf6ee", label: "Бронза" },
  SILVER: { icon: "military_tech", color: "#94A3B8", bg: "#f4f6f8", label: "Серебро" },
  GOLD:   { icon: "military_tech", color: "#F59E0B", bg: "#fffbeb", label: "Золото" },
} as const;

const TYPE_ICONS: Record<LoyaltyTransaction["type"], string> = {
  EARNED: "arrow_upward",
  SPENT: "arrow_downward",
  MILESTONE: "flag",
  BONUS: "card_giftcard",
};

const TYPE_COLORS: Record<LoyaltyTransaction["type"], string> = {
  EARNED: "#16a34a",
  SPENT: "#ef4444",
  MILESTONE: "#00685f",
  BONUS: "#f59e0b",
};

const PRESET_POINTS = [100, 500, 1000];
const PAGE_SIZE = 20;

export default function LoyaltyPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
  }, [router]);

  const fetchBalance = useCallback(async () => {
    try { setBalance(await getLoyaltyBalance()); } catch {}
  }, []);

  const fetchHistory = useCallback(async (p: number, append: boolean) => {
    setHistoryLoading(true);
    try {
      const res = await getLoyaltyHistory(p, PAGE_SIZE);
      setHistory((prev) => append ? [...prev, ...res.data] : res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {}
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    Promise.all([fetchBalance(), fetchHistory(1, false)]).finally(() => setLoading(false));
  }, [fetchBalance, fetchHistory]);

  async function handleRedeem() {
    const pts = parseInt(redeemPoints, 10);
    if (!pts || pts <= 0) return;
    setRedeemError(""); setRedeemSuccess(""); setRedeemLoading(true);
    try {
      const res = await redeemLoyaltyPoints(pts);
      setRedeemSuccess(`Начислена скидка ${res.discountAmount.toLocaleString("ru-RU")} сум`);
      setRedeemPoints("");
      fetchBalance();
      fetchHistory(1, false);
    } catch (e: unknown) {
      setRedeemError(e instanceof Error ? e.message : "Ошибка");
    } finally { setRedeemLoading(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fb" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const tier = balance?.tier ?? "BRONZE";
  const tierCfg = TIER_CONFIG[tier];
  const points = balance?.points ?? 0;
  const nextTierAt = balance?.nextTierAt;
  const nextTierName = balance?.nextTierName;
  const progress = nextTierAt && nextTierAt > 0 ? Math.min(points / nextTierAt, 1) : 1;
  const redeemPts = parseInt(redeemPoints, 10) || 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => router.push("/profile")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
              </button>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Мои бонусы</p>
              <div style={{ width: 38 }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Balance card */}
          <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", borderRadius: 24, padding: "28px 24px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,104,95,0.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Ваши баллы</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <span className="mat-icon" style={{ fontSize: 40, color: "#89f5e7", fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <p style={{ fontSize: 52, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-1px", lineHeight: 1 }}>
                {points.toLocaleString("ru-RU")}
              </p>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "7px 18px", backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 18, color: tierCfg.color, fontVariationSettings: "'FILL' 1" }}>{tierCfg.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>{tierCfg.label}</span>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTierAt !== null && nextTierName && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 13, color: "#6d7a77" }}>
                  До уровня <strong style={{ color: "#00685f" }}>{nextTierName}</strong>
                </p>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#00685f" }}>
                  {((nextTierAt ?? 0) - points).toLocaleString("ru-RU")} баллов
                </span>
              </div>
              <div style={{ height: 8, background: "#f2f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "linear-gradient(90deg,#00685f,#008378)", borderRadius: 999, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#bcc9c6" }}>{points.toLocaleString("ru-RU")}</span>
                <span style={{ fontSize: 11, color: "#bcc9c6" }}>{(nextTierAt ?? 0).toLocaleString("ru-RU")}</span>
              </div>
            </div>
          )}

          {/* Redeem button */}
          {points > 0 && (
            <button onClick={() => { setRedeemOpen(true); setRedeemError(""); setRedeemSuccess(""); }}
              style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 18px rgba(0,104,95,0.25)" }}>
              <span className="mat-icon" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
              Списать баллы на скидку
            </button>
          )}

          {/* History */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #f2f4f6" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", textTransform: "uppercase", letterSpacing: 0.6 }}>История начислений</p>
            </div>

            {history.length === 0 && !historyLoading && (
              <div style={{ padding: "44px 20px", textAlign: "center" }}>
                <span className="mat-icon" style={{ fontSize: 44, color: "#eceef0", display: "block", marginBottom: 10 }}>history</span>
                <p style={{ fontSize: 14, color: "#bcc9c6" }}>История пока пуста</p>
              </div>
            )}

            {history.map((item, i) => {
              const isPositive = item.type !== "SPENT";
              const d = new Date(item.createdAt);
              const dateStr = `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
              const iconColor = TYPE_COLORS[item.type];
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: i < history.length - 1 ? "1px solid #f2f4f6" : "none", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${iconColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="mat-icon" style={{ fontSize: 18, color: iconColor, fontVariationSettings: "'FILL' 1" }}>{TYPE_ICONS[item.type]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#191c1e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                    <p style={{ fontSize: 12, color: "#bcc9c6", marginTop: 2 }}>{dateStr}</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: isPositive ? "#16a34a" : "#ef4444", flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    {isPositive ? "+" : ""}{item.points}
                  </p>
                </div>
              );
            })}

            {historyLoading && (
              <div style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
              </div>
            )}

            {page < totalPages && !historyLoading && (
              <button onClick={() => fetchHistory(page + 1, true)}
                style={{ width: "100%", padding: "14px", background: "transparent", border: "none", borderTop: "1px solid #f2f4f6", fontSize: 14, color: "#00685f", fontWeight: 700, cursor: "pointer" }}>
                Загрузить ещё
              </button>
            )}
          </div>
        </div>

        {/* ── Redeem bottom sheet ── */}
        {redeemOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, background: "rgba(25,28,30,0.45)", backdropFilter: "blur(4px)" }} onClick={() => { setRedeemOpen(false); setRedeemPoints(""); }} />
            <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 40px", width: "100%", maxWidth: 520, margin: "0 auto", animation: "slideUp 250ms ease" }}>
              <div style={{ width: 40, height: 4, background: "#eceef0", borderRadius: 999, margin: "0 auto 20px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mat-icon" style={{ fontSize: 20, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Списать баллы</p>
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: "#6d7a77", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Количество баллов</p>
              <input type="number" value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="0" max={points}
                style={{ width: "100%", fontSize: 28, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", border: "none", background: "#f7f9fb", borderRadius: 16, padding: "14px 16px", textAlign: "center", outline: "none", boxSizing: "border-box", boxShadow: "0 0 0 1.5px #eceef0" }}
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px #00685f40"}
                onBlur={(e) => e.target.style.boxShadow = "0 0 0 1.5px #eceef0"}
              />

              <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
                {PRESET_POINTS.filter(p => p <= points).map((p) => {
                  const active = redeemPoints === String(p);
                  return (
                    <button key={p} onClick={() => setRedeemPoints(String(p))}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: active ? "linear-gradient(135deg,#00685f,#008378)" : "#f2f4f6", color: active ? "#fff" : "#6d7a77", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 150ms" }}>
                      {p}
                    </button>
                  );
                })}
              </div>

              {redeemPts > 0 && (
                <div style={{ background: "#f2f4f6", borderRadius: 14, padding: "12px 16px", textAlign: "center", marginBottom: 12, fontSize: 14, color: "#00685f", fontWeight: 700 }}>
                  ≈ {(redeemPts * 100).toLocaleString("ru-RU")} сум скидки
                </div>
              )}

              {redeemError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
                  {redeemError}
                </div>
              )}
              {redeemSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>check_circle</span>
                  {redeemSuccess}
                </div>
              )}

              <button onClick={handleRedeem} disabled={redeemPts <= 0 || redeemPts > points || redeemLoading}
                style={{ width: "100%", background: redeemPts <= 0 || redeemPts > points ? "#eceef0" : "linear-gradient(135deg,#00685f,#008378)", color: redeemPts <= 0 || redeemPts > points ? "#bcc9c6" : "#fff", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 700, cursor: redeemPts <= 0 ? "not-allowed" : "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: redeemPts > 0 && redeemPts <= points ? "0 6px 18px rgba(0,104,95,0.22)" : "none" }}>
                {redeemLoading && <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                {redeemLoading ? "Списываем..." : "Подтвердить"}
              </button>
              <button onClick={() => { setRedeemOpen(false); setRedeemPoints(""); }}
                style={{ width: "100%", background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

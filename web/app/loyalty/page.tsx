"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCoins, FaExchangeAlt } from "react-icons/fa";
import {
  getLoyaltyBalance,
  getLoyaltyHistory,
  redeemLoyaltyPoints,
  LoyaltyBalance,
  LoyaltyTransaction,
} from "@/lib/api";

const TIER_CONFIG = {
  BRONZE: { emoji: "🥉", color: "#CD7F32", label: "Бронза" },
  SILVER: { emoji: "🥈", color: "#94A3B8", label: "Серебро" },
  GOLD:   { emoji: "🥇", color: "#F59E0B", label: "Золото" },
} as const;

const TYPE_ICONS: Record<LoyaltyTransaction["type"], string> = {
  EARNED: "⬆️",
  SPENT: "⬇️",
  MILESTONE: "🎯",
  BONUS: "🎁",
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
    setRedeemError("");
    setRedeemSuccess("");
    setRedeemLoading(true);
    try {
      const res = await redeemLoyaltyPoints(pts);
      setRedeemSuccess(`✅ Начислена скидка ${res.discountAmount.toLocaleString("ru-RU")} сум`);
      setRedeemPoints("");
      fetchBalance();
      fetchHistory(1, false);
    } catch (e: unknown) {
      setRedeemError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRedeemLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => router.push("/profile")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <FaArrowLeft size={15} />
            </button>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Мои бонусы</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Balance card */}
        <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", borderRadius: 20, padding: "28px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(13,148,136,0.3)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ваши баллы</p>
          <p style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: 1, margin: "0 0 12px" }}>{points.toLocaleString("ru-RU")}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 16px" }}>
            <span style={{ fontSize: 18 }}>{tierCfg.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>{tierCfg.label}</span>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTierAt !== null && nextTierName && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
              До уровня <strong style={{ color: "#0d9488" }}>{nextTierName}</strong> — ещё {((nextTierAt ?? 0) - points).toLocaleString("ru-RU")} баллов
            </p>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "#0d9488", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{points.toLocaleString("ru-RU")}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{(nextTierAt ?? 0).toLocaleString("ru-RU")}</span>
            </div>
          </div>
        )}

        {/* Redeem button */}
        {points > 0 && (
          <button
            onClick={() => { setRedeemOpen(true); setRedeemError(""); setRedeemSuccess(""); }}
            style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <FaExchangeAlt size={14} /> Списать баллы на скидку
          </button>
        )}

        {/* Redeem modal */}
        {redeemOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520 }}>
              <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "0 auto 20px" }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 20 }}>Списать баллы</p>

              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Количество баллов</p>
              <input
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="0"
                max={points}
                style={{ width: "100%", fontSize: 28, fontWeight: 700, color: "#0f172a", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", textAlign: "center", outline: "none", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
                {PRESET_POINTS.filter(p => p <= points).map((p) => (
                  <button
                    key={p}
                    onClick={() => setRedeemPoints(String(p))}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: redeemPoints === String(p) ? "2px solid #0d9488" : "1.5px solid #e2e8f0", background: redeemPoints === String(p) ? "#f0fdfa" : "#f8fafc", color: redeemPoints === String(p) ? "#0d9488" : "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {redeemPts > 0 && (
                <p style={{ fontSize: 14, color: "#0d9488", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
                  ≈ {(redeemPts * 100).toLocaleString("ru-RU")} сум скидки
                </p>
              )}

              {redeemError && <p style={{ fontSize: 13, color: "#dc2626", textAlign: "center", marginBottom: 8 }}>{redeemError}</p>}
              {redeemSuccess && <p style={{ fontSize: 13, color: "#16a34a", textAlign: "center", marginBottom: 8 }}>{redeemSuccess}</p>}

              <button
                onClick={handleRedeem}
                disabled={redeemPts <= 0 || redeemPts > points || redeemLoading}
                style={{ width: "100%", background: redeemPts <= 0 || redeemPts > points ? "#94a3b8" : "#0d9488", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 700, cursor: redeemPts <= 0 ? "not-allowed" : "pointer", marginBottom: 10 }}
              >
                {redeemLoading ? "Списываем..." : "Подтвердить"}
              </button>
              <button
                onClick={() => { setRedeemOpen(false); setRedeemPoints(""); }}
                style={{ width: "100%", background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>История начислений</p>
          </div>

          {history.length === 0 && !historyLoading && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <FaCoins size={28} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: "#94a3b8" }}>История пока пуста</p>
            </div>
          )}

          {history.map((item, i) => {
            const isPositive = item.type !== "SPENT";
            const d = new Date(item.createdAt);
            const dateStr = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < history.length - 1 ? "1px solid #f8fafc" : "none", gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" }}>{TYPE_ICONS[item.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{dateStr}</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: isPositive ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                  {isPositive ? "+" : ""}{item.points}
                </p>
              </div>
            );
          })}

          {page < totalPages && (
            <button
              onClick={() => fetchHistory(page + 1, true)}
              disabled={historyLoading}
              style={{ width: "100%", padding: "14px", background: "transparent", border: "none", borderTop: "1px solid #f1f5f9", fontSize: 14, color: "#0d9488", fontWeight: 600, cursor: "pointer" }}
            >
              {historyLoading ? "Загружаем..." : "Загрузить ещё"}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

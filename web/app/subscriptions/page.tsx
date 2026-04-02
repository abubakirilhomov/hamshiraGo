"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCheckCircle, FaShoppingCart, FaPercent } from "react-icons/fa";
import {
  getSubscriptionTiers,
  getMySubscription,
  purchaseSubscription,
  cancelSubscription,
  SubscriptionTier,
  Subscription,
} from "@/lib/api";

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function SubscriptionsPage() {
  const router = useRouter();

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmTier, setConfirmTier] = useState<SubscriptionTier | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [tiersRes, subRes] = await Promise.all([
        getSubscriptionTiers(),
        getMySubscription().catch(() => null),
      ]);
      setTiers(tiersRes.filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      setSubscription(subRes);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handlePurchase() {
    if (!confirmTier) return;
    setActionLoading(true);
    setError("");
    try {
      await purchaseSubscription(confirmTier.id);
      setConfirmTier(null);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError("");
    try {
      await cancelSubscription();
      setConfirmCancel(false);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setActionLoading(false);
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

  const activeSub = subscription?.status === "ACTIVE" ? subscription : null;

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
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Подписки</p>
            <div style={{ width: 36 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Active subscription */}
        {activeSub && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "2px solid #0d9488", boxShadow: "0 2px 12px rgba(13,148,136,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <FaCheckCircle size={18} color="#0d9488" />
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", flex: 1 }}>{activeSub.tier.name}</p>
              <span style={{ background: "#f0fdfa", color: "#0d9488", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" }}>Активна</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Скидка {activeSub.tier.discountPercent}% на каждый заказ</span>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{formatPrice(activeSub.tier.price)} сум/мес</span>
            </div>

            {/* Orders progress */}
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
              Заказов использовано: {activeSub.ordersUsed} / {activeSub.tier.maxOrders}
            </p>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${Math.min(Math.round(activeSub.ordersUsed / activeSub.tier.maxOrders * 100), 100)}%`, background: "#0d9488", borderRadius: 4 }} />
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
              Действует до {formatDate(activeSub.expiresAt)}
            </p>

            <button
              onClick={() => setConfirmCancel(true)}
              style={{ width: "100%", background: "transparent", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Отменить подписку
            </button>
          </div>
        )}

        {/* Tiers */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>Тарифы</p>

        {tiers.map((tier) => {
          const isCurrent = activeSub?.tierId === tier.id;
          return (
            <div
              key={tier.id}
              style={{ background: "#fff", borderRadius: 16, padding: "20px", border: isCurrent ? "2px solid #0d9488" : "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{tier.name}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0d9488" }}>{formatPrice(tier.price)} сум</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FaShoppingCart size={12} color="#64748b" />
                  <span style={{ fontSize: 14, color: "#64748b" }}>{tier.maxOrders} заказов в месяц</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FaPercent size={12} color="#64748b" />
                  <span style={{ fontSize: 14, color: "#64748b" }}>Скидка {tier.discountPercent}% на каждый заказ</span>
                </div>
              </div>

              {tier.description && (
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>{tier.description}</p>
              )}

              {isCurrent ? (
                <div style={{ background: "#f0fdfa", borderRadius: 10, padding: "11px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <FaCheckCircle size={13} color="#0d9488" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0d9488" }}>Текущий тариф</span>
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmTier(tier); setError(""); }}
                  disabled={actionLoading || !!activeSub}
                  style={{ width: "100%", background: activeSub ? "#94a3b8" : "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: activeSub ? "not-allowed" : "pointer" }}
                >
                  {activeSub ? "Уже есть подписка" : "Подключить"}
                </button>
              )}
            </div>
          );
        })}

        {tiers.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "40px 0" }}>Тарифы не найдены</p>
        )}
      </div>

      {/* Confirm purchase modal */}
      {confirmTier && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12, textAlign: "center" }}>Подключить подписку</p>
            <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>
              <strong>{confirmTier.name}</strong> — {formatPrice(confirmTier.price)} сум/мес
            </p>
            {error && <p style={{ fontSize: 13, color: "#dc2626", textAlign: "center", marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmTier(null)} style={{ flex: 1, background: "transparent", border: "1.5px solid #e2e8f0", color: "#64748b", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Отмена
              </button>
              <button onClick={handlePurchase} disabled={actionLoading} style={{ flex: 1, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "..." : "Подключить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cancel modal */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12, textAlign: "center" }}>Отменить подписку?</p>
            <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>Скидки перестанут применяться после отмены.</p>
            {error && <p style={{ fontSize: 13, color: "#dc2626", textAlign: "center", marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, background: "transparent", border: "1.5px solid #e2e8f0", color: "#64748b", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Назад
              </button>
              <button onClick={handleCancel} disabled={actionLoading} style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "..." : "Отменить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

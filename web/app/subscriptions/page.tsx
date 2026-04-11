"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSubscriptionTiers, getMySubscription, purchaseSubscription, cancelSubscription, SubscriptionTier, Subscription } from "@/lib/api";

function formatPrice(n: number) { return n.toLocaleString("ru-RU"); }
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
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
      const [tiersRes, subRes] = await Promise.all([getSubscriptionTiers(), getMySubscription().catch(() => null)]);
      setTiers(tiersRes.filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      setSubscription(subRes);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handlePurchase() {
    if (!confirmTier) return;
    setActionLoading(true); setError("");
    try { await purchaseSubscription(confirmTier.id); setConfirmTier(null); await fetchData(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setActionLoading(false); }
  }

  async function handleCancel() {
    setActionLoading(true); setError("");
    try { await cancelSubscription(); setConfirmCancel(false); await fetchData(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setActionLoading(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fb" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const activeSub = subscription?.status === "ACTIVE" ? subscription : null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
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
              <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Подписки</p>
              <div style={{ width: 38 }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "-20px auto 0", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Active subscription banner */}
          {activeSub && (
            <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "2px solid rgba(0,104,95,0.25)", boxShadow: "0 4px 20px rgba(0,104,95,0.12)", animation: "fadeIn 200ms ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mat-icon" style={{ fontSize: 20, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{activeSub.tier.name}</p>
                  <span style={{ background: "#c2ebe3", color: "#00685f", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>Активна</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{formatPrice(activeSub.tier.price)} сум</p>
              </div>

              <div style={{ background: "#f7f9fb", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#6d7a77" }}>Использовано заказов</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#191c1e" }}>{activeSub.ordersUsed} / {activeSub.tier.maxOrders}</span>
                </div>
                <div style={{ height: 8, background: "#eceef0", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(Math.round(activeSub.ordersUsed / activeSub.tier.maxOrders * 100), 100)}%`, background: "linear-gradient(90deg,#00685f,#008378)", borderRadius: 999, transition: "width 0.5s ease" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="mat-icon" style={{ fontSize: 14, color: "#00685f" }}>discount</span>
                  <span style={{ fontSize: 13, color: "#6d7a77" }}>Скидка {activeSub.tier.discountPercent}% на заказ</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="mat-icon" style={{ fontSize: 14, color: "#bcc9c6" }}>calendar_today</span>
                  <span style={{ fontSize: 12, color: "#bcc9c6" }}>до {formatDate(activeSub.expiresAt)}</span>
                </div>
              </div>

              <button onClick={() => setConfirmCancel(true)}
                style={{ width: "100%", background: "transparent", border: "1.5px solid #ef4444", color: "#ef4444", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Отменить подписку
              </button>
            </div>
          )}

          {/* Section label */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "#bcc9c6", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>Тарифы</p>

          {/* Tiers */}
          {tiers.map((tier, idx) => {
            const isCurrent = activeSub?.tierId === tier.id;
            const isPopular = idx === 1;
            return (
              <div key={tier.id} style={{ background: "#fff", borderRadius: 20, padding: 20, border: isCurrent ? "2px solid rgba(0,104,95,0.4)" : isPopular ? "2px solid rgba(0,104,95,0.15)" : "none", boxShadow: "0 2px 14px rgba(0,0,0,0.06)", position: "relative" }}>

                {isPopular && !isCurrent && (
                  <div style={{ position: "absolute", top: -10, right: 18, background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999, letterSpacing: "0.3px" }}>
                    Популярный
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{tier.name}</p>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{formatPrice(tier.price)}</p>
                    <p style={{ fontSize: 11, color: "#bcc9c6" }}>сум/мес</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="mat-icon" style={{ fontSize: 14, color: "#00685f" }}>shopping_cart</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#3d4947" }}>{tier.maxOrders} заказов в месяц</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="mat-icon" style={{ fontSize: 14, color: "#00685f" }}>discount</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#3d4947" }}>Скидка {tier.discountPercent}% на каждый заказ</span>
                  </div>
                </div>

                {tier.description && (
                  <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 14, lineHeight: 1.5 }}>{tier.description}</p>
                )}

                {isCurrent ? (
                  <div style={{ background: "#c2ebe3", borderRadius: 12, padding: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span className="mat-icon" style={{ fontSize: 16, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#00685f" }}>Текущий тариф</span>
                  </div>
                ) : (
                  <button onClick={() => { setConfirmTier(tier); setError(""); }}
                    disabled={actionLoading || !!activeSub}
                    style={{
                      width: "100%",
                      background: activeSub ? "#f2f4f6" : "linear-gradient(135deg,#00685f,#008378)",
                      color: activeSub ? "#bcc9c6" : "#fff",
                      border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700,
                      cursor: activeSub ? "not-allowed" : "pointer",
                      boxShadow: activeSub ? "none" : "0 4px 14px rgba(0,104,95,0.22)",
                    }}>
                    {activeSub ? "Уже есть подписка" : "Подключить"}
                  </button>
                )}
              </div>
            );
          })}

          {tiers.length === 0 && (
            <div style={{ textAlign: "center", padding: "44px 0" }}>
              <span className="mat-icon" style={{ fontSize: 44, color: "#eceef0", display: "block", marginBottom: 10 }}>layers</span>
              <p style={{ fontSize: 14, color: "#bcc9c6" }}>Тарифы не найдены</p>
            </div>
          )}
        </div>

        {/* ── Confirm purchase modal ── */}
        {confirmTier && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,30,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <span className="mat-icon" style={{ fontSize: 26, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>layers</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 6 }}>Подключить подписку</p>
                <p style={{ fontSize: 14, color: "#6d7a77" }}>
                  <strong style={{ color: "#191c1e" }}>{confirmTier.name}</strong> — {formatPrice(confirmTier.price)} сум/мес
                </p>
              </div>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmTier(null)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Отмена
                </button>
                <button onClick={handlePurchase} disabled={actionLoading} style={{ flex: 1, background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: actionLoading ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {actionLoading && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  {actionLoading ? "..." : "Подключить"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm cancel modal ── */}
        {confirmCancel && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,30,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <span className="mat-icon" style={{ fontSize: 26, color: "#ef4444", fontVariationSettings: "'FILL' 1" }}>cancel</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 6 }}>Отменить подписку?</p>
                <p style={{ fontSize: 14, color: "#6d7a77", lineHeight: 1.5 }}>Скидки перестанут применяться после отмены.</p>
              </div>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                  <span className="mat-icon" style={{ fontSize: 16 }}>error</span>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, background: "#f2f4f6", color: "#6d7a77", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Назад
                </button>
                <button onClick={handleCancel} disabled={actionLoading} style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: actionLoading ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {actionLoading && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  {actionLoading ? "..." : "Отменить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

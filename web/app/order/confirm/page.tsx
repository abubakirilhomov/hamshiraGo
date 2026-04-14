"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTelegram, useTelegramBackButton, useTelegramMainButton, useHaptic } from "@/hooks/useTelegram";
import { api, formatPrice } from "@/lib/api";
import { useTranslation } from "react-i18next";

function ConfirmForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslation();

  const serviceId    = params.get("service")      ?? "";
  const serviceTitle = params.get("title")        ?? t("confirm.service");
  const price        = parseInt(params.get("price") || "0", 10);
  const address      = params.get("address")      ?? "";
  const floor        = params.get("floor")        ?? "";
  const apartment    = params.get("apartment")    ?? "";
  const phone        = params.get("phone")        ?? "";
  const lat          = parseFloat(params.get("lat") || "41.2995");
  const lng          = parseFloat(params.get("lng") || "69.2401");

  const [discount, setDiscount] = useState(0);
  const [checkingDiscount, setCheckingDiscount] = useState(true);
  const [discountError, setDiscountError] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentFeePercent, setUrgentFeePercent] = useState(50);
  const urgentFee = isUrgent ? Math.round(price * urgentFeePercent / 100) : 0;
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoLoading, setPromoLoading] = useState(false);
  const totalDiscount = discount + promoDiscount;
  const total = price + urgentFee - totalDiscount;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promFocused, setPromoFocused] = useState(false);

  useEffect(() => {
    api.settings.get().then((s) => setUrgentFeePercent(s.urgentFeePercent ?? 50)).catch(() => {});
  }, []);

  useEffect(() => {
    api.orders.list()
      .then((orders) => {
        if (orders.length === 0) setDiscount(Math.round(price * 0.1));
      })
      .catch(() => setDiscountError(true))
      .finally(() => setCheckingDiscount(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { inTelegram } = useTelegram();
  const { notify } = useHaptic();
  useTelegramBackButton(() => router.back());
  useTelegramMainButton({ text: loading ? t("confirm.loading") : t("confirm.confirm"), onClick: handleConfirm, loading, color: "#00685f" });

  async function handleConfirm() {
    setError(""); setLoading(true);
    try {
      const order = await api.orders.create({
        serviceId,
        discountAmount: totalDiscount || undefined,
        isUrgent: isUrgent || undefined,
        location: { latitude: lat, longitude: lng, house: address, floor: floor || undefined, apartment: apartment || undefined, phone },
      });
      notify("success");
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      notify("error");
      setError(err instanceof Error ? err.message : t("common.error"));
      setLoading(false);
    }
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await api.promo.validate(promoCode.trim());
      if (res.valid) { setPromoDiscount(res.discountAmount); setPromoStatus("valid"); }
      else { setPromoDiscount(0); setPromoStatus("invalid"); }
    } catch { setPromoStatus("invalid"); }
    finally { setPromoLoading(false); }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .card { background:#fff; border-radius:20px; padding:18px; margin-bottom:12px;
          box-shadow:0 2px 12px rgba(0,0,0,0.06); }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
              <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.2px" }}>
              {t("confirm.title")}
            </h1>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 100px" }}>

          {/* Service */}
          <div className="card">
            <p style={secLabel}>{t("confirm.service")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="mat-icon" style={{ fontSize: 26, color: "#00685f", fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{serviceTitle}</p>
                <p style={{ fontSize: 13, color: "#6d7a77", marginTop: 2 }}>{t("confirm.serviceCost")}: {formatPrice(price)} UZS</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <p style={secLabel}>{t("confirm.address")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span className="mat-icon" style={{ fontSize: 16, color: "#00685f" }}>home</span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#191c1e" }}>{address}</p>
                  {(floor || apartment) && (
                    <p style={{ fontSize: 13, color: "#6d7a77", marginTop: 3 }}>
                      {floor ? `${t("confirm.floor")} ${floor}` : ""}
                      {floor && apartment ? ", " : ""}
                      {apartment ? `${t("confirm.apt")} ${apartment}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="mat-icon" style={{ fontSize: 16, color: "#00685f" }}>phone</span>
                </div>
                <p style={{ fontSize: 14, color: "#3d4947", fontWeight: 500 }}>{phone}</p>
              </div>
            </div>
          </div>

          {/* Urgent toggle */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#f59e0b" }}>bolt</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e" }}>{t("confirm.urgentLabel")}</p>
                </div>
                <p style={{ fontSize: 12, color: "#6d7a77", lineHeight: 1.4 }}>{t("confirm.urgentDescription")}</p>
              </div>
              <button onClick={() => setIsUrgent(!isUrgent)} style={{
                width: 52, height: 28, borderRadius: 14, border: "none",
                background: isUrgent ? "#f59e0b" : "#eceef0",
                cursor: "pointer", position: "relative", transition: "background 200ms", flexShrink: 0,
              }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isUrgent ? 27 : 3, transition: "left 200ms", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
            {isUrgent && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                <span className="mat-icon" style={{ fontSize: 16 }}>bolt</span>
                {t("confirm.urgentFee")}: +{urgentFeePercent}% (+{formatPrice(urgentFee)} UZS)
              </div>
            )}
          </div>

          {/* Promo code */}
          <div className="card">
            <p style={secLabel}>Промо-код</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus("idle"); setPromoDiscount(0); }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                onFocus={() => setPromoFocused(true)} onBlur={() => setPromoFocused(false)}
                placeholder="Введите промо-код"
                maxLength={50}
                style={{
                  flex: 1, border: "none", outline: "none", borderRadius: 14, padding: "12px 16px",
                  fontSize: 14, textTransform: "uppercase", color: "#191c1e", background: "#f7f9fb",
                  boxShadow: promFocused
                    ? "0 0 0 2px #00685f40"
                    : promoStatus === "valid" ? "0 0 0 2px #22c55e50"
                    : promoStatus === "invalid" ? "0 0 0 2px #ef444440"
                    : "0 0 0 1.5px #eceef0",
                  transition: "box-shadow 150ms",
                }}
              />
              <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: promoLoading || !promoCode.trim() ? 0.55 : 1, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {promoLoading
                  ? <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>
                  : <span className="mat-icon" style={{ fontSize: 16 }}>local_offer</span>
                }
                Применить
              </button>
            </div>
            {promoStatus === "valid" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#16a34a", fontWeight: 600, marginTop: 10 }}>
                <span className="mat-icon" style={{ fontSize: 16 }}>check_circle</span>
                Скидка {formatPrice(promoDiscount)} UZS применена
              </div>
            )}
            {promoStatus === "invalid" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ef4444", fontWeight: 600, marginTop: 10 }}>
                <span className="mat-icon" style={{ fontSize: 16 }}>cancel</span>
                Промо-код не найден или истёк
              </div>
            )}
          </div>

          {/* Price breakdown */}
          <div className="card">
            <p style={secLabel}>{t("confirm.price")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "#6d7a77" }}>{t("confirm.serviceCost")}</span>
                <span style={{ fontSize: 14, color: "#191c1e", fontWeight: 600 }}>{formatPrice(price)} UZS</span>
              </div>

              {checkingDiscount && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#bcc9c6" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.7s linear infinite" }} />
                  {t("confirm.checkingDiscount")}
                </div>
              )}
              {!checkingDiscount && discountError && (
                <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 500 }}>{t("confirm.discountCheckFailed")}</div>
              )}

              {isUrgent && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                    <span className="mat-icon" style={{ fontSize: 14 }}>bolt</span>
                    {t("confirm.urgentFee")}
                  </span>
                  <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 700 }}>+{formatPrice(urgentFee)} UZS</span>
                </div>
              )}

              {!checkingDiscount && discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#16a34a", fontWeight: 600 }}>
                    <span className="mat-icon" style={{ fontSize: 14 }}>card_giftcard</span>
                    {t("confirm.discount")}
                  </span>
                  <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 700 }}>−{formatPrice(discount)} UZS</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#16a34a", fontWeight: 600 }}>
                    <span className="mat-icon" style={{ fontSize: 14 }}>local_offer</span>
                    Промо-код
                  </span>
                  <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 700 }}>−{formatPrice(promoDiscount)} UZS</span>
                </div>
              )}

              <div style={{ height: 1, background: "#f2f4f6" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#191c1e" }}>{t("confirm.total")}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {formatPrice(total)} UZS
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#fef2f2", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
              <span className="mat-icon" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
              {error}
            </div>
          )}

          {/* CTA (non-Telegram) */}
          {!inTelegram && (
            <>
              <button onClick={handleConfirm} disabled={loading} style={{
                width: "100%", background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff",
                fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif",
                borderRadius: 16, padding: "16px 24px", border: "none",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
                marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 6px 20px rgba(0,104,95,0.28)", transition: "opacity 150ms",
              }}>
                {loading && <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                {loading ? t("confirm.loading") : t("confirm.confirm")}
              </button>
              <button onClick={() => router.back()} disabled={loading} style={{
                width: "100%", background: "#f2f4f6", color: "#6d7a77",
                fontSize: 15, fontWeight: 700, borderRadius: 16,
                padding: "15px 24px", border: "none", cursor: "pointer",
              }}>
                {t("confirm.cancel")}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f9fb" }} />}>
      <ConfirmForm />
    </Suspense>
  );
}

const secLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#bcc9c6",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14,
};

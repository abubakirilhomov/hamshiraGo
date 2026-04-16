"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), { ssr: false });
import {
  api,
  WS_URL,
  Order,
  OrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  formatPrice,
  PaymentProvider,
  getFavorites,
  addFavorite,
  ChatMessage,
} from "@/lib/api";

function StatusBadge({ status }: { status: OrderStatus }) {
  const { text, bg } = ORDER_STATUS_COLOR[status];
  return (
    <span style={{
      padding: "5px 14px", borderRadius: 999,
      fontSize: 12, fontWeight: 700,
      color: text, background: bg,
      whiteSpace: "nowrap", letterSpacing: "0.2px",
    }}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

const STATUS_FLOW: OrderStatus[] = [
  "CREATED", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "SERVICE_STARTED", "DONE",
];

function StatusStepper({ current, canceledLabel, cancelReason }: {
  current: OrderStatus;
  canceledLabel: string;
  cancelReason?: string | null;
}) {
  if (current === "CANCELED") {
    return (
      <div style={{ background: "#fef2f2", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
        <span className="mat-icon" style={{ fontSize: 28, color: "#ef4444", marginBottom: 6, display: "block" }}>cancel</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{canceledLabel}</p>
        {cancelReason && (
          <p style={{ fontSize: 13, color: "#ef4444", marginTop: 6, opacity: 0.7 }}>{cancelReason}</p>
        )}
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(current);

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {STATUS_FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#00685f" : active ? "#fff" : "#eceef0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
                color: done ? "#fff" : active ? "#00685f" : "#bcc9c6",
                border: active ? "2.5px solid #00685f" : "none",
                boxSizing: "border-box", flexShrink: 0,
                boxShadow: active ? "0 0 0 4px rgba(0,104,95,0.12)" : "none",
                transition: "all 200ms",
              }}>
                {done
                  ? <span className="mat-icon" style={{ fontSize: 14, color: "#fff" }}>check</span>
                  : i + 1
                }
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600,
                color: active ? "#00685f" : done ? "#00685f" : "#bcc9c6",
                marginTop: 5, textAlign: "center", width: 46, lineHeight: 1.3,
              }}>
                {ORDER_STATUS_LABEL[s]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 13,
                background: done ? "#00685f" : "#eceef0",
                transition: "background 300ms",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [socketOk, setSocketOk] = useState(true);
  const [medicLocation, setMedicLocation] = useState<{ lat: number; lng: number; heading?: number | null; updatedAt: string } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<PaymentProvider | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "FAILED" | null>(null);
  const [dispatchState, setDispatchState] = useState<{
    status: "searching" | "contacting" | "no_medics";
    candidateName?: string;
  } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoritesChecked, setFavoritesChecked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const myUserId = useRef<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }

    loadOrder();

    const socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketOk(true);
      socket.emit("subscribe_order", id);
    });
    socket.on("disconnect", () => setSocketOk(false));
    socket.on("connect_error", () => setSocketOk(false));

    socket.on("dispatch_update", (payload: {
      status: "searching" | "contacting" | "no_medics";
      medic?: { name: string; latitude: number | null; longitude: number | null; rating: number | null };
    }) => {
      setDispatchState({ status: payload.status, candidateName: payload.medic?.name });
    });

    socket.on("order_status", ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      if (orderId === id) {
        if (status !== "CREATED") setDispatchState(null);
        api.orders.get(id).then(setOrder).catch((err: unknown) => console.error("order refresh failed", err));
      }
    });

    socket.on("medic_location", (payload: { orderId: string; latitude: number; longitude: number; heading?: number | null; updatedAt: string }) => {
      if (payload.orderId !== id) return;
      setMedicLocation({ lat: payload.latitude, lng: payload.longitude, heading: payload.heading, updatedAt: payload.updatedAt });
    });

    socket.on("order_message", (payload: { orderId: string; message: ChatMessage }) => {
      if (payload.orderId !== id) return;
      setMessages((prev) => prev.find((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]);
    });

    try {
      const u = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (u?.id) myUserId.current = u.id;
    } catch {}

    return () => { socket.emit("unsubscribe_order", id); socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!chatOpen) return;
    api.chat.getMessages(id).then(setMessages).catch(() => {});
  }, [chatOpen, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMsg = useCallback(async () => {
    if (!chatInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      await api.chat.sendMessage(id, chatInput.trim());
      setChatInput("");
    } catch {}
    finally { setSendingMsg(false); }
  }, [chatInput, id, sendingMsg]);

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const data = await api.orders.get(id);
      setOrder(data);
      if (data.medic?.latitude != null && data.medic?.longitude != null) {
        setMedicLocation((prev) => prev ?? {
          lat: Number(data.medic!.latitude),
          lng: Number(data.medic!.longitude),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }


  async function handleCancel() {
    if (!confirm(t("order.cancelConfirm"))) return;
    setCanceling(true);
    try {
      await api.orders.cancel(id);
      router.push("/");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
      setCanceling(false);
    }
  }

  async function handleRate(stars: number) {
    setRatingLoading(true);
    try {
      const updated = await api.orders.rate(id, stars, review || undefined);
      setOrder(updated);
      setRating(stars);
      setRatingDone(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setRatingLoading(false);
    }
  }

  useEffect(() => {
    if (order?.status === "DONE") {
      api.payments.getPaymentStatus(order.id)
        .then((res) => setPaymentStatus(res.status))
        .catch(() => {});
    }
  }, [order?.status, order?.id]);

  useEffect(() => {
    if (order?.status !== "DONE" || !order.medic || favoritesChecked) return;
    setFavoritesChecked(true);
    getFavorites()
      .then((list) => {
        const medicId = order.medic!.id;
        setIsFavorite(list.some((f) => f.medicId === medicId));
      })
      .catch(() => {});
  }, [order?.status, order?.medic, favoritesChecked]);

  async function handleAddFavorite() {
    if (!order?.medic || favoriteLoading || isFavorite) return;
    setFavoriteLoading(true);
    try {
      await addFavorite(order.medic.id);
      setIsFavorite(true);
    } catch {}
    finally { setFavoriteLoading(false); }
  }

  async function handleInitiatePayment(provider: PaymentProvider) {
    if (!order) return;
    setPaymentLoading(provider);
    try {
      const res = await api.payments.initiatePayment(order.id, provider);
      window.location.href = res.paymentUrl;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ошибка при создании платежа");
      setPaymentLoading(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fb" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: 14, color: "#6d7a77", fontWeight: 500 }}>{t("order.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f9fb", padding: 24 }}>
        <span className="mat-icon" style={{ fontSize: 48, color: "#bcc9c6", marginBottom: 16 }}>error_outline</span>
        <p style={{ fontSize: 15, color: "#ef4444", marginBottom: 20, fontWeight: 600 }}>{error || t("order.notFound")}</p>
        <button onClick={() => router.push("/orders")} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {t("order.toOrderList")}
        </button>
      </div>
    );
  }

  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const finalPrice = order.priceAmount + (order.urgentFee ?? 0) - order.discountAmount;
  const canCancel = order.status === "CREATED";

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        .mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1;
          letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap;
          -webkit-font-smoothing:antialiased; }
        .card { background:#fff; border-radius:20px; padding:18px; margin-bottom:12px;
          box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .btn-primary { background:linear-gradient(135deg,#00685f,#008378); color:#fff; border:none;
          border-radius:14px; padding:15px 24px; font-size:15px; font-weight:700; cursor:pointer;
          transition:opacity 150ms; width:100%; box-shadow:0 4px 14px rgba(0,104,95,0.22); }
        .btn-primary:disabled { opacity:0.65; cursor:not-allowed; }
        .btn-ghost-teal { background:#f2f4f6; color:#00685f; border:none; border-radius:14px;
          padding:15px 24px; font-size:15px; font-weight:700; cursor:pointer; width:100%;
          transition:background 150ms; }
        .btn-ghost-teal:hover { background:#e6e8ea; }
        .btn-ghost-danger { background:transparent; color:#ef4444; border:1.5px solid #ef4444;
          border-radius:14px; padding:14px 24px; font-size:15px; font-weight:700; cursor:pointer; width:100%; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(145deg,#00685f 0%,#008378 60%,#005049 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-0.3px" }}>HamshiraGo</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => router.push("/orders")} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)" }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#fff" }}>arrow_back</span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.3px" }}>
                  {order.serviceTitle}
                </h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>{dateStr}, {timeStr}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 96px" }}>

          {/* Connection lost */}
          {!socketOk && (
            <div style={{ background: "#fffbeb", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
              <span className="mat-icon" style={{ fontSize: 18, color: "#f59e0b" }}>wifi_off</span>
              {t("order.connectionLost")}
            </div>
          )}

          {/* Status stepper */}
          <div className="card">
            <p style={sectionLabel}>{t("order.orderStatus")}</p>
            <StatusStepper current={order.status} canceledLabel={t("order.canceled")} cancelReason={order.cancelReason} />
          </div>

          {/* Medic card */}
          {order.medic ? (
            <div className="card">
              <p style={sectionLabel}>{t("order.nurse")}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2.5px solid #00685f" }}>
                  {order.medic.profilePhotoUrl
                    ? <img src={order.medic.profilePhotoUrl} alt={order.medic.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#00685f,#008378)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {order.medic.name.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{order.medic.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
                    {order.medic.rating !== null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6d7a77" }}>
                        <span style={{ color: "#eab308", fontSize: 14 }}>★</span>
                        {Number(order.medic.rating).toFixed(1)}
                        <span style={{ color: "#bcc9c6" }}>({order.medic.reviewCount})</span>
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6d7a77" }}>
                      <span className="mat-icon" style={{ fontSize: 14, color: "#bcc9c6" }}>work</span>
                      {order.medic.experienceYears} {t("order.years")}
                    </span>
                    <button
                      onClick={() => router.push(`/reviews/medic/${order.medic!.id}`)}
                      style={{ background: "#f2f4f6", border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#00685f", cursor: "pointer" }}
                    >
                      {t("reviews.title")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : order.status === "CREATED" ? (
            <div className="card" style={{ textAlign: "center", padding: "24px 18px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#00685f20,#00685f10)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s ease infinite" }}>
                <span className="mat-icon" style={{ fontSize: 28, color: "#00685f" }}>personal_injury</span>
              </div>
              {dispatchState?.status === "contacting" && dispatchState.candidateName ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>{t("order.contactingMedic", { name: dispatchState.candidateName })}</p>
                  <p style={{ fontSize: 13, color: "#6d7a77" }}>{t("order.medicReviewing")}</p>
                </>
              ) : dispatchState?.status === "no_medics" ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>{t("order.allMedicsBusy")}</p>
                  <p style={{ fontSize: 13, color: "#6d7a77" }}>{t("order.keepSearching")}</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>{t("order.searchingMedicDefault")}</p>
                  <p style={{ fontSize: 13, color: "#6d7a77" }}>{t("order.eta")}</p>
                </>
              )}
            </div>
          ) : null}

          {/* Tracking map */}
          {medicLocation &&
            order.location?.latitude != null &&
            order.location?.longitude != null &&
            ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "SERVICE_STARTED"].includes(order.status) && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>location_on</span>
                  <p style={sectionLabel}>{t("order.medicOnMap")}</p>
                </div>
                <span style={{ fontSize: 11, color: "#bcc9c6", fontWeight: 500 }}>
                  {new Date(medicLocation.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div style={{ height: 240 }}>
                <TrackingMap
                  clientLat={order.location.latitude}
                  clientLng={order.location.longitude}
                  medicLat={medicLocation.lat}
                  medicLng={medicLocation.lng}
                  medicName={order.medic?.name ?? t("order.nurse")}
                  medicPhotoUrl={order.medic?.profilePhotoUrl}
                  heading={medicLocation.heading}
                />
              </div>
            </div>
          )}

          {/* Address */}
          {order.location && (
            <div className="card">
              <p style={sectionLabel}>{t("order.address")}</p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>home</span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#191c1e" }}>{order.location.house}</p>
                  {(order.location.floor || order.location.apartment) && (
                    <p style={{ fontSize: 13, color: "#6d7a77", marginTop: 3 }}>
                      {order.location.floor ? `${t("order.floor")} ${order.location.floor}` : ""}
                      {order.location.floor && order.location.apartment ? ", " : ""}
                      {order.location.apartment ? `${t("order.apt")} ${order.location.apartment}` : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <span className="mat-icon" style={{ fontSize: 14, color: "#bcc9c6" }}>phone</span>
                    <span style={{ fontSize: 13, color: "#6d7a77" }}>{order.location.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="card">
            <p style={sectionLabel}>{t("order.price")}</p>
            {order.isUrgent && (order.urgentFee ?? 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="mat-icon" style={{ fontSize: 14 }}>bolt</span>
                  {t("confirm.urgentFee")}
                </span>
                <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>+{formatPrice(order.urgentFee!)} UZS</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: "#6d7a77" }}>{t("order.discount")}</span>
                <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>−{formatPrice(order.discountAmount)} UZS</span>
              </div>
            )}
            <div style={{ height: 1, background: "#f2f4f6", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#191c1e" }}>{t("order.total")}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#00685f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{formatPrice(finalPrice)} UZS</span>
            </div>
          </div>


          {/* Rating */}
          {order.status === "DONE" && order.medic && (
            <div className="card" style={{ textAlign: "center" }}>
              {order.clientRating !== null || ratingDone ? (
                <>
                  <span className="mat-icon" style={{ fontSize: 32, color: "#22c55e", marginBottom: 8, display: "block" }}>verified</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#191c1e", marginBottom: 10 }}>{t("order.yourRating")}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} style={{ fontSize: 28, color: s <= (order.clientRating ?? rating) ? "#eab308" : "#e6e8ea" }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: "#6d7a77", marginTop: 10 }}>{t("order.thanksForRating")}</p>
                </>
              ) : (
                <>
                  <span className="mat-icon" style={{ fontSize: 32, color: "#eab308", marginBottom: 8, display: "block" }}>star</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>{t("order.rateNurse")}</p>
                  <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 16 }}>{order.medic.name}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} disabled={ratingLoading} onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                        style={{ background: "none", border: "none", cursor: ratingLoading ? "not-allowed" : "pointer", fontSize: 38, lineHeight: 1, padding: "0 2px", color: s <= (hoverStar || rating) ? "#eab308" : "#e6e8ea", transition: "color 100ms,transform 100ms", transform: s <= (hoverStar || rating) ? "scale(1.1)" : "scale(1)" }}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea value={review} onChange={(e) => setReview(e.target.value)}
                    placeholder={t("order.ratePlaceholder")} rows={3}
                    style={{ width: "100%", borderRadius: 14, border: "1.5px solid #eceef0", padding: "12px 14px", fontSize: 14, color: "#191c1e", resize: "none", outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit", background: "#f7f9fb", transition: "border-color 150ms" }}
                    onFocus={(e) => e.target.style.borderColor = "#00685f"}
                    onBlur={(e) => e.target.style.borderColor = "#eceef0"}
                  />
                  <button className="btn-primary" disabled={ratingLoading || rating === 0} onClick={() => handleRate(rating)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (ratingLoading || rating === 0) ? 0.6 : 1 }}>
                    {ratingLoading && <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                    {ratingLoading ? t("order.saving") : t("order.rateSubmit")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Favorite medic */}
          {order.status === "DONE" && order.medic && (
            <div style={{ marginBottom: 12 }}>
              <button onClick={handleAddFavorite} disabled={favoriteLoading || isFavorite}
                style={{
                  width: "100%", background: isFavorite ? "#c2ebe3" : "#f2f4f6",
                  color: "#00685f", border: "none", borderRadius: 14, padding: "14px 16px",
                  fontSize: 15, fontWeight: 700, cursor: favoriteLoading || isFavorite ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: favoriteLoading ? 0.6 : 1, transition: "background 200ms",
                }}>
                <span className="mat-icon" style={{ fontSize: 18, color: isFavorite ? "#eab308" : "#00685f" }}>{isFavorite ? "star" : "star_border"}</span>
                {isFavorite ? t("favorites.pinned") : (favoriteLoading ? t("common.loading") : t("favorites.pin"))}
              </button>
            </div>
          )}

          {/* Payment */}
          {order.status === "DONE" && paymentStatus !== "PAID" && (
            <div className="card" style={{ border: "1.5px solid rgba(0,104,95,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span className="mat-icon" style={{ fontSize: 20, color: "#00685f" }}>payments</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#191c1e" }}>Оплата заказа</p>
              </div>
              <p style={{ fontSize: 13, color: "#6d7a77", marginBottom: 16 }}>Выберите удобный способ оплаты</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleInitiatePayment("payme")} disabled={paymentLoading !== null}
                  style={{ flex: 1, background: paymentLoading === "payme" ? "#bcc9c6" : "#00A1E0", color: "#fff", border: "none", borderRadius: 12, padding: "13px 12px", fontSize: 14, fontWeight: 700, cursor: paymentLoading !== null ? "not-allowed" : "pointer", opacity: paymentLoading !== null && paymentLoading !== "payme" ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {paymentLoading === "payme" && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  Payme
                </button>
                <button onClick={() => handleInitiatePayment("click")} disabled={paymentLoading !== null}
                  style={{ flex: 1, background: paymentLoading === "click" ? "#bcc9c6" : "#F58220", color: "#fff", border: "none", borderRadius: 12, padding: "13px 12px", fontSize: 14, fontWeight: 700, cursor: paymentLoading !== null ? "not-allowed" : "pointer", opacity: paymentLoading !== null && paymentLoading !== "click" ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {paymentLoading === "click" && <span className="mat-icon" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }}>progress_activity</span>}
                  Click
                </button>
              </div>
            </div>
          )}

          {/* Chat button */}
          {order.medicId && order.status !== "CREATED" && (
            <button onClick={() => setChatOpen(true)} className="btn-ghost-teal"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <span className="mat-icon" style={{ fontSize: 18 }}>chat</span>
              Чат с медиком
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button onClick={handleCancel} disabled={canceling} className="btn-ghost-danger"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: canceling ? 0.6 : 1 }}>
              {canceling
                ? <span className="mat-icon" style={{ fontSize: 18, animation: "spin 0.8s linear infinite" }}>progress_activity</span>
                : <span className="mat-icon" style={{ fontSize: 18 }}>close</span>
              }
              {canceling ? t("order.canceling") : t("order.cancel")}
            </button>
          )}
        </div>

        {/* ── Chat drawer ── */}
        {chatOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, background: "rgba(25,28,30,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setChatOpen(false)} />
            <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", height: "72vh", display: "flex", flexDirection: "column", animation: "slideUp 250ms ease" }}>

              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, borderRadius: 999, background: "#eceef0" }} />
              </div>

              {/* Chat header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 14px", borderBottom: "1px solid #f2f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="mat-icon" style={{ fontSize: 18, color: "#00685f" }}>chat</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#191c1e", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Чат с медиком</span>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: "#f2f4f6", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#6d7a77" }}>close</span>
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", marginTop: 40 }}>
                    <span className="mat-icon" style={{ fontSize: 40, color: "#eceef0", display: "block", marginBottom: 10 }}>chat_bubble_outline</span>
                    <p style={{ color: "#bcc9c6", fontSize: 14 }}>Сообщений пока нет</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.userId === myUserId.current || msg.role === "user";
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "75%", padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? "linear-gradient(135deg,#00685f,#008378)" : "#f2f4f6",
                        color: isMe ? "#fff" : "#191c1e",
                        boxShadow: isMe ? "0 2px 8px rgba(0,104,95,0.2)" : "none",
                      }}>
                        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                        <p style={{ fontSize: 10, opacity: 0.65, margin: "4px 0 0", textAlign: isMe ? "right" : "left" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid #f2f4f6", display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMsg(); } }}
                  placeholder={order?.status === "DONE" || order?.status === "CANCELED" ? "Заказ завершён" : "Написать сообщение..."}
                  disabled={order?.status === "DONE" || order?.status === "CANCELED"}
                  rows={1} maxLength={2000}
                  style={{ flex: 1, border: "1.5px solid #eceef0", borderRadius: 14, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", background: (order?.status === "DONE" || order?.status === "CANCELED") ? "#f7f9fb" : "#fff", transition: "border-color 150ms" }}
                  onFocus={(e) => e.target.style.borderColor = "#00685f"}
                  onBlur={(e) => e.target.style.borderColor = "#eceef0"}
                />
                <button onClick={handleSendMsg}
                  disabled={sendingMsg || !chatInput.trim() || order?.status === "DONE" || order?.status === "CANCELED"}
                  style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#00685f,#008378)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (sendingMsg || !chatInput.trim()) ? 0.5 : 1, flexShrink: 0 }}>
                  <span className="mat-icon" style={{ fontSize: 18, color: "#fff" }}>send</span>
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
            const active = path === "/orders";
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
  marginBottom: 12,
};

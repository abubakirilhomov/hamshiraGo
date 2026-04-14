"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { unsubscribeWebPush } from "@/lib/webPush";
import { api, WS_URL, Order, OrderStatus, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, formatPrice } from "@/lib/api";
import { useTranslation } from "react-i18next";

const STATUS_ICON: Record<string, string> = {
  CREATED: "pending", ASSIGNED: "assignment_ind", ACCEPTED: "thumb_up",
  ON_THE_WAY: "directions_run", ARRIVED: "location_on",
  SERVICE_STARTED: "medical_services", DONE: "check_circle", CANCELED: "cancel",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { text, bg } = ORDER_STATUS_COLOR[status];
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      color: text, background: bg, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 13, lineHeight: 1 }}>
        {STATUS_ICON[status] ?? "circle"}
      </span>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function OrderCard({ order, onClick, onReorder }: { order: Order; onClick: () => void; onReorder?: () => void }) {
  const { t } = useTranslation();
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const isDone = order.status === "DONE" || order.status === "CANCELED";
  const isActive = !isDone;

  return (
    <div style={{
      background: "#fff", borderRadius: 20, overflow: "hidden",
      boxShadow: isActive ? "0 4px 20px rgba(0,104,95,0.1)" : "0 2px 12px rgba(0,104,95,0.05)",
      border: isActive ? "1.5px solid rgba(0,104,95,0.12)" : "none",
      transition: "box-shadow 200ms, transform 200ms",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,104,95,0.12)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = isActive ? "0 4px 20px rgba(0,104,95,0.1)" : "0 2px 12px rgba(0,104,95,0.05)"; }}
    >
      {/* Active indicator */}
      {isActive && <div style={{ height: 3, background: "linear-gradient(90deg,#00685f,#008378)" }} />}

      <button onClick={onClick} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "#191c1e", lineHeight: 1.3, flex: 1 }}>
            {order.serviceTitle}
          </p>
          <StatusBadge status={order.status} />
        </div>

        {order.location && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 14, color: "#6d7a77" }}>location_on</span>
            <span style={{ fontSize: 13, color: "#6d7a77" }}>{order.location.house}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: "#00685f" }}>
            {formatPrice(order.priceAmount - order.discountAmount)} UZS
          </p>
          <p style={{ fontSize: 12, color: "#bcc9c6" }}>{dateStr}, {timeStr}</p>
        </div>
      </button>

      {isDone && onReorder && (
        <div style={{ padding: "0 18px 16px" }}>
          <button onClick={onReorder} style={{
            width: "100%", padding: "10px 0",
            background: "#f2f4f6", border: "none", borderRadius: 12,
            fontSize: 13, fontWeight: 700, color: "#00685f", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 150ms",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#c2ebe3")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f2f4f6")}
          >
            <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 16 }}>refresh</span>
            {t("orders.reorder")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketOk, setSocketOk] = useState(true);
  const [tab, setTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const socketRef = useRef<Socket | null>(null);

  async function loadOrders() {
    setLoading(true); setError("");
    try {
      const data = await api.orders.list();
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    loadOrders();
    const socket = io(WS_URL, { auth: { token }, transports: ["websocket"], reconnection: true, reconnectionDelay: 2000 });
    socketRef.current = socket;
    socket.on("connect", () => setSocketOk(true));
    socket.on("disconnect", () => setSocketOk(false));
    socket.on("connect_error", () => setSocketOk(false));
    socket.on("order_status", ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (status === "DONE" || status === "CANCELED") socket.emit("unsubscribe_order", orderId);
    });
    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    orders
      .filter((o) => !["DONE", "CANCELED"].includes(o.status) && !subscribedRef.current.has(o.id))
      .forEach((o) => {
        socket.emit("subscribe_order", o.id);
        subscribedRef.current.add(o.id);
      });
    // cleanup subscriptions for finished orders
    orders
      .filter((o) => ["DONE", "CANCELED"].includes(o.status) && subscribedRef.current.has(o.id))
      .forEach((o) => { subscribedRef.current.delete(o.id); });
  }, [orders]);

  const active = orders.filter((o) => !["DONE", "CANCELED"].includes(o.status));
  const history = orders.filter((o) => ["DONE", "CANCELED"].includes(o.status));
  const displayed = tab === "ACTIVE" ? active : history;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb", fontFamily: "Inter, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 0 rgba(0,104,95,0.08)",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.push("/")} style={{ background: "#f2f4f6", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 20, color: "#3d4947" }}>arrow_back</span>
            </button>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: "#191c1e" }}>{t("orders.title")}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadOrders} style={{ background: "#f2f4f6", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 20, color: "#3d4947" }}>refresh</span>
            </button>
            <button onClick={() => { unsubscribeWebPush(); localStorage.removeItem("token"); router.push("/auth"); }} style={{ background: "#f2f4f6", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 20, color: "#3d4947" }}>logout</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 12px", display: "flex", gap: 4 }}>
          {([
            { key: "ACTIVE", label: t("orders.active"), count: active.length },
            { key: "HISTORY", label: t("orders.history"), count: history.length },
          ] as const).map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "8px 18px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, transition: "all 150ms",
              background: tab === key ? "#00685f" : "#f2f4f6",
              color: tab === key ? "#fff" : "#6d7a77",
              boxShadow: tab === key ? "0 2px 8px rgba(0,104,95,0.2)" : "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {label}
              {count > 0 && (
                <span style={{
                  background: tab === key ? "rgba(255,255,255,0.25)" : "#eceef0",
                  color: tab === key ? "#fff" : "#6d7a77",
                  borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 800,
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 20px 100px" }}>

        {/* Socket warning */}
        {!socketOk && (
          <div style={{ background: "#fff8e6", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, color: "#92400e", fontSize: 13, fontWeight: 600 }}>
            <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 18 }}>wifi_off</span>
            {t("orders.connectionLost")}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eceef0", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#6d7a77" }}>{t("orders.loadingOrders")}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: "#fef2f2", borderRadius: 16, padding: "20px", textAlign: "center" }}>
            <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 40, color: "#ef4444", display: "block", marginBottom: 8 }}>error_outline</span>
            <p style={{ fontSize: 14, color: "#ef4444", marginBottom: 14 }}>{error}</p>
            <button onClick={loadOrders} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("common.retry")}</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "#c2ebe3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 40, color: "#00685f" }}>receipt_long</span>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "#191c1e", marginBottom: 8 }}>{t("orders.empty")}</h2>
            <p style={{ fontSize: 14, color: "#6d7a77", marginBottom: 24, lineHeight: 1.6 }}>{t("orders.callNurse")}</p>
            <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,104,95,0.25)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 18 }}>medical_services</span>
              {t("orders.orderService")}
            </button>
          </div>
        )}

        {/* No orders in tab */}
        {!loading && !error && orders.length > 0 && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 48, color: "#bcc9c6", display: "block", marginBottom: 12 }}>inbox</span>
            <p style={{ fontSize: 15, color: "#6d7a77" }}>{t("orders.noOrdersInCategory")}</p>
          </div>
        )}

        {/* Orders grid */}
        {!loading && !error && displayed.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {displayed.map((o) => (
              <OrderCard key={o.id} order={o}
                onClick={() => router.push(`/orders/${o.id}`)}
                onReorder={() => router.push(`/order/location?serviceId=${o.serviceId}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", boxShadow: "0 -4px 20px rgba(0,104,95,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0 max(10px,env(safe-area-inset-bottom))" }}>
        {[
          { icon: "home", label: "Главная", path: "/" },
          { icon: "receipt_long", label: "Заказы", path: "/orders" },
          { icon: "smart_toy", label: "AI", path: "/salomat" },
          { icon: "person", label: "Профиль", path: "/profile" },
        ].map((item) => {
          const isActive = typeof window !== "undefined" && window.location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => router.push(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: isActive ? "#c2ebe3" : "transparent", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 14, color: isActive ? "#00685f" : "#6d7a77" }}>
              <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

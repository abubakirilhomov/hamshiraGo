"use client";

import { useEffect } from "react";

export default function SubscriptionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Subscriptions error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "32px 24px",
        maxWidth: "360px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
          Произошла ошибка в разделе Подписки
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", wordBreak: "break-word" }}>
          {error.message}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            background: "#0d9488",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

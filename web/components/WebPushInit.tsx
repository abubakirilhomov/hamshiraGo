"use client";

import { useEffect } from "react";
import { subscribeWebPush } from "@/lib/webPush";

export default function WebPushInit() {
  useEffect(() => {
    // Авто-подписываемся только если разрешение уже выдано ранее
    // (новых пользователей ведёт PushPermissionPrompt)
    if (
      localStorage.getItem("token") &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      subscribeWebPush();
    }
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/api";

export default function GlobalErrorHandler() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      reportClientError(e.message, e.error?.stack);
    }

    function onUnhandledRejection(e: PromiseRejectionEvent) {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
      const stack = e.reason instanceof Error ? e.reason.stack : undefined;
      reportClientError(msg, stack);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/api";

interface SafeProviderProps {
  /** Human-readable name shown in the fallback UI */
  name: string;
  children: ReactNode;
}

interface SafeProviderState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary wrapper for context providers.
 * If a provider crashes, SafeProvider catches the error, logs it,
 * and renders a minimal fallback — keeping the rest of the app alive.
 */
export default class SafeProvider extends Component<SafeProviderProps, SafeProviderState> {
  constructor(props: SafeProviderProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafeProviderState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const ctx = this.props.name;
    console.error(`[SafeProvider/${ctx}] caught error:`, error, info.componentStack);
    reportClientError(
      `[SafeProvider/${ctx}] ${error.message}`,
      error.stack ?? info.componentStack ?? undefined,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 12,
            margin: 8,
            borderRadius: 8,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>{this.props.name}</span>{" "}
          временно недоступен.{" "}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginLeft: 8,
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Повторить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

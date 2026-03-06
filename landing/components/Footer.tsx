"use client";

import { useLang } from "@/context/LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="py-10 border-t border-white/8" style={{ background: "var(--bg2)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-base">+</span>
            </div>
            <span className="font-black text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
              Hamshira<span className="text-primary">Go</span>
            </span>
          </a>

          {/* Tagline */}
          <p className="text-sm" style={{ color: "var(--text-4)" }}>{t.footer.tagline}</p>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "var(--text-4)" }}>{t.footer.copy}</p>
        </div>
      </div>
    </footer>
  );
}

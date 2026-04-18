"use client";

import { useLang } from "@/context/LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="py-10 border-t border-white/8" style={{ background: "var(--bg2)" }}>
      {/* Footer schema markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "HamshiraGo",
          "url": "https://hamshirago.uz",
          "logo": "https://hamshirago.uz/logo.png",
          "description": "Медсестра на дом в Ташкенте — уколы, капельницы, измерение давления 24/7"
        })
      }} />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + internal links */}
          <div className="flex flex-col gap-4">
            <a href="/" className="flex items-center gap-2.5 group" title="Главная страница">
              <img src="/logo.png" alt="HamshiraGo логотип - медсестра на дом" className="w-11 h-11 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
              <span className="font-black text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                Hamshira<span className="text-primary">Go</span>
              </span>
            </a>
            {/* Quick internal links for SEO */}
            <div className="flex gap-3 text-xs">
              <a href="#download" className="hover:text-primary transition" style={{ color: "var(--text-4)" }}>Приложение</a>
              <span style={{ color: "var(--text-4)" }}>•</span>
              <a href="#" className="hover:text-primary transition" style={{ color: "var(--text-4)" }}>Контакты</a>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-sm" style={{ color: "var(--text-4)" }}>{t.footer.tagline}</p>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "var(--text-4)" }}>{t.footer.copy}</p>
        </div>
      </div>
    </footer>
  );
}

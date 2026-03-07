"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { useTheme } from "@/context/ThemeContext";
import { IconSun, IconMoon } from "./Icons";

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: t.nav.how, href: "#how" },
    { label: t.nav.services, href: "#services" },
    { label: t.nav.download, href: "#download" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl border-b border-white/8 shadow-2xl" : ""
      }`}
      style={{ background: scrolled ? "var(--navbar-scrolled-bg)" : "transparent" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-lg">+</span>
          </div>
          <span className="font-black text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            Hamshira<span className="text-primary">Go</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full glass transition-all hover:scale-105"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ color: "var(--text-primary)" }}
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>

          {/* Lang switcher */}
          <div className="flex items-center gap-1 glass rounded-full px-2 py-1">
            {(["ru", "uz"] as const).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); window.history.pushState(null, "", `/${l}`); }}
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                  lang === l
                    ? "bg-primary text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#download"
            className="hidden md:flex btn-glow bg-primary text-white text-sm font-bold px-5 py-2 rounded-full"
          >
            {t.nav.cta}
          </a>

          {/* Burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          >
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden backdrop-blur-xl border-t border-white/8"
            style={{ background: "var(--mobile-menu-bg)" }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 font-medium py-2 hover:text-primary transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#download"
                onClick={() => setMenuOpen(false)}
                className="btn-glow bg-primary text-white text-center font-bold px-5 py-3 rounded-xl mt-2"
              >
                {t.nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

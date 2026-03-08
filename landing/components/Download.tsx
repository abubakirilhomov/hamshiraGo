"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useLang } from "@/context/LangContext";

export default function Download() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const sRef = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // Parallax on background blobs
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start end", "end start"] });
  const blob1Y = useTransform(scrollYProgress, [0, 1], [-40, 60]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [60, -40]);

  return (
    <section ref={sRef} id="download" className="py-28 relative overflow-hidden"
      style={{ background: "var(--bg4)" }}>

      {/* Aurora blobs */}
      <motion.div
        style={{ y: blob1Y, background: "radial-gradient(circle, rgba(13,148,136,0.5), transparent 70%)" }}
        animate={{ scale: [1, 1.3, 0.85, 1], opacity: [0.18, 0.28, 0.12, 0.18], x: [0, 60, -40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
      />
      <motion.div
        style={{ y: blob2Y, background: "radial-gradient(circle, rgba(6,182,212,0.5), transparent 70%)" }}
        animate={{ scale: [1, 0.8, 1.25, 1], opacity: [0.12, 0.22, 0.08, 0.12], x: [0, -50, 35, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none"
      />
      <motion.div
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.5), transparent 70%)" }}
        animate={{ scale: [1, 1.2, 0.9, 1], opacity: [0.08, 0.16, 0.06, 0.08], x: [0, 30, -50, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        className="absolute top-1/2 right-0 w-80 h-80 rounded-full pointer-events-none"
      />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />

      <div ref={ref} className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mb-6">
          <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-sm border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t.download.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-black mb-4 leading-tight" style={{ fontSize: "clamp(28px, 7vw, 64px)", color: "var(--text-primary)" }}>
          {t.download.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-lg mb-12 max-w-xl mx-auto" style={{ color: "var(--text-3)" }}>
          {t.download.subtitle}
        </motion.p>

        {/* Web app button */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-6">
          <motion.a href="https://app.hamshirago.uz" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white"
            style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)", boxShadow: "0 12px 40px rgba(13,148,136,0.5)", fontSize: 18 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            {t.hero.try}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.a>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.35 }}
          className="text-center text-sm mb-8" style={{ color: "var(--text-4)" }}>
          {t.seo.cta.note}
        </motion.p>

        {/* Store buttons */}
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">

          {/* App Store */}
          <motion.a href="#" whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-7 py-4 rounded-2xl font-bold shadow-2xl min-w-[210px]"
            style={{ background: "#0f172a", color: "#ffffff", boxShadow: "0 25px 50px var(--shadow)" }}>
            <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.8 188.4-49.8zM518.1 163.4c-35.3 41.6-98.1 71.9-158.2 71.9-8.3 0-16.6-.9-24.9-2.6C361.1 127.4 441.2 58 508.2 17c38.5-23.9 101.9-43.3 158.2-43.3 1.3 0 2.6 0 3.9.1-2.6 66.3-38.5 131.9-52.2 143.6z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-60 font-normal leading-none mb-0.5">{t.download.appStore.sub}</div>
              <div className="text-base font-black leading-tight">App Store</div>
            </div>
          </motion.a>

          {/* Google Play */}
          <motion.a href="#" whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-3 glass border border-white/20 px-7 py-4 rounded-2xl font-bold hover:border-white/30 transition-all min-w-[210px]" style={{ color: "var(--text-primary)" }}>
            <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M3 20.5L14 12 3 3.5V20.5Z" fill="#4CAF50" />
              <path d="M14 12L3 3.5L16.5 8.75L14 12Z" fill="#1976D2" />
              <path d="M14 12L3 20.5L16.5 15.25L14 12Z" fill="#FF5722" />
              <path d="M16.5 8.75L14 12L16.5 15.25L21 12L16.5 8.75Z" fill="#FFC107" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-60 font-normal leading-none mb-0.5">{t.download.googlePlay.sub}</div>
              <div className="text-base font-black leading-tight">Google Play</div>
            </div>
          </motion.a>
        </motion.div>

        {/* Trust row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: "⭐", text: t.download.trust.rating },
            { icon: "🔒", text: t.download.trust.secure },
            { icon: "🚀", text: t.download.trust.fast },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-3)" }}>
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

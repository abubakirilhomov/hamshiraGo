"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/context/LangContext";

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function SeoContent() {
  const { t } = useLang();
  const s = t.seo;

  const introRef  = useRef<HTMLDivElement>(null);
  const whoRef    = useRef<HTMLDivElement>(null);
  const procRef   = useRef<HTMLDivElement>(null);
  const faqRef    = useRef<HTMLDivElement>(null);
  const areasRef  = useRef<HTMLDivElement>(null);

  const introIn  = useInView(introRef,  { once: true, margin: "-60px" });
  const whoIn    = useInView(whoRef,    { once: true, margin: "-60px" });
  const procIn   = useInView(procRef,   { once: true, margin: "-60px" });
  const faqIn    = useInView(faqRef,    { once: true, margin: "-60px" });
  const areasIn  = useInView(areasRef,  { once: true, margin: "-60px" });

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg2)" }}>
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="relative max-w-5xl mx-auto px-6 space-y-24">

        {/* ── Intro ───────────────────────────────────────── */}
        <div ref={introRef} className="max-w-3xl mx-auto text-center">
          <motion.span
            custom={0} variants={fadeUp} initial="hidden" animate={introIn ? "visible" : "hidden"}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)", color: "#0d9488" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {s.intro.badge}
          </motion.span>
          <motion.h2
            custom={1} variants={fadeUp} initial="hidden" animate={introIn ? "visible" : "hidden"}
            className="font-black mb-6 leading-tight"
            style={{ fontSize: "clamp(24px,4vw,48px)", color: "var(--text-primary)" }}>
            {s.intro.title}
          </motion.h2>
          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate={introIn ? "visible" : "hidden"}
            className="text-lg leading-relaxed" style={{ color: "var(--text-3)" }}>
            {s.intro.body}
          </motion.p>
        </div>

        {/* ── Who ─────────────────────────────────────────── */}
        <div ref={whoRef}>
          <motion.h2
            custom={0} variants={fadeUp} initial="hidden" animate={whoIn ? "visible" : "hidden"}
            className="font-black text-center mb-10"
            style={{ fontSize: "clamp(20px,3.5vw,38px)", color: "var(--text-primary)" }}>
            {s.who.title}
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.who.items.map((item, i) => (
              <motion.div
                key={i} custom={i} variants={fadeUp} initial="hidden" animate={whoIn ? "visible" : "hidden"}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Procedures ──────────────────────────────────── */}
        <div ref={procRef}>
          <motion.h2
            custom={0} variants={fadeUp} initial="hidden" animate={procIn ? "visible" : "hidden"}
            className="font-black text-center mb-3"
            style={{ fontSize: "clamp(20px,3.5vw,38px)", color: "var(--text-primary)" }}>
            {s.procedures.title}
          </motion.h2>
          <motion.p
            custom={1} variants={fadeUp} initial="hidden" animate={procIn ? "visible" : "hidden"}
            className="text-center text-sm mb-10" style={{ color: "var(--text-4)" }}>
            {s.procedures.subtitle}
          </motion.p>
          <div className="grid sm:grid-cols-2 gap-5">
            {s.procedures.items.map((item, i) => (
              <motion.article
                key={i} custom={i} variants={fadeUp} initial="hidden" animate={procIn ? "visible" : "hidden"}
                className="p-6 rounded-2xl"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{item.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <div ref={faqRef}>
          <motion.h2
            custom={0} variants={fadeUp} initial="hidden" animate={faqIn ? "visible" : "hidden"}
            className="font-black text-center mb-10"
            style={{ fontSize: "clamp(20px,3.5vw,38px)", color: "var(--text-primary)" }}>
            {s.faq.title}
          </motion.h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {s.faq.items.map((item, i) => (
              <motion.div
                key={i} custom={i} variants={fadeUp} initial="hidden" animate={faqIn ? "visible" : "hidden"}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--card-bg)", border: `1px solid ${open === i ? "rgba(13,148,136,0.4)" : "var(--card-border)"}`, transition: "border-color 0.2s" }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  style={{ color: "var(--text-primary)" }}>
                  <span className="font-semibold text-sm leading-snug">{item.q}</span>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: open === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.25s", color: "#0d9488" }}>
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <div
                  style={{
                    maxHeight: open === i ? 400 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{item.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Areas + CTA ─────────────────────────────────── */}
        <div ref={areasRef} className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Areas */}
          <div>
            <motion.h2
              custom={0} variants={fadeUp} initial="hidden" animate={areasIn ? "visible" : "hidden"}
              className="font-black mb-2"
              style={{ fontSize: "clamp(18px,3vw,32px)", color: "var(--text-primary)" }}>
              {s.areas.title}
            </motion.h2>
            <motion.p
              custom={1} variants={fadeUp} initial="hidden" animate={areasIn ? "visible" : "hidden"}
              className="text-sm mb-6" style={{ color: "var(--text-4)" }}>
              {s.areas.subtitle}
            </motion.p>
            <div className="flex flex-wrap gap-2">
              {s.areas.list.map((area, i) => (
                <motion.span
                  key={i} custom={i} variants={fadeUp} initial="hidden" animate={areasIn ? "visible" : "hidden"}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)", color: "#0d9488" }}>
                  📍 {area}
                </motion.span>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate={areasIn ? "visible" : "hidden"}
            className="p-8 rounded-3xl text-center"
            style={{ background: "linear-gradient(135deg,rgba(13,148,136,0.12),rgba(8,145,178,0.08))", border: "1px solid rgba(13,148,136,0.25)" }}>
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-black mb-3 text-xl" style={{ color: "var(--text-primary)" }}>{s.cta.title}</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>{s.cta.subtitle}</p>
            <a
              href="https://app.hamshirago.uz" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)", boxShadow: "0 8px 24px rgba(13,148,136,0.4)" }}>
              {s.cta.btn}
            </a>
            <p className="mt-4 text-xs" style={{ color: "var(--text-5)" }}>{s.cta.note}</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { IconSyringe, IconDroplet, IconActivity, IconHome } from "./Icons";

const SERVICE_ICONS = [IconSyringe, IconDroplet, IconActivity, IconHome];

type ServiceItem = { emoji: string; title: string; desc: string; price: string };

/* ── 3D flip card ────────────────────────────────────── */
function FlipCard({ item, delay, inView, index }: {
  item: ServiceItem; delay: number; inView: boolean; index: number;
}) {
  const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
  const [flipped, setFlipped] = useState(false);

  const fromX = index % 2 === 0 ? -70 : 70;
  const fromRotY = index % 2 === 0 ? -15 : 15;

  const features = [
    ["⚡", "Быстро — до 30 минут"],
    ["🔒", "Сертифицированный медик"],
    ["💳", "Оплата онлайн"],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: fromX, rotateY: fromRotY, scale: 0.84, filter: "blur(16px)" }}
      animate={inView ? { opacity: 1, x: 0, rotateY: 0, scale: 1, filter: "blur(0px)",
        transition: { delay, duration: 1.1, ease: [0.16, 1, 0.3, 1] } } : {}}
      style={{ perspective: "1200px", height: 320 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      {/* Inner — rotates */}
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
      }}>

        {/* ── Front ── */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          className="rounded-2xl overflow-hidden">
          <div className="h-full relative p-6 flex flex-col"
            style={{ background: "var(--card-bg)", backdropFilter: "blur(16px)", border: "1px solid var(--card-border)" }}>
            {/* Shimmer */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
              style={{ background: "radial-gradient(circle at 50% 0%, rgba(13,148,136,0.14), transparent 60%)" }} />
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300"
                style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.18), rgba(6,182,212,0.08))", border: "1px solid rgba(13,148,136,0.2)", color: "#0d9488" }}>
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-3)" }}>{item.desc}</p>
              <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid var(--card-border)" }}>
                <span className="text-sm font-semibold" style={{ color: "#0d9488" }}>{item.price}</span>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-4)" }}>
                  <span>Hover</span>
                  <span style={{ fontSize: 10 }}>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Back ── */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="rounded-2xl overflow-hidden">
          <div className="h-full relative p-6 flex flex-col"
            style={{ background: "linear-gradient(145deg, rgba(13,148,136,0.22), rgba(6,182,212,0.12))", border: "1px solid rgba(13,148,136,0.3)", backdropFilter: "blur(20px)" }}>
            {/* Back glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 100%, rgba(13,148,136,0.2), transparent 60%)" }} />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-white font-bold text-base tracking-tight">{item.title}</p>
                  <p className="text-xs font-bold" style={{ color: "#14b8a6" }}>{item.price}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 flex-1">
                {features.map(([ic, txt]) => (
                  <div key={txt} className="flex items-center gap-2.5">
                    <span className="text-sm">{ic}</span>
                    <span className="text-sm" style={{ color: "var(--text-2)" }}>{txt}</span>
                  </div>
                ))}
              </div>
              <a href="#download"
                className="mt-5 w-full py-3 rounded-xl font-bold text-sm text-center transition-opacity hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.92)", color: "#0d1924" }}>
                Скачать приложение →
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Services section ────────────────────────────────── */
export default function Services() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="services" className="py-28 relative overflow-hidden" style={{ background: "var(--bg2)" }}>
      <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(13,148,136,0.05), transparent 60%)" }} />
      <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04), transparent 60%)" }} />

      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-block mb-5 px-4 py-2 rounded-full text-xs font-bold uppercase"
            style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)", color: "#0d9488", letterSpacing: "0.14em" }}>
            {t.services.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>{t.services.title}</h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: "var(--text-3)" }}>{t.services.subtitle}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.services.list.map((s, i) => (
            <FlipCard key={i} item={s} index={i} delay={i * 0.12} inView={inView} />
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
          className="text-center mt-6 text-xs" style={{ color: "var(--text-5)" }}>
          Наведите на карточку, чтобы увидеть подробности
        </motion.p>
      </div>
    </section>
  );
}

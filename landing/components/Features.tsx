"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { IconZap, IconShieldCheck, IconClock, IconMapPin, IconStar, IconCreditCard } from "./Icons";

const FEATURE_ICONS = [IconZap, IconShieldCheck, IconClock, IconMapPin, IconStar, IconCreditCard];

/* ── 3D tilt card ────────────────────────────────────── */
function BentoCard({
  f, i, span, inView, children,
}: {
  f: { title: string; desc: string };
  i: number; span: string; inView: boolean;
  children?: React.ReactNode;
}) {
  const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 14,
      y: ((e.clientY - r.top) / r.height - 0.5) * -14,
    });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      className={span}
      initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(12px)" }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
        transition: { delay: i * 0.09, duration: 0.9, ease: [0.16, 1, 0.3, 1] } } : {}}
      style={{ perspective: "900px" }}
    >
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
        className="relative h-full rounded-2xl p-6 overflow-hidden group"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          backdropFilter: "blur(16px)",
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: "transform 0.12s ease, box-shadow 0.3s ease",
          boxShadow: tilt.x !== 0 ? "0 20px 60px var(--shadow), 0 0 0 1px rgba(13,148,136,0.1)" : "none",
        }}>
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "radial-gradient(circle at 30% 20%, rgba(13,148,136,0.12), transparent 60%)" }} />
        {/* Bottom line */}
        <div className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.5), transparent)" }} />

        <div className="relative z-10 h-full flex flex-col">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={inView ? { scale: 1, rotate: 0, transition: { delay: i * 0.09 + 0.25, duration: 0.45, type: "spring", bounce: 0.5 } } : {}}
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.2)", color: "#0d9488" }}>
            <Icon size={20} />
          </motion.div>
          <h3 className="font-bold mb-2 tracking-tight" style={{ fontSize: 17, color: "var(--text-primary)" }}>{f.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{f.desc}</p>
          {children && <div className="mt-auto pt-4">{children}</div>}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Animated speed bars ─────────────────────────────── */
function SpeedBars({ inView }: { inView: boolean }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {[40, 65, 85, 55, 95, 70, 45, 90].map((h, i) => (
        <motion.div key={i}
          initial={{ height: 0, opacity: 0 }}
          animate={inView ? { height: `${h}%`, opacity: 0.4 + h / 200 } : {}}
          transition={{ delay: 0.6 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 rounded-sm"
          style={{ background: `rgba(13,148,136,${0.4 + h / 200})` }} />
      ))}
    </div>
  );
}

/* ── Stars rating ────────────────────────────────────── */
function Stars({ inView }: { inView: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s, i) => (
        <motion.span key={s} initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1, transition: { delay: 0.7 + i * 0.08, type: "spring", bounce: 0.6 } } : {}}
          style={{ fontSize: 18, color: "#fbbf24" }}>★</motion.span>
      ))}
      <span className="ml-2 text-white font-bold text-sm">4.8</span>
    </div>
  );
}

/* ── Map pulse ───────────────────────────────────────── */
function MapPulse() {
  return (
    <div className="relative h-16 rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d1f2d, #091a2a)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(13,148,136,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.6) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
      {[{l:"30%",t:"45%"},{l:"55%",t:"30%"},{l:"72%",t:"55%"}].map((p,i)=>(
        <div key={i} style={{position:"absolute",left:p.l,top:p.t}}>
          <motion.div animate={{scale:[1,2.5],opacity:[0.6,0]}} transition={{duration:1.8,repeat:Infinity,delay:i*0.6}}
            style={{position:"absolute",inset:-4,borderRadius:"50%",background:"#0d9488"}}/>
          <div style={{width:8,height:8,borderRadius:"50%",background:i===1?"#0d9488":"rgba(255,255,255,0.4)"}}/>
        </div>
      ))}
    </div>
  );
}

/* ── Features bento ──────────────────────────────────── */
export default function Features() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const list = t.features.list;

  // Bento spans (6-col grid): 4+2, 2+4, 3+3
  const spans = [
    "lg:col-span-4", "lg:col-span-2",
    "lg:col-span-2", "lg:col-span-4",
    "lg:col-span-3", "lg:col-span-3",
  ];

  return (
    <section id="features" className="py-28 relative overflow-hidden" style={{ background: "var(--bg3)" }}>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(13,148,136,0.04), transparent 60%)" }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04), transparent 60%)" }} />

      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-block mb-5 px-4 py-2 rounded-full text-xs font-bold uppercase"
            style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)", color: "#0d9488", letterSpacing: "0.14em" }}>
            {t.features.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>{t.features.title}</h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: "var(--text-3)" }}>{t.features.subtitle}</p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-[minmax(160px,auto)]">
          {list.map((f, i) => (
            <BentoCard key={i} f={f} i={i} span={spans[i]} inView={inView}>
              {i === 0 && <SpeedBars inView={inView} />}
              {i === 3 && <MapPulse />}
              {i === 4 && <Stars inView={inView} />}
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}

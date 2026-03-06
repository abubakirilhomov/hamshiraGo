"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { IconUsers, IconStethoscope, IconStar, IconClock } from "./Icons";

function useCounter(target: number, started: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!started) return;
    const decimal = target % 1 !== 0;
    const t0 = performance.now();
    const dur = 2000;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(decimal ? Math.round(target * e * 10) / 10 : Math.floor(target * e));
      if (p < 1) requestAnimationFrame(tick); else setN(target);
    };
    requestAnimationFrame(tick);
  }, [started, target]);
  return n;
}

const STAT_ICONS = [IconUsers, IconStethoscope, IconStar, IconClock];

function StatCard({ value, suffix, label, delay, started, iconIndex }: {
  value: number; suffix: string; label: string; delay: number; started: boolean; iconIndex: number;
}) {
  const count = useCounter(value, started);
  const display = value % 1 !== 0 ? count.toFixed(1) : count;
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * -16 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.85, filter: "blur(10px)" }}
      animate={started ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: "800px" }}
    >
      <div
        ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative p-6 rounded-2xl text-center group"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: tilt.x !== 0 ? "transform 0.1s ease" : "transform 0.5s ease",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 60%)" }} />
        <div className="relative z-10">
          <div className="mb-3 flex justify-center" style={{ color: "rgba(255,255,255,0.85)" }}>
            {(() => { const Icon = STAT_ICONS[iconIndex % STAT_ICONS.length]; return <Icon size={26} />; })()}
          </div>
          <div className="font-black mb-1 leading-none" style={{ fontSize: "clamp(42px, 6vw, 60px)", color: "#fff", textShadow: "0 0 40px rgba(255,255,255,0.3)" }}>
            {display}<span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6em" }}>{suffix}</span>
          </div>
          <p className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0d9488 100%)", backgroundSize: "200% 200%", animation: "gradShift 8s ease infinite" }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {t.stats.map((s, i) => (
            <StatCard key={i} value={s.value} suffix={s.suffix} label={s.label}
              delay={i * 0.1} started={inView} iconIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

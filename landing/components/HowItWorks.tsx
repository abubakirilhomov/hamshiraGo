"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from "framer-motion";
import { useLang } from "@/context/LangContext";
import { IconClipboard, IconNavigation, IconTruck } from "./Icons";

const STEP_ICONS = [IconClipboard, IconNavigation, IconTruck];

type Step = { num: string; title: string; desc: string };

/* ── Single step slide — driven by scroll progress ───── */
function StepSlide({
  step, index, scrollYProgress, inputRange, isLast,
}: {
  step: Step; index: number;

  scrollYProgress: MotionValue<number>;
  inputRange: [number, number, number, number]; isLast: boolean;
}) {
  const StepIcon = STEP_ICONS[index % STEP_ICONS.length];
  const opacity = useTransform(scrollYProgress, inputRange, isLast ? [0, 1, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, inputRange, isLast ? [55, 0, 0, 0] : [55, 0, 0, -55]);
  const scale = useTransform(scrollYProgress, inputRange, isLast ? [0.92, 1, 1, 1] : [0.92, 1, 1, 0.92]);
  const blur = useTransform(scrollYProgress, inputRange, ["14px", "0px", "0px", isLast ? "0px" : "14px"]);
  const filter = useTransform(blur, (v) => `blur(${v})`);

  return (
    <motion.div style={{ opacity, y, scale, filter }}
      className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center px-6">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-24 items-center max-w-5xl mx-auto w-full">

        {/* Left: icon */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Ghost number */}
            <span className="absolute -left-4 -top-6 text-[9rem] font-black text-white/[0.03] leading-none select-none pointer-events-none">
              {step.num}
            </span>
            {/* Animated glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-[44px]"
              style={{ background: "radial-gradient(circle, rgba(13,148,136,0.25), transparent 70%)", filter: "blur(20px)" }}
            />
            {/* Icon square */}
            <div className="relative w-44 h-44 rounded-[40px] border border-primary/20 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(6,182,212,0.04))",
                backdropFilter: "blur(16px)",
                boxShadow: "0 0 60px rgba(13,148,136,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
              <div style={{ color: "#0d9488", opacity: 0.9 }}><StepIcon size={72} /></div>
              {/* Badge */}
              <div className="absolute -top-4 -right-4 w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-black text-base shadow-xl shadow-primary/50">
                {index + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Right: text */}
        <div className="text-center lg:text-left">
          <div className="text-[5rem] font-black leading-none mb-2 select-none"
            style={{ WebkitTextStroke: "2px rgba(13,148,136,0.2)", color: "transparent" }}>
            {step.num}
          </div>
          <h3 className="text-3xl lg:text-4xl font-black mb-4 leading-tight" style={{color:"var(--text-primary)"}}>{step.title}</h3>
          <p className="text-lg leading-relaxed max-w-sm mx-auto lg:mx-0" style={{color:"var(--text-3)"}}>{step.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── HowItWorks — sticky scroll ──────────────────────── */
export default function HowItWorks() {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.38) setActiveStep(0);
    else if (v < 0.72) setActiveStep(1);
    else setActiveStep(2);
  });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const steps = t.how.steps;

  const stepRanges: [number, number, number, number][] = [
    [0, 0.06, 0.28, 0.38],
    [0.28, 0.38, 0.62, 0.72],
    [0.62, 0.72, 0.92, 1.0],
  ];

  return (
    <section id="how">
      {/* Outer — 350vh for scroll space */}
      <div ref={containerRef} style={{ height: "350vh" }}>
        {/* Sticky inner */}
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)" }}
          className="flex flex-col">

          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          {/* Ambient blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-primary/30" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/4 blur-3xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 text-center pt-14 pb-4 px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="inline-block glass border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                {t.how.badge}
              </span>
              <h2 className="text-3xl lg:text-5xl font-black leading-tight" style={{color:"var(--text-primary)"}}>{t.how.title}</h2>
            </motion.div>
          </div>

          {/* Slides */}
          <div className="relative flex-1">
            {steps.map((step, i) => (
              <StepSlide key={i} step={step} index={i}
                scrollYProgress={scrollYProgress}
                inputRange={stepRanges[i]}
                isLast={i === steps.length - 1} />
            ))}
          </div>

          {/* Progress bottom */}
          <div className="relative z-10 pb-10 px-6">
            {/* Bar */}
            <div className="max-w-xs mx-auto mb-5">
              <div className="h-px bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                  style={{ width: progressWidth }} />
              </div>
            </div>
            {/* Dots */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <motion.div key={i}
                  animate={{
                    width: activeStep === i ? 24 : 8,
                    opacity: activeStep === i ? 1 : 0.3,
                    backgroundColor: activeStep === i ? "#0d9488" : "var(--text-4)",
                  }}
                  transition={{ duration: 0.35 }}
                  className="h-2 rounded-full" />
              ))}
            </div>
            <div className="text-center mt-3">
              <span className="text-xs" style={{color:"var(--text-5)"}}>{t.how.subtitle}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

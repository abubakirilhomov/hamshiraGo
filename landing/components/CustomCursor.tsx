"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // Ring: slow spring (lags behind)
  const ringX = useSpring(useTransform(mouseX, (v) => v - 20), { stiffness: 80, damping: 16, mass: 0.6 });
  const ringY = useSpring(useTransform(mouseY, (v) => v - 20), { stiffness: 80, damping: 16, mass: 0.6 });

  // Dot: fast spring
  const dotX = useSpring(useTransform(mouseX, (v) => v - 3), { stiffness: 400, damping: 28 });
  const dotY = useSpring(useTransform(mouseY, (v) => v - 3), { stiffness: 400, damping: 28 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Glow ring — follows with lag */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          border: "1.5px solid rgba(13,148,136,0.7)",
          boxShadow: "0 0 16px rgba(13,148,136,0.35), inset 0 0 8px rgba(13,148,136,0.1)",
        }}
      />
      {/* Dot — snappy */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-primary pointer-events-none z-[9999] hidden md:block"
        style={{
          x: dotX,
          y: dotY,
          boxShadow: "0 0 8px rgba(13,148,136,1)",
        }}
      />
    </>
  );
}

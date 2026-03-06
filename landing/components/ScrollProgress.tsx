"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[200] origin-left pointer-events-none"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #0d9488, #14b8a6, #06b6d4, #14b8a6, #0d9488)",
        backgroundSize: "200%",
        boxShadow: "0 0 12px rgba(13,148,136,0.8), 0 0 30px rgba(13,148,136,0.4)",
      }}
    />
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d9488",
        "primary-dark": "#0f766e",
        "primary-light": "#14b8a6",
        bg: "#06111f",
        surface: "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "blob-move": "blob 12s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "fade-up": "fadeUp 0.7s ease forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "33%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "66%": { borderRadius: "50% 60% 30% 60% / 30% 40% 70% 50%" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(13,148,136,0.4)" },
          "50%": { boxShadow: "0 0 45px rgba(13,148,136,0.8), 0 0 80px rgba(13,148,136,0.3)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

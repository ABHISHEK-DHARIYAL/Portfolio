import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        accent: "#3B82F6",
        base: "#050816",
        surface: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.25), transparent 60%)",
        "gradient-brand": "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,0.35)",
        "glow-accent": "0 0 40px rgba(59,130,246,0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "border-flow": "border-flow 4s linear infinite",
        blink: "blink 1s step-start infinite",
      },
    },
  },
  plugins: [],
};

export default config;

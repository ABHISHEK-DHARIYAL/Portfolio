"use client";

import { useTheme } from "./ThemeProvider";

/**
 * Pure CSS/SVG layered background — cheap to render, no canvas loop needed.
 * Sits behind everything at a fixed position so it drifts subtly under the
 * whole page rather than per-section.
 *
 * Most of this component's colors are plain Tailwind utility classes
 * (bg-base, bg-primary/20, etc.), which the light-theme CSS override
 * layer in globals.css already re-colors automatically — no change
 * needed here for those. The one exception is the `from-base` gradient
 * stop on the bottom fog layer: Tailwind compiles gradient-stop utilities
 * differently from plain background-color utilities, so the blanket CSS
 * override can't reliably catch it. Handled directly here instead, by
 * reading the theme and picking the matching gradient class.
 */
export default function AmbientBackground() {
  const { theme } = useTheme();
  const fogFrom = theme === "light" ? "from-[#fcfcff]" : "from-base";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base">
      {/* light theme only: crisp white with soft pastel washes + faint dot grid */}
      {theme === "light" && (
        <>
          <div className="absolute inset-0 [background:radial-gradient(60%_50%_at_15%_0%,rgba(124,58,237,0.10),transparent_70%),radial-gradient(50%_45%_at_90%_35%,rgba(59,130,246,0.09),transparent_70%),radial-gradient(45%_40%_at_10%_85%,rgba(244,114,182,0.08),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(rgba(76,29,149,0.13)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </>
      )}

      {/* moving gradient mesh */}
      <div className={`absolute inset-0 animate-[spin_60s_linear_infinite] opacity-40 ${theme === "light" ? "hidden" : ""} [background:conic-gradient(from_0deg_at_50%_50%,#7C3AED22,transparent_25%,#3B82F622,transparent_50%,#7C3AED22,transparent_75%,#3B82F622)]`} />

      {/* aurora bands */}
      <div className="absolute -top-1/4 left-1/4 h-[60vh] w-[60vw] animate-float rounded-full bg-primary/20 blur-[120px]" />
      <div
        className="absolute bottom-0 right-0 h-[50vh] w-[50vw] animate-float rounded-full bg-accent/15 blur-[130px]"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute left-0 top-1/2 h-[40vh] w-[40vw] animate-float rounded-full bg-fuchsia-500/10 blur-[110px]"
        style={{ animationDelay: "-1.5s" }}
      />

      {/* floating blobs */}
      <svg className={`absolute inset-0 h-full w-full opacity-20 ${theme === "light" ? "hidden" : ""}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blob-blur">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <circle cx="20%" cy="30%" r="120" fill="#7C3AED" filter="url(#blob-blur)">
          <animate attributeName="cy" values="30%;35%;30%" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle cx="80%" cy="70%" r="160" fill="#3B82F6" filter="url(#blob-blur)">
          <animate attributeName="cx" values="80%;75%;80%" dur="18s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* tiny stars — naturally fade into irrelevance on a light background
          (white dots at low opacity), which is the correct behavior rather
          than something that needs special-casing: a starfield isn't
          expected to be visible in "daytime." */}
      <div className="absolute inset-0 [background-image:radial-gradient(1px_1px_at_20px_30px,white,transparent),radial-gradient(1px_1px_at_120px_80px,white,transparent),radial-gradient(1px_1px_at_220px_40px,white,transparent),radial-gradient(1px_1px_at_320px_120px,white,transparent),radial-gradient(1px_1px_at_60px_160px,white,transparent)] [background-repeat:repeat] [background-size:400px_200px] opacity-[0.15]" />

      {/* film grain / noise */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* slow fog layer */}
      <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t ${fogFrom} to-transparent`} />
    </div>
  );
}

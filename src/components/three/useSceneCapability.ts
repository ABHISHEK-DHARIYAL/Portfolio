"use client";

import { useEffect, useState } from "react";

/**
 * True on small/touch screens. Used to scale down 3D scene complexity
 * (object counts, particle counts, DPR) rather than rendering the exact
 * same scene at every size — a phone GPU and a desktop GPU are not the
 * same budget.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpointPx}px), (pointer: coarse)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpointPx]);

  return isMobile;
}

/**
 * Whether this browser/device can actually create a WebGL context. Some
 * older devices, locked-down browsers, or unusual embedded webviews
 * can't — attempting to mount an R3F <Canvas> there fails or throws.
 * Checked once on mount so the hero can fall back to a plain CSS
 * gradient instead of a blank or broken section on those devices —
 * "should be working on all devices" means degrading gracefully, not
 * assuming WebGL is universal.
 */
export function useWebglSupported(): boolean | null {
  // null = not checked yet (server render / first paint)
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

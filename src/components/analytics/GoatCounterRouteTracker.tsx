"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars?: { path?: string; title?: string; event?: boolean }) => void;
    };
  }
}

/**
 * GoatCounter's count.js records the initial page load by itself, but
 * Next.js App Router navigations are client-side and never reload the
 * page — so every route change after the first needs a manual hit.
 */
export default function GoatCounterRouteTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // First run = initial load, already counted by count.js.
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.goatcounter?.count?.({ path: pathname });
  }, [pathname]);

  return null;
}

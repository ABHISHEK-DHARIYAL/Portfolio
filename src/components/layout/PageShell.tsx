"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Loader from "./Loader";
import CustomCursor from "./CustomCursor";
import CommandPalette from "./CommandPalette";
import ScrollProgress from "./ScrollProgress";
import Navbar from "./Navbar";
import SkipLink from "./SkipLink";
import SmoothScrollProvider from "./SmoothScrollProvider";
import ThemeProvider from "./ThemeProvider";
import SoundProvider from "./SoundProvider";
import AmbientBackground from "./AmbientBackground";
import ParticleField from "./ParticleField";
import CookieConsent from "./CookieConsent";
import FloatingDock from "./FloatingDock";
import EasterEggs from "./EasterEggs";
import { ToastProvider } from "@/components/ui/Toast";

export default function PageShell({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  return (
    <ThemeProvider>
      <SoundProvider>
        <ToastProvider>
          <SkipLink />
          {loading && <Loader onDone={() => setLoading(false)} />}
          <AmbientBackground />
          <ParticleField />
          <SmoothScrollProvider>
            <CustomCursor />
            <ScrollProgress />
            <Navbar />
            <AnimatePresence mode="wait">
              {!loading && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </SmoothScrollProvider>
          <CommandPalette />
          <CookieConsent />
          <FloatingDock />
          <EasterEggs />
        </ToastProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}

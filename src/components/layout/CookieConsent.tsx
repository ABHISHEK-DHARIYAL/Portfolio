"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, Check, Settings2 } from "lucide-react";

type Prefs = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
};

const STORAGE_KEY = "cookie-consent-v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
    preferences: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1600);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (p: Prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, savedAt: Date.now() }));
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, preferences: true });
  const necessaryOnly = () =>
    save({ necessary: true, analytics: false, preferences: false });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0, transition: { duration: 0.35, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-1/2 z-[85] w-[92vw] max-w-md -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0"
        >
          <div className="theme-lock-dark overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F24]/90 shadow-glow backdrop-blur-xl">
            <div className="flex items-start gap-3 p-5">
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand"
              >
                <Cookie className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <p className="font-display text-sm font-semibold text-white">
                  A little data, used well
                </p>
                <p className="mt-1 font-body text-xs leading-relaxed text-white/60">
                  This site uses cookies for essential functionality and,
                  optionally, anonymous analytics. Choose what you&apos;re
                  comfortable with — necessary cookies keep the site working
                  and can&apos;t be disabled.
                </p>
              </div>
            </div>

            <AnimatePresence initial={false} mode="wait">
              {customizing ? (
                <motion.div
                  key="customize"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/10 px-5"
                >
                  <div className="space-y-3 py-4">
                    <PrefRow
                      label="Necessary"
                      description="Required for the site to function. Always on."
                      checked
                      disabled
                    />
                    <PrefRow
                      label="Analytics"
                      description="Anonymous usage data to improve the experience."
                      checked={prefs.analytics}
                      onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                    />
                    <PrefRow
                      label="Preferences"
                      description="Remembers theme and sound settings."
                      checked={prefs.preferences}
                      onChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
              <button
                onClick={acceptAll}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs font-medium text-white shadow-glow transition hover:shadow-glow-accent"
              >
                <Check className="h-3.5 w-3.5" /> Accept All
              </button>
              <button
                onClick={necessaryOnly}
                className="rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 transition hover:border-white/40"
              >
                Necessary Only
              </button>
              <button
                onClick={() =>
                  customizing ? save(prefs) : setCustomizing(true)
                }
                className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-xs text-white/50 transition hover:text-white"
              >
                <Settings2 className="h-3.5 w-3.5" />
                {customizing ? "Save choices" : "Customize"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PrefRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-body text-xs font-medium text-white">{label}</p>
        <p className="font-body text-[11px] text-white/40">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/15"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <motion.span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
          animate={{ left: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

type SoundName = "hover" | "click" | "type" | "transition" | "notify" | "achievement";

type SoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue>({
  muted: true,
  toggleMuted: () => {},
  play: () => {},
});

export function useSound() {
  return useContext(SoundContext);
}

/**
 * All effects are synthesized on the fly with the Web Audio API — no audio
 * files to download, ship, or fail to load. Muted by default; the user
 * opts in via the toggle in the dock (consent-friendly, GDPR-safe: nothing
 * plays until they choose to).
 */
export default function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sound-enabled");
    if (stored === "true") setMuted(false);
  }, []);

  const getCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const play = (name: SoundName) => {
    if (muted) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    const presets: Record<SoundName, { freq: number; dur: number; type: OscillatorType }> = {
      hover: { freq: 660, dur: 0.05, type: "sine" },
      click: { freq: 440, dur: 0.08, type: "triangle" },
      type: { freq: 900, dur: 0.02, type: "square" },
      transition: { freq: 320, dur: 0.25, type: "sine" },
      notify: { freq: 740, dur: 0.15, type: "sine" },
      achievement: { freq: 523, dur: 0.35, type: "triangle" },
    };
    const p = presets[name];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = p.type;
    osc.frequency.value = p.freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + p.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + p.dur);

    if (name === "achievement") {
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = p.freq * 1.5;
      osc2.connect(gain);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + p.dur + 0.1);
    }
  };

  const toggleMuted = () => {
    setMuted((m) => {
      localStorage.setItem("sound-enabled", (!m).toString());
      return !m;
    });
  };

  return (
    <SoundContext.Provider value={{ muted, toggleMuted, play }}>
      {children}
    </SoundContext.Provider>
  );
}

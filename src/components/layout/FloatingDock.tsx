"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TerminalSquare, Bot, Volume2, VolumeX, Sparkles } from "lucide-react";
import Terminal from "./Terminal";
import AIAssistant from "./AIAssistant";
import ZuiFunMode from "./ZuiFunMode";
import { useSound } from "./SoundProvider";



export default function FloatingDock() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [zuiOpen, setZuiOpen] = useState(false);
  const { muted, toggleMuted, play } = useSound();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <DockButton
          active={assistantOpen}
          label="AI guide"
          onClick={() => {
            play("click");
            setAssistantOpen((v) => !v);
            setTerminalOpen(false);
          }}
        >
          <Bot className="h-5 w-5" />
        </DockButton>
        <DockButton
          active={terminalOpen}
          label="Terminal"
          onClick={() => {
            play("click");
            setTerminalOpen((v) => !v);
            setAssistantOpen(false);
          }}
        >
          <TerminalSquare className="h-5 w-5" />
        </DockButton>
        <DockButton
          active={zuiOpen}
          label="Explore (fun mode)"
          onClick={() => {
            play("click");
            setZuiOpen(true);
            setTerminalOpen(false);
            setAssistantOpen(false);
          }}
        >
          <Sparkles className="h-5 w-5" />
        </DockButton>
        <DockButton
          active={!muted}
          label={muted ? "Unmute sound" : "Mute sound"}
          onClick={() => {
            toggleMuted();
          }}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </DockButton>
      </div>

      <AnimatePresence>
        {terminalOpen && <Terminal key="terminal" onClose={() => setTerminalOpen(false)} />}
      </AnimatePresence>
      <AIAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      <ZuiFunMode open={zuiOpen} onClose={() => setZuiOpen(false)} />
    </>
  );
}

function DockButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      data-cursor="pointer"
      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
        active
          ? "border-primary/60 bg-primary/20 text-white shadow-glow"
          : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
      }`}
    >
      {children}
    </motion.button>
  );
}

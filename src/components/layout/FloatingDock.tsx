"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import AIAssistant from "./AIAssistant";

export default function FloatingDock() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <DockButton
          active={assistantOpen}
          label="AI guide"
          onClick={() => setAssistantOpen((v) => !v)}
        >
          <Bot className="h-5 w-5" />
        </DockButton>
      </div>

      <AIAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
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

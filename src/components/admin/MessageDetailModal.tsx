"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Clock, Globe, Monitor, Trash2, MailOpen, MailX } from "lucide-react";
import type { ContactMessage } from "@/lib/firestore-messages";

export default function MessageDetailModal({
  message,
  onClose,
  onToggleStatus,
  onDelete,
}: {
  message: ContactMessage | null;
  onClose: () => void;
  onToggleStatus: (message: ContactMessage) => void;
  onDelete: (message: ContactMessage) => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="theme-lock-dark max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0F24]/95 p-6 shadow-glow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
                    message.status === "unread"
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {message.status}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">
                  {message.subject}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full border border-white/10 p-2 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-white/10 p-3 font-mono text-xs text-white/50">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="text-white/80">{message.name}</span>
                <a href={`mailto:${message.email}`} className="text-accent hover:underline">
                  {message.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {new Date(message.createdAt).toLocaleString()}
              </div>
              {message.ipAddress && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {message.ipAddress}
                </div>
              )}
              {message.userAgent && (
                <div className="flex items-start gap-2">
                  <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">{message.userAgent}</span>
                </div>
              )}
            </div>

            <p className="mt-4 whitespace-pre-wrap font-body text-sm leading-relaxed text-white/70">
              {message.message}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => onToggleStatus(message)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 font-mono text-xs text-white/80 hover:border-primary/50 hover:text-white"
              >
                {message.status === "unread" ? (
                  <>
                    <MailOpen className="h-3.5 w-3.5" /> Mark as read
                  </>
                ) : (
                  <>
                    <MailX className="h-3.5 w-3.5" /> Mark as unread
                  </>
                )}
              </button>
              <button
                onClick={() => onDelete(message)}
                className="flex items-center gap-1.5 rounded-full border border-red-400/30 px-3.5 py-2 font-mono text-xs text-red-300 hover:border-red-400/60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

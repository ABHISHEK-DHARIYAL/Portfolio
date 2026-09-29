"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Mail,
  MailOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ContactMessage, MessageStatus } from "@/lib/firestore-messages";
import { useToast } from "@/components/ui/Toast";
import MessageDetailModal from "@/components/admin/MessageDetailModal";
import AdminHeader from "@/components/admin/AdminHeader";

type StatusFilter = MessageStatus | "all";
type SortOrder = "newest" | "oldest";

export default function AdminMessagesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  // Cursor-based pagination: `cursorStack` holds the cursor used to reach
  // each previous page, so "Previous" can pop back to it. `nextCursor` is
  // what the server says to use for "Next."
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const currentCursor = cursorStack[cursorStack.length - 1];

  const fetchMessages = useCallback(
    async (cursor: string | null) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: statusFilter, sort, pageSize: "20" });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/messages?${params.toString()}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
      } catch {
        showToast("error", "Couldn't load messages. Try refreshing.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, sort, router, showToast]
  );

  // Reset to page 1 whenever filter/sort changes.
  useEffect(() => {
    setCursorStack([null]);
  }, [statusFilter, sort]);

  useEffect(() => {
    fetchMessages(currentCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCursor, fetchMessages]);

  const goNext = () => {
    if (!nextCursor) return;
    setCursorStack((stack) => [...stack, nextCursor]);
  };
  const goPrev = () => {
    setCursorStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  };

  const handleToggleStatus = async (message: ContactMessage) => {
    const newStatus: MessageStatus = message.status === "unread" ? "read" : "unread";
    // Optimistic update, then reconcile with the server.
    setMessages((msgs) => msgs.map((m) => (m.id === message.id ? { ...m, status: newStatus } : m)));
    setSelected((s) => (s && s.id === message.id ? { ...s, status: newStatus } : s));

    try {
      const res = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast("error", "Failed to update status — reverting.");
      setMessages((msgs) => msgs.map((m) => (m.id === message.id ? message : m)));
    }
  };

  const handleDelete = async (message: ContactMessage) => {
    if (!confirm(`Delete the message from ${message.name}? This can't be undone.`)) return;

    const previous = messages;
    setMessages((msgs) => msgs.filter((m) => m.id !== message.id));
    setSelected((s) => (s && s.id === message.id ? null : s));

    try {
      const res = await fetch(`/api/admin/messages/${message.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Message deleted.");
    } catch {
      showToast("error", "Failed to delete — restoring.");
      setMessages(previous);
    }
  };

  // Search is applied client-side, over the currently loaded page only —
  // Firestore has no full-text search. See firestore-messages.ts for why.
  const visibleMessages = messages.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminHeader />
        <h1 className="mb-4 font-display text-2xl font-semibold text-white">Contact Messages</h1>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this page…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-xs text-white focus:border-primary/60 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-xs text-white focus:border-primary/60 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button
            onClick={() => fetchMessages(currentCursor)}
            aria-label="Refresh"
            className="rounded-xl border border-white/10 p-2.5 text-white/50 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Table on desktop */}
        <div className="hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03]">
              <tr className="font-mono text-[11px] uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleMessages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  onView={() => setSelected(m)}
                  onToggleStatus={() => handleToggleStatus(m)}
                  onDelete={() => handleDelete(m)}
                />
              ))}
              {!loading && visibleMessages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-body text-sm text-white/40">
                    No messages{search ? " match your search" : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards on mobile */}
        <div className="space-y-3 sm:hidden">
          {visibleMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelected(m)}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-body text-sm font-medium text-white">{m.name}</p>
                  <p className="font-mono text-xs text-white/40">{m.email}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <p className="mt-2 line-clamp-1 font-body text-xs text-white/60">{m.subject}</p>
              <p className="mt-1 font-mono text-[10px] text-white/30">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </motion.div>
          ))}
          {!loading && visibleMessages.length === 0 && (
            <p className="py-10 text-center font-body text-sm text-white/40">
              No messages{search ? " match your search" : ""}.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={cursorStack.length <= 1}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3.5 py-2 font-mono text-xs text-white/60 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="font-mono text-[11px] text-white/30">Page {cursorStack.length}</span>
          <button
            onClick={goNext}
            disabled={!nextCursor}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3.5 py-2 font-mono text-xs text-white/60 disabled:opacity-30"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <MessageDetailModal
        message={selected}
        onClose={() => setSelected(null)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: MessageStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        status === "unread" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40"
      }`}
    >
      {status}
    </span>
  );
}

function MessageRow({
  message,
  onView,
  onToggleStatus,
  onDelete,
}: {
  message: ContactMessage;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group cursor-pointer font-body text-sm hover:bg-white/[0.02]" onClick={onView}>
      <td className="px-4 py-3">
        <p className="text-white/90">{message.name}</p>
        <p className="font-mono text-xs text-white/40">{message.email}</p>
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-white/70">{message.subject}</td>
      <td className="px-4 py-3 font-mono text-xs text-white/40">
        {new Date(message.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={message.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
            aria-label="Toggle read status"
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            {message.status === "unread" ? (
              <MailOpen className="h-3.5 w-3.5" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete message"
            className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

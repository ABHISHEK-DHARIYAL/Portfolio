"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ExternalLink, Trophy, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import type { StoredContest } from "@/lib/firestore-contests";
import type { ContestFormValues } from "@/lib/contest-schema";
import { platformAbbr, platformColor } from "@/lib/platform-icon";

const EMPTY_FORM: ContestFormValues = { platform: "", handle: "", url: "", shortLabel: "", order: 0, published: true };

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; contest: StoredContest };

export default function AdminContestsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [contests, setContests] = useState<StoredContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contests");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContests(data.contests);
    } catch {
      showToast("error", "Couldn't load contest links.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const handleCreate = async (values: ContestFormValues) => {
    const res = await fetch("/api/admin/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to add contest link.");
      return;
    }
    showToast("success", "Contest link added.");
    setView({ mode: "list" });
    fetchContests();
  };

  const handleUpdate = async (contest: StoredContest, values: ContestFormValues) => {
    const res = await fetch(`/api/admin/contests/${contest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to update contest link.");
      return;
    }
    showToast("success", "Contest link updated.");
    setView({ mode: "list" });
    fetchContests();
  };

  const handleDelete = async (contest: StoredContest) => {
    if (!confirm(`Remove "${contest.platform}"?`)) return;
    try {
      const res = await fetch(`/api/admin/contests/${contest.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Contest link removed.");
      setContests((c) => c.filter((item) => item.id !== contest.id));
    } catch {
      showToast("error", "Failed to remove contest link.");
    }
  };

  const handleTogglePublished = async (contest: StoredContest) => {
    const newValue = !contest.published;
    setContests((c) => c.map((item) => (item.id === contest.id ? { ...item, published: newValue } : item)));
    try {
      const res = await fetch(`/api/admin/contests/${contest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast("error", "Failed to update — reverting.");
      setContests((c) => c.map((item) => (item.id === contest.id ? contest : item)));
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <AdminHeader />

        {view.mode === "list" && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">Coding Profiles</h1>
              <button
                onClick={() => setView({ mode: "create" })}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow"
              >
                <Plus className="h-3.5 w-3.5" /> Add link
              </button>
            </div>
            <p className="mb-6 font-body text-sm text-white/50">
              Codeforces, CodeChef, LeetCode, or anything else — each one shows up as a
              clickable card in the "Coding Profiles" section, opening straight to the URL
              you set here. Delete them all and the section disappears from the site.
            </p>

            {!loading && contests.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <Trophy className="mx-auto mb-2 h-6 w-6 text-white/30" />
                <p className="font-body text-sm text-white/60">
                  No coding profiles. The &quot;Coding Profiles&quot; section is hidden on the public
                  site until you add one.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {contests.map((contest) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${platformColor(contest.platform)}33, ${platformColor(contest.platform)}12)`,
                      border: `1px solid ${platformColor(contest.platform)}55`,
                    }}
                  >
                    <span
                      className="font-display text-xs font-bold tracking-wide"
                      style={{ color: platformColor(contest.platform) }}
                    >
                      {platformAbbr(contest.platform, contest.shortLabel)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-semibold text-white">{contest.platform}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                          contest.published ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/40"
                        }`}
                      >
                        {contest.published ? "Published" : "Hidden"}
                      </span>
                    </div>
                    {contest.handle && (
                      <p className="mt-0.5 font-mono text-xs text-white/40">{contest.handle}</p>
                    )}
                    <a
                      href={contest.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 truncate font-mono text-[11px] text-accent hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contest.url}</span>
                    </a>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePublished(contest)}
                      className="rounded-full border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                    >
                      {contest.published ? "Hide" : "Publish"}
                    </button>
                    <button
                      onClick={() => setView({ mode: "edit", contest })}
                      aria-label="Edit"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contest)}
                      aria-label="Delete"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {view.mode === "create" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Add contest link</h1>
            <ContestForm
              onSubmit={handleCreate}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Add link"
            />
          </>
        )}

        {view.mode === "edit" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Edit contest link</h1>
            <ContestForm
              initialValues={view.contest}
              onSubmit={(values) => handleUpdate(view.contest, values)}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Save changes"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ContestForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initialValues?: Partial<ContestFormValues>;
  onSubmit: (values: ContestFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<ContestFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ContestFormValues>(key: K, value: ContestFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Platform
        </label>
        <input
          required
          value={form.platform}
          onChange={(e) => set("platform", e.target.value)}
          placeholder="LeetCode, Codeforces, CodeChef…"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Icon letters (optional)
        </label>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${platformColor(form.platform || "?")}33, ${platformColor(form.platform || "?")}12)`,
              border: `1px solid ${platformColor(form.platform || "?")}55`,
            }}
          >
            <span
              className="font-display text-sm font-bold tracking-wide"
              style={{ color: platformColor(form.platform || "?") }}
            >
              {platformAbbr(form.platform || "?", form.shortLabel)}
            </span>
          </div>
          <input
            value={form.shortLabel}
            onChange={(e) => set("shortLabel", e.target.value.toUpperCase().slice(0, 3))}
            placeholder={platformAbbr(form.platform || "Platform")}
            maxLength={3}
            className="w-28 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm uppercase tracking-wider text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
          />
        </div>
        <p className="mt-1 font-mono text-[10px] text-white/30">
          Shown inside the icon badge on the live site — up to 3 letters. Leave blank to use the
          preview shown above.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Handle / username (optional)
        </label>
        <input
          value={form.handle}
          onChange={(e) => set("handle", e.target.value)}
          placeholder="Shown under the platform name"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Profile URL
        </label>
        <input
          required
          type="url"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://leetcode.com/u/your-handle"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
            Display order
          </label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white focus:border-primary/60 focus:outline-none"
          />
          <p className="mt-1 font-mono text-[10px] text-white/30">Lower numbers show first.</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 font-body text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Published (visible on the live site)
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 font-body text-sm font-medium text-white shadow-glow disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-white/70 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

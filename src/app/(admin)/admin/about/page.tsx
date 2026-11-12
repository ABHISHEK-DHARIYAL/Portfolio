"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import { ABOUT_ICONS, type AboutContent } from "@/lib/about-schema";

const INPUT =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";
const LABEL = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";

const ICON_LABELS: Record<(typeof ABOUT_ICONS)[number], string> = {
  github: "GitHub",
  leetcode: "LeetCode",
  codechef: "CodeChef",
  codeforces: "Codeforces",
  linkedin: "LinkedIn",
  mail: "Email",
  link: "Generic link",
};

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminAboutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<AboutContent | null>(null);
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/about");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.about);
      setCustomized(data.customized);
    } catch {
      showToast("error", "Couldn't load About content.");
    }
  }, [router, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Failed to save.");
        return;
      }
      setCustomized(true);
      showToast("success", "About section saved.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Reset the About section to the built-in defaults? Your saved version will be deleted.")) return;
    const res = await fetch("/api/admin/about", { method: "DELETE" });
    if (!res.ok) {
      showToast("error", "Failed to reset.");
      return;
    }
    showToast("success", "Reset to defaults.");
    load();
  };

  if (!form) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <AdminHeader />
        <p className="font-mono text-xs text-white/40">Loading…</p>
      </main>
    );
  }

  const patch = (p: Partial<AboutContent>) => setForm((f) => (f ? { ...f, ...p } : f));
  const card = "space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6";
  const small =
    "rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminHeader />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">About section</h1>
          <p className="mt-1 font-body text-sm text-white/50">
            {customized ? "Showing your saved version." : "Showing the built-in defaults — save to customize."}
          </p>
        </div>
        {customized && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 font-mono text-xs text-white/60 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        )}
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Heading + paragraphs */}
        <div className={card}>
          <div>
            <label className={LABEL}>Heading</label>
            <input required value={form.heading} onChange={(e) => patch({ heading: e.target.value })} className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Paragraphs</label>
            <div className="space-y-3">
              {form.intro.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <textarea
                    required
                    rows={3}
                    value={p}
                    onChange={(e) => patch({ intro: form.intro.map((x, j) => (j === i ? e.target.value : x)) })}
                    className={INPUT}
                  />
                  <button
                    type="button"
                    aria-label="Remove paragraph"
                    disabled={form.intro.length <= 1}
                    onClick={() => patch({ intro: form.intro.filter((_, j) => j !== i) })}
                    className={small}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {form.intro.length < 5 && (
              <button
                type="button"
                onClick={() => patch({ intro: [...form.intro, ""] })}
                className="mt-3 flex items-center gap-1.5 font-mono text-xs text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add paragraph
              </button>
            )}
          </div>
        </div>

        {/* The four stat boxes (LeetCode / CodeChef / Codeforces numbers) are
            filled automatically from your profiles — nothing to edit here.
            They use the LeetCode, CodeChef and Codeforces links below. */}
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 font-body text-sm text-white/50">
          The four stat boxes (ratings and problems solved) update automatically from your LeetCode, CodeChef and
          Codeforces profiles. Keep those three links below correct — that&apos;s how the site finds your usernames.
        </p>

        {/* Icon links */}
        <div className={card}>
          <label className={LABEL}>Icon links</label>
          <div className="space-y-3">
            {form.links.map((l, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-[140px_130px_1fr_auto]">
                <select
                  value={l.icon}
                  onChange={(e) =>
                    patch({ links: form.links.map((x, j) => (j === i ? { ...x, icon: e.target.value as typeof l.icon } : x)) })
                  }
                  className={INPUT}
                >
                  {ABOUT_ICONS.map((ic) => (
                    <option key={ic} value={ic} className="text-black">
                      {ICON_LABELS[ic]}
                    </option>
                  ))}
                </select>
                <input
                  required
                  placeholder="Label"
                  value={l.label}
                  onChange={(e) => patch({ links: form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  className={INPUT}
                />
                <input
                  required
                  placeholder="https://… or mailto:…"
                  value={l.href}
                  onChange={(e) => patch({ links: form.links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })}
                  className={INPUT}
                />
                <div className="flex gap-2">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => patch({ links: move(form.links, i, i - 1) })} className={small}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === form.links.length - 1} onClick={() => patch({ links: move(form.links, i, i + 1) })} className={small}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Remove link" onClick={() => patch({ links: form.links.filter((_, j) => j !== i) })} className={small}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {form.links.length < 10 && (
            <button
              type="button"
              onClick={() => patch({ links: [...form.links, { label: "", href: "", icon: "link" }] })}
              className="flex items-center gap-1.5 font-mono text-xs text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 font-body text-sm font-medium text-white shadow-glow disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import type { HeroContent, HeroQuestion } from "@/lib/hero-schema";

const INPUT =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";
const LABEL = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";

// Suggestions for the "Goes to" box — you can still type any #section, /page or https:// link.
const DESTINATIONS = [
  "#about",
  "#projects",
  "#journey",
  "#achievements",
  "#github",
  "#coding-profiles",
  "#contact",
  "/skills",
  "/stories",
];

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminHeroPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<HeroContent | null>(null);
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hero");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.hero);
      setCustomized(data.customized);
    } catch {
      showToast("error", "Couldn't load the hero questions.");
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
      const res = await fetch("/api/admin/hero", {
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
      showToast("success", "Hero questions saved.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Reset the hero questions to the built-in defaults? Your saved version will be deleted.")) return;
    const res = await fetch("/api/admin/hero", { method: "DELETE" });
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

  const setItems = (items: HeroQuestion[]) => setForm({ items });
  const edit = (i: number, p: Partial<HeroQuestion>) =>
    setItems(form.items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const small =
    "rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminHeader />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Hero questions</h1>
          <p className="mt-1 font-body text-sm text-white/50">
            The big question on the home page, the line typed under it, and the button that follows.
            They rotate in the order below.{" "}
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
        <datalist id="hero-destinations">
          {DESTINATIONS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        {form.items.map((it, i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-primary">Question {i + 1}</p>
              <div className="flex gap-2">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => setItems(move(form.items, i, i - 1))} className={small}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Move down" disabled={i === form.items.length - 1} onClick={() => setItems(move(form.items, i, i + 1))} className={small}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Remove question" disabled={form.items.length <= 1} onClick={() => setItems(form.items.filter((_, j) => j !== i))} className={small}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className={LABEL}>Question (big heading)</label>
              <input required maxLength={90} value={it.q} onChange={(e) => edit(i, { q: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Answer (typed out below)</label>
              <input required maxLength={140} value={it.a} onChange={(e) => edit(i, { a: e.target.value })} className={INPUT} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Button text</label>
                <input required maxLength={60} value={it.cta} onChange={(e) => edit(i, { cta: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Button goes to</label>
                <input
                  required
                  list="hero-destinations"
                  placeholder="#projects, /stories or https://…"
                  value={it.href}
                  onChange={(e) => edit(i, { href: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>
          </div>
        ))}

        {form.items.length < 12 && (
          <button
            type="button"
            onClick={() => setItems([...form.items, { q: "", a: "", href: "#projects", cta: "" }])}
            className="flex items-center gap-1.5 font-mono text-xs text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        )}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 font-body text-sm font-medium text-white shadow-glow disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}

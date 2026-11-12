"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import type { JourneyContent } from "@/lib/journey-schema";

const INPUT =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";
const LABEL = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";
const MAX_STEPS = 30;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminJourneyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<JourneyContent | null>(null);
  const [customized, setCustomized] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/journey");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.journey);
      setCustomized(data.customized);
    } catch {
      showToast("error", "Couldn't load Journey content.");
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
      const res = await fetch("/api/admin/journey", {
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
      showToast("success", "Journey saved.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Reset the Journey to the built-in defaults? Your saved version will be deleted.")) return;
    const res = await fetch("/api/admin/journey", { method: "DELETE" });
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

  const setSteps = (steps: JourneyContent["steps"]) => setForm({ steps });
  const patchStep = (i: number, p: Partial<JourneyContent["steps"][number]>) =>
    setSteps(form.steps.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const small =
    "rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminHeader />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Journey</h1>
          <p className="mt-1 font-body text-sm text-white/50">
            {customized ? "Showing your saved version." : "Showing the built-in defaults — save to customize."}{" "}
            Steps appear left to right in this order.
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
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="space-y-4">
            {form.steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4">
                <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
                  <div>
                    <label className={LABEL}>Year</label>
                    <input
                      placeholder="2024"
                      maxLength={12}
                      value={s.year}
                      onChange={(e) => patchStep(i, { year: e.target.value })}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Title</label>
                    <input
                      required
                      maxLength={80}
                      placeholder="Built HourGlass"
                      value={s.title}
                      onChange={(e) => patchStep(i, { title: e.target.value })}
                      className={INPUT}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={LABEL}>Short info (optional)</label>
                  <input
                    maxLength={140}
                    placeholder="One short line"
                    value={s.description}
                    onChange={(e) => patchStep(i, { description: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => setSteps(move(form.steps, i, i - 1))} className={small}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Move later" disabled={i === form.steps.length - 1} onClick={() => setSteps(move(form.steps, i, i + 1))} className={small}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove step"
                    disabled={form.steps.length <= 1}
                    onClick={() => setSteps(form.steps.filter((_, j) => j !== i))}
                    className={small}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {form.steps.length < MAX_STEPS && (
            <button
              type="button"
              onClick={() => setSteps([...form.steps, { year: "", title: "", description: "" }])}
              className="flex items-center gap-1.5 font-mono text-xs text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add step
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

"use client";

import { useState } from "react";
import { Plus, X, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import type { StoryFormValues } from "@/lib/story-schema";
import { ListEditor, TextField } from "@/components/admin/ProjectForm";

export type ProjectOption = { slug: string; title: string; tagline: string; accent: string };

const ACCENT_PRESETS = ["#7C3AED", "#3B82F6", "#22D3EE", "#F472B6", "#FACC15"];

const EMPTY_FORM: StoryFormValues = {
  slug: "",
  title: "",
  tagline: "",
  accent: "",
  idea: "",
  problem: "",
  approach: [],
  decisions: [],
  challenges: [],
  learned: [],
  next: "",
  order: 0,
  published: true,
};

const labelCls = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";
const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <p className="mt-1 font-mono text-[10px] text-white/30">{hint}</p>}
    </div>
  );
}

type Pair = { a: string; b: string };

/** A list of (title, longer text) pairs — used for approach steps, decisions and challenges. */
function PairEditor({
  label,
  items,
  onChange,
  aPlaceholder,
  bPlaceholder,
  numbered,
  reorderable,
  bRequired,
}: {
  label: string;
  items: Pair[];
  onChange: (items: Pair[]) => void;
  aPlaceholder: string;
  bPlaceholder: string;
  numbered?: boolean;
  reorderable?: boolean;
  bRequired?: boolean;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const add = () => {
    if (!a.trim() || (bRequired && !b.trim())) return;
    onChange([...items, { a: a.trim(), b: b.trim() }]);
    setA("");
    setB("");
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="mb-2 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 p-2.5">
            <div className="min-w-0 text-xs">
              <p className="text-white/80">
                {numbered && <span className="mr-1.5 font-mono text-primary">{i + 1}.</span>}
                {item.a}
              </p>
              {item.b && <p className="mt-0.5 whitespace-pre-line text-white/40">{item.b}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {reorderable && (
                <>
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="text-white/40 hover:text-white disabled:opacity-20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="text-white/40 hover:text-white disabled:opacity-20"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Remove"
                className="text-white/40 hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder={aPlaceholder} className={inputCls} />
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={bPlaceholder}
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={add}
            aria-label="Add"
            className="self-start rounded-lg border border-white/10 px-3 py-2 text-white/60 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoryForm({
  initialValues,
  projectOptions,
  onSubmit,
  onCancel,
  submitLabel = "Save story",
}: {
  initialValues?: Partial<StoryFormValues>;
  projectOptions: ProjectOption[];
  onSubmit: (values: StoryFormValues) => Promise<{ error?: string; fieldErrors?: Record<string, string[]> } | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<StoryFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const set = <K extends keyof StoryFormValues>(key: K, value: StoryFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickProject = (slug: string) => {
    const p = projectOptions.find((o) => o.slug === slug);
    if (!p) return;
    setSlugTouched(true);
    setForm((f) => ({
      ...f,
      slug: p.slug,
      title: f.title || p.title,
      tagline: f.tagline || p.tagline,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    const result = await onSubmit(form);
    if (result?.error) {
      setError(result.error);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-body text-xs text-red-300">
          {error}
        </p>
      )}

      {projectOptions.length > 0 && (
        <div>
          <label className={labelCls}>Link to an existing project (optional)</label>
          <select
            value={projectOptions.some((o) => o.slug === form.slug) ? form.slug : ""}
            onChange={(e) => pickProject(e.target.value)}
            className={inputCls}
          >
            <option value="">— choose a project —</option>
            {projectOptions.map((o) => (
              <option key={o.slug} value={o.slug} className="bg-[#0A0F24]">
                {o.title}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-[10px] text-white/30">
            Linking uses the project&apos;s slug, so the story page shows its tech stack and Live/GitHub links.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Title"
          value={form.title}
          onChange={(v) => {
            set("title", v);
            if (!slugTouched) set("slug", slugify(v));
          }}
          error={fieldErrors.title?.[0]}
        />
        <TextField
          label="Slug"
          value={form.slug}
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", v);
          }}
          error={fieldErrors.slug?.[0]}
          mono
        />
      </div>

      <TextField label="Tagline (optional)" value={form.tagline} onChange={(v) => set("tagline", v)} />

      <TextArea
        label="The spark — how I thought of it"
        value={form.idea}
        onChange={(v) => set("idea", v)}
        hint="Leave a blank line between paragraphs."
        placeholder="What made you start this project?"
      />
      <TextArea
        label="The problem — what I wanted to solve"
        value={form.problem}
        onChange={(v) => set("problem", v)}
        rows={4}
      />

      <PairEditor
        label="My approach — steps, in order"
        items={form.approach.map((x) => ({ a: x.step, b: x.detail }))}
        onChange={(v) => set("approach", v.map((x) => ({ step: x.a, detail: x.b })))}
        aPlaceholder="Step (e.g. Sketched the data model first)"
        bPlaceholder="What you did and why (optional)"
        numbered
        reorderable
      />

      <PairEditor
        label="Key decisions"
        items={form.decisions.map((x) => ({ a: x.decision, b: x.reason }))}
        onChange={(v) => set("decisions", v.map((x) => ({ decision: x.a, reason: x.b })))}
        aPlaceholder="Decision (e.g. Chose Firebase over MySQL)"
        bPlaceholder="Why (optional)"
      />

      <PairEditor
        label="Challenges & fixes"
        items={form.challenges.map((x) => ({ a: x.problem, b: x.solution }))}
        onChange={(v) => set("challenges", v.map((x) => ({ problem: x.a, solution: x.b })))}
        aPlaceholder="Problem"
        bPlaceholder="How you fixed it"
        bRequired
      />

      <ListEditor
        label="What I learned"
        items={form.learned}
        onChange={(v) => set("learned", v)}
        placeholder="Add a lesson and press Enter"
      />

      <TextArea label="What's next" value={form.next} onChange={(v) => set("next", v)} rows={3} />

      <div>
        <label className={labelCls}>Accent color (optional — defaults to the project&apos;s color)</label>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("accent", color)}
              style={{ backgroundColor: color }}
              className={`h-7 w-7 rounded-full ${
                form.accent === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0A0F24]" : ""
              }`}
              aria-label={`Use accent ${color}`}
            />
          ))}
          <input
            value={form.accent ?? ""}
            onChange={(e) => set("accent", e.target.value)}
            placeholder="#7C3AED"
            className="w-28 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white focus:border-primary/60 focus:outline-none"
          />
          {form.accent && (
            <button
              type="button"
              onClick={() => set("accent", "")}
              className="font-mono text-[11px] text-white/40 hover:text-white"
            >
              clear
            </button>
          )}
        </div>
        {fieldErrors.accent?.[0] && <p className="mt-1 font-mono text-[11px] text-red-300">{fieldErrors.accent[0]}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Display order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value) || 0)}
            className={inputCls}
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

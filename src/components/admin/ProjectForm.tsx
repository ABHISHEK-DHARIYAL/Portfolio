"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import type { ProjectFormValues } from "@/lib/project-schema";

const ACCENT_PRESETS = ["#7C3AED", "#3B82F6", "#22D3EE", "#F472B6", "#FACC15"];

const EMPTY_FORM: ProjectFormValues = {
  slug: "",
  title: "",
  tagline: "",
  description: "",
  features: [],
  stack: [],
  liveUrl: "",
  githubUrl: "",
  accent: "#7C3AED",
  architecture: [],
  challenges: [],
  highlights: [],
  order: 0,
  published: true,
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A labeled input for a dynamic list of short strings (features, stack, etc). */
function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  };

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
        {label}
      </label>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/80"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-white/40 hover:text-red-300"
              aria-label={`Remove ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-white/10 px-3 text-white/60 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ChallengesEditor({
  items,
  onChange,
}: {
  items: ProjectFormValues["challenges"];
  onChange: (items: ProjectFormValues["challenges"]) => void;
}) {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");

  const add = () => {
    if (!problem.trim() || !solution.trim()) return;
    onChange([...items, { problem: problem.trim(), solution: solution.trim() }]);
    setProblem("");
    setSolution("");
  };

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
        Challenges & solutions
      </label>
      <div className="mb-2 space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 p-2.5">
            <div className="text-xs">
              <p className="text-white/80">{c.problem}</p>
              <p className="mt-0.5 text-white/40">{c.solution}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="shrink-0 text-white/40 hover:text-red-300"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Problem"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Solution"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-lg border border-white/10 px-3 text-white/60 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save project",
}: {
  initialValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<{ error?: string; fieldErrors?: Record<string, string[]> } | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<ProjectFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-body text-xs text-red-300">
          {error}
        </p>
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

      <TextField label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Description
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Live URL (optional)" value={form.liveUrl ?? ""} onChange={(v) => set("liveUrl", v)} />
        <TextField label="GitHub URL (optional)" value={form.githubUrl ?? ""} onChange={(v) => set("githubUrl", v)} />
      </div>

      <ListEditor
        label="Features"
        items={form.features}
        onChange={(v) => set("features", v)}
        placeholder="Add a feature and press Enter"
      />
      <ListEditor
        label="Tech stack"
        items={form.stack}
        onChange={(v) => set("stack", v)}
        placeholder="Add a technology and press Enter"
      />
      <ListEditor
        label="Architecture overview"
        items={form.architecture}
        onChange={(v) => set("architecture", v)}
        placeholder="Add an architecture note and press Enter"
      />
      <ChallengesEditor items={form.challenges} onChange={(v) => set("challenges", v)} />
      <ListEditor
        label="Highlights"
        items={form.highlights}
        onChange={(v) => set("highlights", v)}
        placeholder="Add a highlight and press Enter"
      />

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
          Accent color
        </label>
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
            value={form.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="w-28 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white focus:border-primary/60 focus:outline-none"
          />
        </div>
        {fieldErrors.accent?.[0] && (
          <p className="mt-1 font-mono text-[11px] text-red-300">{fieldErrors.accent[0]}</p>
        )}
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

function TextField({
  label,
  value,
  onChange,
  error,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none ${
          mono ? "font-mono" : "font-body"
        } ${error ? "border-red-400/50" : "border-white/10 focus:border-primary/60"}`}
      />
      {error && <p className="mt-1 font-mono text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

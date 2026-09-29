"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Award, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import { ACHIEVEMENT_CATEGORIES } from "@/lib/achievement-schema";
import type { StoredAchievement } from "@/lib/firestore-achievements";
import type { AchievementFormValues } from "@/lib/achievement-schema";

const EMPTY_FORM: AchievementFormValues = {
  title: "",
  organization: "",
  category: ACHIEVEMENT_CATEGORIES[0],
  metric: "",
  description: "",
  link: "",
  visible: true,
};

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; achievement: StoredAchievement };

export default function AdminAchievementsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [achievements, setAchievements] = useState<StoredAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/achievements");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAchievements(data.achievements);
    } catch {
      showToast("error", "Couldn't load achievements.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleCreate = async (values: AchievementFormValues) => {
    const res = await fetch("/api/admin/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to add achievement.");
      return;
    }
    showToast("success", "Achievement added.");
    setView({ mode: "list" });
    fetchAchievements();
  };

  const handleUpdate = async (achievement: StoredAchievement, values: AchievementFormValues) => {
    const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to update achievement.");
      return;
    }
    showToast("success", "Achievement updated.");
    setView({ mode: "list" });
    fetchAchievements();
  };

  const handleDelete = async (achievement: StoredAchievement) => {
    if (!confirm(`Delete "${achievement.title}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/achievements/${achievement.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Achievement deleted.");
      setAchievements((a) => a.filter((item) => item.id !== achievement.id));
    } catch {
      showToast("error", "Failed to delete achievement.");
    }
  };

  const handleToggleVisible = async (achievement: StoredAchievement) => {
    const newValue = !achievement.visible;
    setAchievements((a) =>
      a.map((item) => (item.id === achievement.id ? { ...item, visible: newValue } : item))
    );
    try {
      const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: newValue }),
      });
      if (!res.ok) throw new Error();
      showToast("success", newValue ? "Now visible on the site." : "Hidden from the site.");
    } catch {
      showToast("error", "Failed to update — reverting.");
      setAchievements((a) => a.map((item) => (item.id === achievement.id ? achievement : item)));
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <AdminHeader />

        {view.mode === "list" && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">Achievements</h1>
              <button
                onClick={() => setView({ mode: "create" })}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow"
              >
                <Plus className="h-3.5 w-3.5" /> Add achievement
              </button>
            </div>
            <p className="mb-6 font-body text-sm text-white/50">
              Only Title, Category, and Visible are required — Organization, Metric /
              Result, Description, and Link are optional, and any left blank simply
              won't show up on the public card.
            </p>

            {!loading && achievements.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <Award className="mx-auto mb-2 h-6 w-6 text-white/30" />
                <p className="font-body text-sm text-white/60">No achievements added yet.</p>
                <button
                  onClick={() => setView({ mode: "create" })}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 hover:border-primary/50 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add one
                </button>
              </div>
            )}

            <div className="space-y-3">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-semibold text-white">{achievement.title}</p>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
                        {achievement.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                          achievement.visible
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {achievement.visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    {/* Organization and Metric only render when present — same
                        "no empty placeholders" rule as the public site. */}
                    {achievement.organization && (
                      <p className="mt-1 font-mono text-xs text-white/40">{achievement.organization}</p>
                    )}
                    {achievement.metric && (
                      <p className="mt-1 font-body text-xs text-accent">{achievement.metric}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleToggleVisible(achievement)}
                      aria-label={achievement.visible ? "Hide" : "Show"}
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      {achievement.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setView({ mode: "edit", achievement })}
                      aria-label="Edit"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(achievement)}
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
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Add achievement</h1>
            <AchievementForm
              onSubmit={handleCreate}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Save achievement"
            />
          </>
        )}

        {view.mode === "edit" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Edit achievement</h1>
            <AchievementForm
              initialValues={view.achievement}
              onSubmit={(values) => handleUpdate(view.achievement, values)}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Save changes"
            />
          </>
        )}
      </div>
    </div>
  );
}

function AchievementForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initialValues?: Partial<AchievementFormValues>;
  onSubmit: (values: AchievementFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AchievementFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AchievementFormValues>(key: K, value: AchievementFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  const labelClass = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";
  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <label className={labelClass}>Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Flipkart GRiD 8.0"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Organization</label>
        <input
          value={form.organization}
          onChange={(e) => set("organization", e.target.value)}
          placeholder="Flipkart, LeetCode, NTA…"
          className={inputClass}
        />
        <p className="mt-1 font-mono text-[10px] text-white/30">
          Optional — left blank, it just won't show on the card.
        </p>
      </div>

      <div>
        <label className={labelClass}>Category *</label>
        <select
          required
          value={form.category}
          onChange={(e) => set("category", e.target.value as AchievementFormValues["category"])}
          className={inputClass}
        >
          {ACHIEVEMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-[#0A0F24] text-white">
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Metric / Result</label>
        <input
          value={form.metric}
          onChange={(e) => set("metric", e.target.value)}
          placeholder="Top 1,000 out of 1.5 lakh+ participants"
          className={inputClass}
        />
        <p className="mt-1 font-mono text-[10px] text-white/30">
          A measurable result — percentile, ranking, streak, round reached, etc.
        </p>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Additional context about the achievement."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Certificate / Link</label>
        <input
          type="url"
          value={form.link}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://drive.google.com/… or https://credly.com/…"
          className={inputClass}
        />
        <p className="mt-1 font-mono text-[10px] text-white/30">
          Paste a link to your certificate — Google Drive, Credly, LinkedIn, a result page,
          anything with a URL. Shown as a "View certificate" button on the live site. Optional,
          and validated as a URL only if you fill it in.
        </p>
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-white/80">
        <input
          type="checkbox"
          checked={form.visible}
          onChange={(e) => set("visible", e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5"
        />
        Visible (appears on the live site)
      </label>

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

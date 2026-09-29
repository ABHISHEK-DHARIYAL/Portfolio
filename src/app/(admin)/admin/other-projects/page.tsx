"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ExternalLink, Github, Layers, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import type { StoredOtherProject } from "@/lib/firestore-other-projects";
import type { OtherProjectFormValues } from "@/lib/other-project-schema";

const EMPTY_FORM: OtherProjectFormValues = { name: "", websiteUrl: "", githubUrl: "" };

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; project: StoredOtherProject };

export default function AdminOtherProjectsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<StoredOtherProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/other-projects");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.projects);
    } catch {
      showToast("error", "Couldn't load projects.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (values: OtherProjectFormValues) => {
    const res = await fetch("/api/admin/other-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to add project.");
      return;
    }
    showToast("success", "Project added.");
    setView({ mode: "list" });
    fetchProjects();
  };

  const handleUpdate = async (project: StoredOtherProject, values: OtherProjectFormValues) => {
    const res = await fetch(`/api/admin/other-projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast("error", data.error || "Failed to update project.");
      return;
    }
    showToast("success", "Project updated.");
    setView({ mode: "list" });
    fetchProjects();
  };

  const handleDelete = async (project: StoredOtherProject) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/other-projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Project deleted.");
      setProjects((p) => p.filter((item) => item.id !== project.id));
    } catch {
      showToast("error", "Failed to delete project.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <AdminHeader />

        {view.mode === "list" && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">Other Projects</h1>
              <button
                onClick={() => setView({ mode: "create" })}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow"
              >
                <Plus className="h-3.5 w-3.5" /> Add project
              </button>
            </div>
            <p className="mb-6 font-body text-sm text-white/50">
              Lighter-weight than the main Projects grid — just a name and links, for
              work that doesn't need a full case-study card.
            </p>

            {!loading && projects.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <Layers className="mx-auto mb-2 h-6 w-6 text-white/30" />
                <p className="font-body text-sm text-white/60">No other projects added yet.</p>
                <button
                  onClick={() => setView({ mode: "create" })}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 hover:border-primary/50 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Project
                </button>
              </div>
            )}

            <div className="space-y-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-white">
                    {project.name}
                  </p>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {project.websiteUrl && (
                      <a
                        href={project.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${project.name} website`}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${project.name} on GitHub`}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                      >
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setView({ mode: "edit", project })}
                      aria-label="Edit"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
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
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Add project</h1>
            <OtherProjectForm
              onSubmit={handleCreate}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Add project"
            />
          </>
        )}

        {view.mode === "edit" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Edit project</h1>
            <OtherProjectForm
              initialValues={view.project}
              onSubmit={(values) => handleUpdate(view.project, values)}
              onCancel={() => setView({ mode: "list" })}
              submitLabel="Save changes"
            />
          </>
        )}
      </div>
    </div>
  );
}

function OtherProjectForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initialValues?: Partial<OtherProjectFormValues>;
  onSubmit: (values: OtherProjectFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<OtherProjectFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof OtherProjectFormValues>(key: K, value: OtherProjectFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none";
  const labelClass = "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/40";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Same "at least one link" rule the server enforces — checked here
    // too so the person gets instant feedback instead of a round trip.
    if (!form.websiteUrl.trim() && !form.githubUrl.trim()) {
      setError("Provide at least a website URL or a GitHub URL.");
      return;
    }

    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-body text-xs text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass}>Project Name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Interview Preparation Website"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Website URL</label>
        <input
          type="url"
          value={form.websiteUrl}
          onChange={(e) => set("websiteUrl", e.target.value)}
          placeholder="https://example.vercel.app"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>GitHub URL</label>
        <input
          type="url"
          value={form.githubUrl}
          onChange={(e) => set("githubUrl", e.target.value)}
          placeholder="https://github.com/ABHISHEK-DHARIYAL/example"
          className={inputClass}
        />
        <p className="mt-1 font-mono text-[10px] text-white/30">
          At least one of Website URL or GitHub URL is required.
        </p>
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ExternalLink, Github, Database } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProjectForm from "@/components/admin/ProjectForm";
import { useToast } from "@/components/ui/Toast";
import type { StoredProject } from "@/lib/firestore-projects";
import type { ProjectFormValues } from "@/lib/project-schema";

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; project: StoredProject };

export default function AdminProjectsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects");
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

  const handleCreate = async (values: ProjectFormValues) => {
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error, fieldErrors: data.fieldErrors };

    showToast("success", "Project created.");
    setView({ mode: "list" });
    fetchProjects();
  };

  const handleUpdate = (project: StoredProject) => async (values: ProjectFormValues) => {
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error, fieldErrors: data.fieldErrors };

    showToast("success", "Project updated.");
    setView({ mode: "list" });
    fetchProjects();
  };

  const handleDelete = async (project: StoredProject) => {
    if (!confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Project deleted.");
      setProjects((p) => p.filter((proj) => proj.id !== project.id));
    } catch {
      showToast("error", "Failed to delete project.");
    }
  };

  const handleTogglePublished = async (project: StoredProject) => {
    const newValue = !project.published;
    setProjects((p) => p.map((proj) => (proj.id === project.id ? { ...proj, published: newValue } : proj)));
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast("error", "Failed to update — reverting.");
      setProjects((p) => p.map((proj) => (proj.id === project.id ? project : proj)));
    }
  };

  const handleSeed = async () => {
    try {
      const res = await fetch("/api/admin/projects/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Seeding failed.");
        return;
      }
      showToast("success", `Imported ${data.count} default projects.`);
      fetchProjects();
    } catch {
      showToast("error", "Seeding failed.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <AdminHeader />

        {view.mode === "list" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">Projects</h1>
              <button
                onClick={() => setView({ mode: "create" })}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow"
              >
                <Plus className="h-3.5 w-3.5" /> Add project
              </button>
            </div>

            {!loading && projects.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <p className="font-body text-sm text-white/60">
                  No projects in Firestore yet. The public site is currently showing the
                  bundled default projects as a fallback.
                </p>
                <button
                  onClick={handleSeed}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 hover:border-primary/50 hover:text-white"
                >
                  <Database className="h-3.5 w-3.5" /> Import default projects
                </button>
              </div>
            )}

            <div className="space-y-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: project.accent }}
                      />
                      <p className="font-display text-sm font-semibold text-white">{project.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                          project.published ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/40"
                        }`}
                      >
                        {project.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-body text-xs text-white/50">{project.tagline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-white/30">
                      <span>order: {project.order}</span>
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white/60">
                          <ExternalLink className="h-3 w-3" /> live
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white/60">
                          <Github className="h-3 w-3" /> repo
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePublished(project)}
                      className="rounded-full border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                    >
                      {project.published ? "Unpublish" : "Publish"}
                    </button>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <ProjectForm onSubmit={handleCreate} onCancel={() => setView({ mode: "list" })} submitLabel="Create project" />
            </div>
          </>
        )}

        {view.mode === "edit" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Edit project</h1>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <ProjectForm
                initialValues={view.project}
                onSubmit={handleUpdate(view.project)}
                onCancel={() => setView({ mode: "list" })}
                submitLabel="Save changes"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

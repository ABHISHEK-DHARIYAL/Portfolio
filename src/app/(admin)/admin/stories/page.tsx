"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import StoryForm, { type ProjectOption } from "@/components/admin/StoryForm";
import { useToast } from "@/components/ui/Toast";
import { projects as seedProjects } from "@/data/projects";
import type { StoredStory } from "@/lib/firestore-stories";
import type { StoryFormValues } from "@/lib/story-schema";

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; story: StoredStory };

function filledSections(s: StoredStory) {
  const flags = [
    !!s.idea,
    !!s.problem,
    s.approach.length > 0,
    s.decisions.length > 0,
    s.challenges.length > 0,
    s.learned.length > 0,
    !!s.next,
  ];
  return { filled: flags.filter(Boolean).length, total: flags.length };
}

export default function AdminStoriesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stories, setStories] = useState<StoredStory[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>(
    seedProjects.map((p) => ({ slug: p.slug, title: p.title, tagline: p.tagline, accent: p.accent }))
  );
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stories");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStories(data.stories);
    } catch {
      showToast("error", "Couldn't load stories.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  // Projects (for the "link to a project" dropdown) — best effort; falls
  // back to the bundled defaults if the request fails or returns nothing.
  const fetchProjectOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setProjectOptions(
          data.projects.map((p: { slug: string; title: string; tagline: string; accent: string }) => ({
            slug: p.slug,
            title: p.title,
            tagline: p.tagline,
            accent: p.accent,
          }))
        );
      }
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    fetchStories();
    fetchProjectOptions();
  }, [fetchStories, fetchProjectOptions]);

  const handleCreate = async (values: StoryFormValues) => {
    const res = await fetch("/api/admin/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error, fieldErrors: data.fieldErrors };

    showToast("success", "Story created.");
    setView({ mode: "list" });
    fetchStories();
  };

  const handleUpdate = (story: StoredStory) => async (values: StoryFormValues) => {
    const res = await fetch(`/api/admin/stories/${story.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error, fieldErrors: data.fieldErrors };

    showToast("success", "Story updated.");
    setView({ mode: "list" });
    fetchStories();
  };

  const handleDelete = async (story: StoredStory) => {
    if (!confirm(`Delete the story for "${story.title}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Story deleted.");
      setStories((s) => s.filter((x) => x.id !== story.id));
    } catch {
      showToast("error", "Failed to delete story.");
    }
  };

  const handleTogglePublished = async (story: StoredStory) => {
    const newValue = !story.published;
    setStories((s) => s.map((x) => (x.id === story.id ? { ...x, published: newValue } : x)));
    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast("error", "Failed to update — reverting.");
      setStories((s) => s.map((x) => (x.id === story.id ? story : x)));
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <AdminHeader />

        {view.mode === "list" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-white">Project Stories</h1>
              <button
                onClick={() => setView({ mode: "create" })}
                className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow"
              >
                <Plus className="h-3.5 w-3.5" /> Add story
              </button>
            </div>

            {!loading && stories.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <p className="font-body text-sm text-white/60">
                  No stories yet. Add your first one — how you thought of a project and how you built it.
                  Until you do, the public Stories page shows &ldquo;coming soon&rdquo; placeholders.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {stories.map((story) => {
                const { filled, total } = filledSections(story);
                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {story.accent && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: story.accent }} />
                        )}
                        <p className="font-display text-sm font-semibold text-white">{story.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                            story.published ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/40"
                          }`}
                        >
                          {story.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      {story.tagline && (
                        <p className="mt-1 truncate font-body text-xs text-white/50">{story.tagline}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-white/30">
                        <span>order: {story.order}</span>
                        <span>
                          {filled}/{total} sections filled
                        </span>
                        <a
                          href={`/stories#${story.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-white/60"
                        >
                          <ExternalLink className="h-3 w-3" /> view
                        </a>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePublished(story)}
                        className="rounded-full border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                      >
                        {story.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => setView({ mode: "edit", story })}
                        aria-label="Edit"
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(story)}
                        aria-label="Delete"
                        className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {view.mode === "create" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Add story</h1>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <StoryForm
                projectOptions={projectOptions}
                onSubmit={handleCreate}
                onCancel={() => setView({ mode: "list" })}
                submitLabel="Create story"
              />
            </div>
          </>
        )}

        {view.mode === "edit" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-semibold text-white">Edit story</h1>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <StoryForm
                initialValues={view.story}
                projectOptions={projectOptions}
                onSubmit={handleUpdate(view.story)}
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

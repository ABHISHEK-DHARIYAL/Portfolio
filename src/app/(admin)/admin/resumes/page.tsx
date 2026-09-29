"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Trash2, ExternalLink, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/components/ui/Toast";
import type { StoredResume } from "@/lib/firestore-resumes";

/**
 * Uploads with real progress reporting. `fetch()` doesn't expose upload
 * progress in a widely-supported way, so this uses XMLHttpRequest
 * directly (wrapped in a Promise to keep the call site async/await-shaped
 * like everything else) — its `upload.onprogress` event is what actually
 * drives the progress bar on the page.
 */
function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response — data stays {}, handled by the caller via `ok`.
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}

export default function AdminResumesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resumes");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResumes(data.resumes);
    } catch {
      showToast("error", "Couldn't load resumes.");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleFileSelected = async (file: File) => {
    if (file.type !== "application/pdf") {
      showToast("error", "Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File is too large — 10 MB max.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { ok, data } = await uploadWithProgress("/api/admin/resumes", formData, setProgress);

      if (!ok) {
        showToast("error", data.error || "Upload failed.");
        return;
      }
      showToast("success", "Resume uploaded and set as active.");
      fetchResumes();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetActive = async (resume: StoredResume) => {
    setResumes((rs) => rs.map((r) => ({ ...r, active: r.id === resume.id })));
    try {
      const res = await fetch(`/api/admin/resumes/${resume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error();
      showToast("success", `"${resume.fileName}" is now live on the site.`);
    } catch {
      showToast("error", "Failed to set active — reverting.");
      fetchResumes();
    }
  };

  const handleDelete = async (resume: StoredResume) => {
    const warning = resume.active
      ? `"${resume.fileName}" is currently live on the site. Deleting it will automatically activate the next-newest resume, if one exists. Continue?`
      : `Delete "${resume.fileName}"? This can't be undone.`;
    if (!confirm(warning)) return;

    try {
      const res = await fetch(`/api/admin/resumes/${resume.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Resume deleted.");
      fetchResumes(); // re-fetch rather than filter locally — deleting the active one may have activated another
    } catch {
      showToast("error", "Failed to delete resume.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <AdminHeader />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">Resume</h1>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white shadow-glow disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? `Uploading… ${progress}%` : "Upload New Resume"}
            </button>
          </div>
        </div>

        {uploading && (
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-brand"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.15 }}
            />
          </div>
        )}

        <p className="mb-6 font-body text-sm text-white/50">
          The "Download Resume" button, the command palette, and the terminal all link to{" "}
          <code className="font-mono text-white/70">/api/resume</code>, which always redirects to
          whichever file is marked <strong className="text-white/70">active</strong> below. A new
          upload becomes active immediately — no extra step needed.
        </p>

        {!loading && resumes.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-white/30" />
            <p className="font-body text-sm text-white/60">
              No resume uploaded yet. Upload a PDF above to get started.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {resumes.map((resume) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                resume.active ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-white/40" />
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-white">{resume.fileName}</p>
                  <p className="font-mono text-[11px] text-white/40">
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                {resume.active && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={resume.secureUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View file"
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {!resume.active && (
                  <button
                    onClick={() => handleSetActive(resume)}
                    className="rounded-full border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-white/60 hover:text-white"
                  >
                    Set active
                  </button>
                )}
                <button
                  onClick={() => handleDelete(resume)}
                  aria-label="Delete"
                  className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

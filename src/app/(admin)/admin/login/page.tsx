"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, LogIn, ShieldAlert, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

/**
 * /admin/login
 *
 * IMPORTANT — what this page must NEVER do: reveal, hint at, prefill, or
 * autocomplete the actual authorized admin email anywhere. There is
 * exactly one account, defined by ADMIN_EMAIL in the server's environment
 * (see src/lib/env.ts and the login API route) — this page only tells
 * the visitor THAT access is restricted to one specific account, never
 * WHICH account. That's why the email input below has a generic
 * placeholder ("Email") instead of anything resembling a real address,
 * and why the notice box lower down describes the restriction in words
 * only, with no email text anywhere on the page or in its HTML source.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The API route checks this email+password against ADMIN_EMAIL /
        // ADMIN_PASSWORD and returns the same generic error either way if
        // either one doesn't match — see api/admin/login/route.ts.
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      const next = searchParams.get("next") || "/admin/messages";
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <button
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        className="absolute right-6 top-6 rounded-full border border-white/10 p-2 text-white/60 transition hover:border-primary/50 hover:text-white"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
      >
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <h1 className="font-display text-xl font-semibold text-white">Admin Login</h1>
        <p className="mt-1 font-body text-sm text-white/50">
          Sign in to manage contact messages, projects, and your resume.
        </p>

        {/* The required access-restriction notice. Deliberately vague about
            WHICH email — only that one specific, pre-authorized account has
            access, and nobody else can be granted access through this page
            (there's no sign-up, no "request access," nothing to submit). */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
          <p className="font-body text-xs leading-relaxed text-white/50">
            Access is restricted to a single, pre-authorized account. No
            other email can sign in here, and this page cannot grant access
            to anyone else.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 font-body text-xs text-red-300">
            {error}
          </p>
        )}

        <input
          type="email"
          required
          autoFocus
          autoComplete="off" // no browser-remembered email suggestions on a shared/public machine
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />
        <input
          type="password"
          required
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-4 py-3 font-body text-sm font-medium text-white shadow-glow transition disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </motion.form>
    </div>
  );
}

export default function AdminLoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

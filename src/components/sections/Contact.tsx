"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Github, Linkedin, Mail, MapPin } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MagneticButton from "@/components/ui/MagneticButton";
import { useToast } from "@/components/ui/Toast";
import type { ContactFormInput } from "@/lib/contact-schema";

const SOCIALS = [
  { icon: Github, label: "GitHub", href: "https://github.com/ABHISHEK-DHARIYAL" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/abhishek-dhariyal/" },
  { icon: Mail, label: "Email", href: "mailto:dhariyalabhi@gmail.com" },
];

const EMPTY_FORM: ContactFormInput = { name: "", email: "", subject: "", message: "", company: "" };

export default function Contact() {
  const { showToast } = useToast();
  const [form, setForm] = useState<ContactFormInput>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const update = (field: keyof ContactFormInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        showToast("error", data.error || "Something went wrong. Please try again.");
        return;
      }

      showToast("success", "Message sent — I'll get back to you soon.");
      setForm(EMPTY_FORM);
    } catch {
      showToast("error", "Network error — please try again, or email directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Contact</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Let&apos;s build something
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-white/60">
            Open to collaborations, freelance work, and interesting problems.
            Reach out directly, or use the form.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" data-cursor="pointer">
                <GlassCard className="flex items-center gap-3 p-4" glow="#7C3AED">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm text-white/80">{s.label}</span>
                </GlassCard>
              </a>
            ))}
            <GlassCard className="flex items-center gap-3 p-4" glow="#3B82F6">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="font-body text-sm text-white/80">Ahmedabad, Gujarat, India</span>
            </GlassCard>
          </div>

          <GlassCard className="relative overflow-hidden p-6 sm:p-8" glow="#3B82F6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Honeypot — hidden from real visitors (off-screen, not just
                  display:none, since some bots skip display:none fields).
                  Must stay empty; tabIndex/autoComplete keep it out of the
                  way of real users navigating by keyboard. */}
              <div className="absolute -left-[9999px] top-0" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={update("company")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={update("name")}
                  error={fieldErrors.name?.[0]}
                />
                <Field
                  label="Your email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  error={fieldErrors.email?.[0]}
                />
              </div>
              <Field
                label="Subject"
                value={form.subject}
                onChange={update("subject")}
                error={fieldErrors.subject?.[0]}
              />
              <Field
                label="Tell me about the project…"
                as="textarea"
                rows={5}
                value={form.message}
                onChange={update("message")}
                error={fieldErrors.message?.[0]}
              />

              <MagneticButton type="submit" disabled={sending} className="w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : "Send Message"}
                </span>
              </MagneticButton>
            </form>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  as = "input",
  rows,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  type?: string;
  as?: "input" | "textarea";
  rows?: number;
}) {
  const shared =
    "w-full rounded-xl border bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:outline-none " +
    (error ? "border-red-400/50 focus:border-red-400/70" : "border-white/10 focus:border-primary/60");

  return (
    <div>
      {as === "textarea" ? (
        <textarea required rows={rows} placeholder={label} value={value} onChange={onChange} className={shared} />
      ) : (
        <input required type={type} placeholder={label} value={value} onChange={onChange} className={shared} />
      )}
      {error && <p className="mt-1 font-mono text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

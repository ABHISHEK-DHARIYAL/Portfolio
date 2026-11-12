import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function AnalysisUnavailable({ title, reason, profileUrl, backHref, backLabel }: {
  title: string; reason: string; profileUrl?: string; backHref: string; backLabel: string;
}) {
  return (
    <article className="relative px-6 pb-24 pt-32">
      <div className="mx-auto max-w-3xl">
        <Link href={backHref} className="inline-flex items-center gap-2 font-mono text-xs text-white/50 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>
        <h1 className="mt-8 font-display text-4xl font-semibold text-white">{title}</h1>
        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-body text-sm text-white/60">
          {reason} Rather than show placeholder numbers, here&apos;s the profile directly.
        </p>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noreferrer" data-cursor="pointer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 font-body text-sm font-medium text-white shadow-glow transition hover:brightness-110">
            Visit profile <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

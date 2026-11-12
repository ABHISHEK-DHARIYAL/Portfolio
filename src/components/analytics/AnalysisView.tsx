import Link from "next/link";
import { ArrowLeft, ExternalLink, Trophy, Target, Flame, TrendingUp, Zap, Star } from "lucide-react";
import type { Analysis, Section, Tone } from "@/lib/analysis-types";
import { BarChart, DonutChart, Heatmap, LineChart } from "./charts";

const TONE: Record<Tone, string> = {
  gold: "text-amber-400", green: "text-emerald-400", purple: "text-purple-400", orange: "text-orange-400",
  blue: "text-blue-400", pink: "text-pink-400", cyan: "text-cyan-300", white: "text-white",
};
const KPI_ICONS = [Trophy, Target, TrendingUp, Flame];

function Panel({ title, subtitle, icon: Icon = Zap, className = "", children }: {
  title: string; subtitle?: string; icon?: React.ElementType; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0A0F24]/80 p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 font-mono text-[11px] text-white/40">{subtitle}</p>}
        </div>
        <Icon className="h-4 w-4 shrink-0 text-white/30" />
      </div>
      {children}
    </div>
  );
}

function renderSection(s: Section, i: number) {
  switch (s.type) {
    case "donut":
      return <Panel key={i} title={s.title} subtitle={s.subtitle} icon={Target}><DonutChart data={s.data} centerLabel={s.centerLabel} /></Panel>;
    case "line":
      return <Panel key={i} title={s.title} subtitle={s.subtitle} icon={TrendingUp}><LineChart points={s.points} color={s.color} /></Panel>;
    case "bar":
      return <Panel key={i} title={s.title} subtitle={s.subtitle} className={s.wide ? "lg:col-span-2" : ""}><BarChart data={s.data} color={s.color} /></Panel>;
    case "heatmap":
      return <Panel key={i} title={s.title} subtitle={s.subtitle} icon={Flame} className="lg:col-span-2"><Heatmap days={s.days} /></Panel>;
    case "score":
      return (
        <Panel key={i} title={s.title} subtitle={s.subtitle} icon={Star} className="lg:col-span-2">
          <div className="space-y-3">
            {s.parts.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex justify-between font-mono text-[11px] text-white/60">
                  <span>{p.label}</span><span>{p.got}/{p.max}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${(p.got / p.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      );
    case "list":
      return (
        <Panel key={i} title={s.title} subtitle={s.subtitle} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {s.items.map((it) => (
              <a key={it.title} href={it.href} target="_blank" rel="noreferrer" data-cursor="pointer"
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/30">
                <p className="font-display text-sm font-semibold text-white">{it.title}</p>
                {it.body && <p className="mt-1 line-clamp-2 font-body text-xs text-white/50">{it.body}</p>}
                <p className="mt-2 font-mono text-[11px] text-white/40">{it.meta}</p>
              </a>
            ))}
          </div>
        </Panel>
      );
  }
}

export default function AnalysisView({ analysis, backHref, backLabel }: { analysis: Analysis; backHref: string; backLabel: string }) {
  return (
    <article className="relative px-6 pb-24 pt-32">
      <div className="mx-auto max-w-5xl">
        <Link href={backHref} className="inline-flex items-center gap-2 font-mono text-xs text-white/50 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>

        <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-primary">{analysis.title} analysis</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">{analysis.handle}</h1>
          </div>
          <a href={analysis.profileUrl} target="_blank" rel="noreferrer" data-cursor="pointer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 transition hover:border-white/40">
            Open profile <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analysis.kpis.map((k, i) => {
            const Icon = KPI_ICONS[i % KPI_ICONS.length];
            return (
              <div key={k.label} className="rounded-2xl border border-white/10 bg-[#0A0F24]/80 p-5">
                <div className="flex items-start justify-between">
                  <p className="font-mono text-[11px] text-white/50">{k.label}</p>
                  <Icon className={`h-4 w-4 ${TONE[k.tone]}`} />
                </div>
                <p className={`mt-2 font-display text-3xl font-bold ${TONE[k.tone]}`}>
                  {k.value}{k.suffix && <span className="ml-1.5 text-sm font-medium text-white/40">{k.suffix}</span>}
                </p>
                {k.sub && <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/50">{k.sub}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">{analysis.sections.map(renderSection)}</div>

        {analysis.notes.length > 0 && (
          <div className="mt-6 space-y-1">
            {analysis.notes.map((n) => <p key={n} className="font-mono text-[11px] text-white/40">{n}</p>)}
          </div>
        )}
        <p className="mt-2 font-mono text-[11px] text-white/30">
          Live data · refreshed hourly · last fetched {new Date(analysis.fetchedAt).toUTCString()}
        </p>
      </div>
    </article>
  );
}

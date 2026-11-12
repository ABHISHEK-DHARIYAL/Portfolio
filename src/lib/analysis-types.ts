/**
 * Normalized shape every analyzer (LeetCode, Codeforces, CodeChef, GitHub)
 * returns, so ONE page template can render all of them.
 */
export type Tone = "gold" | "green" | "purple" | "orange" | "blue" | "pink" | "cyan" | "white";

export type Kpi = {
  label: string;
  value: string;
  suffix?: string;
  tone: Tone;
  sub?: string;
};

export type Datum = { label: string; value: number; color?: string };
export type Point = { label: string; value: number };

export type Section =
  | { type: "donut"; title: string; subtitle?: string; data: Datum[]; centerLabel?: string }
  | { type: "line"; title: string; subtitle?: string; points: Point[]; color?: string }
  | { type: "bar"; title: string; subtitle?: string; data: Datum[]; color?: string; wide?: boolean }
  | { type: "heatmap"; title: string; subtitle?: string; days: { date: string; count: number; level: number }[] }
  | { type: "list"; title: string; subtitle?: string; items: { title: string; href?: string; meta: string; body?: string }[] }
  | { type: "score"; title: string; subtitle?: string; total: number; parts: { label: string; got: number; max: number }[] };

export type Analysis = {
  title: string;
  handle: string;
  profileUrl: string;
  fetchedAt: string;
  kpis: Kpi[];
  sections: Section[];
  /** Anything worth telling the visitor (partial data, scraping limits…). */
  notes: string[];
};

export type AnalysisResult =
  | { ok: true; analysis: Analysis }
  | { ok: false; reason: string };

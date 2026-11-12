import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import AnalysisView from "@/components/analytics/AnalysisView";
import AnalysisUnavailable from "@/components/analytics/AnalysisUnavailable";
import { listPublishedContests } from "@/lib/firestore-contests";
import { analyzePlatform, detectPlatform, extractHandle, platformSlug } from "@/lib/coding-analytics";

// Re-run the analysis at most once an hour.
export const revalidate = 3600;

type Props = { params: Promise<{ platform: string }> };

async function findContest(slug: string) {
  try {
    const contests = await listPublishedContests();
    return contests.find((c) => platformSlug(c.platform) === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform } = await params;
  const c = await findContest(platform);
  return { title: `${c?.platform ?? "Coding profile"} analysis — Abhishek Dhariyal` };
}

export default async function CodingProfilePage({ params }: Props) {
  const { platform } = await params;
  const contest = await findContest(platform);
  if (!contest) notFound();

  const kind = detectPlatform(contest.platform, contest.url);
  const handle = extractHandle(kind, contest.url, contest.handle);
  const result = await analyzePlatform(kind, handle, contest.url);
  const back = { backHref: "/#coding-profiles", backLabel: "All coding profiles" };

  return (
    <main id="main-content" className="relative">
      {result.ok ? (
        <AnalysisView analysis={result.analysis} {...back} />
      ) : (
        <AnalysisUnavailable title={contest.platform} reason={result.reason} profileUrl={contest.url} {...back} />
      )}
      <Footer />
    </main>
  );
}

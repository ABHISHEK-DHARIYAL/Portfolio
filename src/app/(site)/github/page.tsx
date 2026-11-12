import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import AnalysisView from "@/components/analytics/AnalysisView";
import AnalysisUnavailable from "@/components/analytics/AnalysisUnavailable";
import { analyzeGithub, GITHUB_USERNAME } from "@/lib/github-analytics";

export const revalidate = 3600;

export const metadata: Metadata = { title: "GitHub analysis — Abhishek Dhariyal" };

export default async function GithubPage() {
  const result = await analyzeGithub();
  const back = { backHref: "/#github", backLabel: "Back to portfolio" };
  return (
    <main id="main-content" className="relative">
      {result.ok ? (
        <AnalysisView analysis={result.analysis} {...back} />
      ) : (
        <AnalysisUnavailable title="GitHub" reason={result.reason} profileUrl={`https://github.com/${GITHUB_USERNAME}`} {...back} />
      )}
      <Footer />
    </main>
  );
}

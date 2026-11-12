import "server-only";
import { listPublishedStories } from "./firestore-stories";
import { projectStories as seedStories } from "@/data/project-stories";
import type { ProjectStory } from "@/data/project-stories";

type StoryLike = Pick<
  ProjectStory,
  "slug" | "idea" | "problem" | "next" | "approach" | "decisions" | "challenges" | "learned"
>;

// Same rule the /stories page uses to show "Story coming soon".
function hasContent(s: StoryLike) {
  return Boolean(
    s.idea ||
      s.problem ||
      s.next ||
      s.approach.length ||
      s.decisions.length ||
      s.challenges.length ||
      s.learned.length
  );
}

/**
 * True when this project has a written story on /stories. Uses the published
 * stories from Firestore, or the bundled defaults when there are none yet
 * (same rule as /api/stories).
 */
export async function projectHasStory(slug: string): Promise<boolean> {
  let stories: StoryLike[] = seedStories;
  try {
    const published = await listPublishedStories();
    if (published.length > 0) stories = published;
  } catch (err) {
    console.error("[stories] Firestore fetch failed, using seed data:", err);
  }
  const story = stories.find((s) => s.slug === slug);
  return Boolean(story && hasContent(story));
}

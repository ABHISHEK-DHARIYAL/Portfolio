/**
 * Project stories — the "how I thought of it, how I built it" write-ups
 * shown on the /stories page.
 *
 * HOW TO ADD YOUR STORY
 * ---------------------
 * Find your project below and fill in the fields in your own words.
 * Every field is OPTIONAL: the page hides any section you leave empty
 * ("" or []), so you can publish a story one section at a time. A project
 * whose fields are all empty shows a "story coming soon" note.
 *
 * To add a new project, copy one entry, change `slug` and `title`.
 * (If `slug` matches a project in src/data/projects.ts, its tagline,
 * colour, tech stack and links are picked up automatically.)
 *
 * Nothing here is invented — write only what really happened.
 *
 * EXAMPLE of a filled-in entry (delete once you've written your own):
 *
 *   idea:     "I kept losing track of my study hours across three apps…",
 *   problem:  "No single place showed where my time actually went.",
 *   approach: [
 *     { step: "Sketched the data model first", detail: "Started on paper with…" },
 *     { step: "Built the API before the UI",   detail: "So I could test with…" },
 *   ],
 *   decisions: [
 *     { decision: "Chose Firebase over MySQL", reason: "Needed realtime sync and…" },
 *   ],
 *   challenges: [
 *     { problem: "Calendar sync created duplicates", solution: "Stored the event id and…" },
 *   ],
 *   learned: ["Plan the data model before the UI"],
 *   next: "Add team sharing and offline mode.",
 */
export type ProjectStory = {
  slug: string;
  title: string;
  /** Optional overrides — otherwise taken from the matching project. */
  tagline?: string;
  accent?: string;

  /** The spark: how the idea came to you. */
  idea: string;
  /** The problem you wanted to solve, and who it was for. */
  problem: string;
  /** How you approached it, in order — plan, build, test, ship. */
  approach: { step: string; detail: string }[];
  /** Important choices you made, and why. */
  decisions: { decision: string; reason: string }[];
  /** Things that went wrong and how you fixed them. */
  challenges: { problem: string; solution: string }[];
  /** What this project taught you. */
  learned: string[];
  /** Where it stands now / what you'd do next. */
  next: string;
};

const blank = {
  idea: "",
  problem: "",
  approach: [],
  decisions: [],
  challenges: [],
  learned: [],
  next: "",
} satisfies Omit<ProjectStory, "slug" | "title">;

export const projectStories: ProjectStory[] = [
  { slug: "nexusflow", title: "NexusFlow", ...blank },
  { slug: "workspace-nexus", title: "Workspace Nexus", ...blank },
  { slug: "hourglass", title: "HourGlass", ...blank },
  { slug: "digitalhub", title: "DigitalHub", ...blank },
];

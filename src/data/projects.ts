/**
 * Featured projects — full case-study treatment (glass card + detail modal).
 *
 * `architecture`, `challenges`, and `highlights` are OPTIONAL and empty by
 * default. Nothing in this file is invented: only fill these in with real
 * detail you can vouch for. The UI hides any section whose array is empty,
 * so an empty array is a safe default — never fill these with generic
 * placeholder text.
 */
export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  stack: string[];
  liveUrl?: string;
  githubUrl?: string;
  accent: string;
  architecture: string[];
  challenges: { problem: string; solution: string }[];
  highlights: string[];
};

export const projects: Project[] = [
  {
    slug: "nexusflow",
    title: "NexusFlow",
    tagline: "AI-Powered Developer Intelligence Platform",
    description:
      "A developer analytics platform that pairs a custom Java concurrency engine with Google Gemini to turn GitHub activity into engineering insight.",
    features: [
      "Custom Java concurrency engine",
      "Priority-based task scheduling",
      "GitHub OAuth authentication",
      "GitHub repository analysis",
      "Google Gemini AI",
      "Worker metrics dashboard",
      "JWT authentication",
    ],
    stack: ["Java", "React", "Node", "Express", "MySQL", "Tailwind", "Gemini API", "GitHub API"],
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/NexusFlow",
    // Live demo intentionally omitted — not available yet.
    accent: "#7C3AED",
    architecture: [],
    challenges: [],
    highlights: [],
  },
  {
    slug: "workspace-nexus",
    title: "Workspace Nexus",
    tagline: "Collaborative Document Platform",
    description:
      "A multi-tenant workspace for teams to write, annotate, and parse documents together.",
    features: [
      "Authentication & session management",
      "Multi-workspace architecture",
      "Rich text editing",
      "Inline annotations",
      "PDF parsing",
      "DOCX parsing",
      "Per-workspace Firestore isolation",
    ],
    stack: ["Next.js", "TypeScript", "Firebase", "Node", "Express", "Tailwind"],
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/WorkSpace_Nexus",
    liveUrl: "https://work-space-nexus.vercel.app/",
    accent: "#3B82F6",
    architecture: [],
    challenges: [],
    highlights: [],
  },
  {
    slug: "hourglass",
    title: "HourGlass",
    tagline: "Intelligent Productivity Platform",
    description:
      "A calendar-native productivity app that blends timeline planning, habit tracking, and focus sessions with Google Calendar sync.",
    features: [
      "Timeline",
      "Calendar view",
      "Habit tracking",
      "Goal tracking",
      "Focus mode",
      "Usage analytics",
      "Google Calendar sync",
      "Installable PWA",
    ],
    stack: ["React", "Next.js", "Node", "Firebase", "Tailwind"],
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/HourGlass",
    liveUrl: "https://hourglass-snowy.vercel.app/",
    accent: "#22D3EE",
    architecture: [],
    challenges: [],
    highlights: [],
  },
  {
    slug: "digitalhub",
    title: "DigitalHub",
    tagline: "Digital Learning Platform",
    description: "",
    features: [],
    stack: [],
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/DigitalHub",
    liveUrl: "https://digital-hub-wine.vercel.app/index.html",
    accent: "#F472B6",
    architecture: [],
    challenges: [],
    highlights: [],
  },
];

/**
 * Secondary projects — shown as a lighter grid (link-out cards only, no
 * modal). Add `demoUrl` only for projects that actually have a live demo.
 */
export type OtherProject = {
  title: string;
  githubUrl: string;
  demoUrl?: string;
};

export const otherProjects: OtherProject[] = [
  {
    title: "Interview Preparation Website",
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/Interview-Preparation-Website",
    demoUrl: "https://interview-preparation-website-ten.vercel.app/",
  },
  {
    title: "MediCare Scheduler",
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/MediCare-Scheduler",
    demoUrl: "https://medi-care-scheduler.vercel.app/",
  },
  {
    title: "StaySpot",
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/StaySpot",
  },
  {
    title: "VitalNode",
    githubUrl: "https://github.com/ABHISHEK-DHARIYAL/VitalNode",
  },
];

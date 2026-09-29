export type Skill = {
  name: string;
  category: "Languages" | "Frontend" | "Backend" | "Databases" | "Tools";
  description: string;
  usedIn: string[];
};

export const skills: Skill[] = [
  // Languages
  {
    name: "Java",
    category: "Languages",
    description: "Core language for concurrency-heavy backend systems and DSA practice.",
    usedIn: ["NexusFlow"],
  },
  {
    name: "C++",
    category: "Languages",
    description: "Primary language for data structures & algorithms and competitive practice.",
    usedIn: ["DSA practice"],
  },
  {
    name: "JavaScript",
    category: "Languages",
    description: "Daily driver for full-stack web development.",
    usedIn: ["Workspace Nexus", "HourGlass"],
  },
  {
    name: "TypeScript",
    category: "Languages",
    description: "Type-safe application development for larger, long-lived codebases.",
    usedIn: ["Workspace Nexus"],
  },
  // Frontend
  {
    name: "React",
    category: "Frontend",
    description: "Component architecture, state management, and client UI.",
    usedIn: ["NexusFlow", "HourGlass"],
  },
  {
    name: "Next.js",
    category: "Frontend",
    description: "App Router and React-based product development.",
    usedIn: ["Workspace Nexus", "HourGlass"],
  },
  {
    name: "Tailwind CSS",
    category: "Frontend",
    description: "Utility-first styling for fast, consistent UI.",
    usedIn: ["NexusFlow", "Workspace Nexus", "HourGlass"],
  },
  // Backend
  {
    name: "Node.js",
    category: "Backend",
    description: "REST APIs and backend services.",
    usedIn: ["Workspace Nexus", "HourGlass"],
  },
  {
    name: "Express.js",
    category: "Backend",
    description: "Routing, middleware, and service layers for APIs.",
    usedIn: ["NexusFlow", "Workspace Nexus"],
  },
  {
    name: "REST APIs",
    category: "Backend",
    description: "Designing HTTP interfaces for full-stack applications.",
    usedIn: ["NexusFlow", "HourGlass"],
  },
  // Databases
  {
    name: "MySQL",
    category: "Databases",
    description: "Relational schema design and queries.",
    usedIn: ["NexusFlow"],
  },
  {
    name: "MongoDB",
    category: "Databases",
    description: "Document modeling for flexible application data.",
    usedIn: [],
  },
  {
    name: "Firebase",
    category: "Databases",
    description: "Auth, Firestore, and hosting for rapid product iteration.",
    usedIn: ["Workspace Nexus", "HourGlass"],
  },
  // Tools
  {
    name: "Git",
    category: "Tools",
    description: "Version control and branching workflow.",
    usedIn: ["All projects"],
  },
  {
    name: "GitHub",
    category: "Tools",
    description: "Repository hosting, OAuth integrations, and the GitHub API.",
    usedIn: ["NexusFlow"],
  },
  {
    name: "VS Code",
    category: "Tools",
    description: "Primary code editor.",
    usedIn: ["All projects"],
  },
  {
    name: "Postman",
    category: "Tools",
    description: "API testing and documentation.",
    usedIn: ["All projects"],
  },
];

export const skillCategories = [
  "Languages",
  "Frontend",
  "Backend",
  "Databases",
  "Tools",
] as const;

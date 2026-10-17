export const aboutTimeline = [
  {
    title: "Bachelor of Technology — CSBS",
    org: "Pandit Deendayal Energy University (PDEU), 2024–2028",
    description:
      "Studying Computer Science and Business Systems (CSBS), a curriculum designed by Tata Consultancy Services (TCS) that combines core computer science with business systems.",
  },
  {
    title: "Backend Development",
    org: "Personal projects",
    description:
      "Designing APIs, concurrency models, and database schemas that hold up under real load.",
  },
  {
    title: "Full Stack Development",
    org: "Personal projects",
    description:
      "Shipping complete products end to end — from database design to polished, responsive UI.",
  },
  {
    title: "AI",
    org: "Applied projects",
    description:
      "Integrating LLM APIs like Gemini into real developer tools rather than treating AI as a demo feature.",
  },
  {
    title: "System Design",
    org: "Ongoing study",
    description:
      "Thinking in terms of scalability, fault tolerance, and tradeoffs — not just working code.",
  },
  {
    title: "Competitive Programming",
    org: "Ongoing practice",
    description: "Sharpening algorithmic thinking and problem decomposition through practice.",
  },
];

/**
 * The scroll-based journey timeline. Deliberately not an "experience"
 * section — this traces what was learned and built, in order, rather than
 * implying employment history that doesn't exist.
 */
export type JourneyStep = {
  year?: string;
  title: string;
  description: string;
};

export const journeySteps: JourneyStep[] = [
  {
    year: "2024",
    title: "Started B.Tech at PDEU",
    description: "Began Computer Science and Business Systems (CSBS) at PDEU.",
  },
  {
    year: "2024",
    title: "Learned C++",
    description: "Picked up C++ as a foundation for systems thinking and problem solving.",
  },
  {
    year: "2024",
    title: "Data Structures & Algorithms",
    description: "Built a base in DSA through consistent, deliberate practice.",
  },
  {
    title: "Built StaySpot",
    description: "",
  },
  {
    title: "Built VitalNode",
    description: "",
  },
  {
    title: "Built MediCare Scheduler",
    description: "A scheduling application.",
  },
  {
    title: "Built Workspace Nexus",
    description: "A collaborative document platform with multi-workspace architecture.",
  },
  {
    title: "Built NexusFlow",
    description: "An AI-powered developer intelligence platform with a custom Java concurrency engine.",
  },
  {
    title: "Built HourGlass",
    description: "An intelligent productivity platform with Google Calendar sync.",
  },
  {
    title: "Built DigitalHub",
    description: "A digital learning platform.",
  },
];

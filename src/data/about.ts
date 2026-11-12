/**
 * Everything shown in the About section lives here — edit this file, not
 * the component. Numbers are as of November 2026; update them as they change.
 */

export const aboutHeading = "Competitive programmer building real systems";

export const aboutIntro = [
  "I'm Abhishek Dhariyal, a Computer Science and Business Systems (CSBS) student at Pandit Deendayal Energy University (PDEU), graduating in 2028.",
  "I train as a competitive programmer — a LeetCode Knight with a 1,954 contest rating, in the top 3.4% globally — and bring the same problem-decomposition discipline to backend, full-stack and applied AI projects.",
  "I'm currently looking for internship opportunities.",
];

export type AboutStat = { value: string; label: string; detail: string };

export const aboutStats: AboutStat[] = [
  { value: "1,954", label: "LeetCode contest rating", detail: "Knight · top 3.4% globally · 48 contests" },
  { value: "651", label: "LeetCode problems solved", detail: "198 easy · 355 medium · 98 hard" },
  { value: "1812", label: "CodeChef rating", detail: "4★ · highest 1814 · global rank 3697" },
  { value: "1328", label: "Codeforces rating", detail: "Pupil · max 1374" },
];

export type AboutProject = {
  name: string;
  language: string;
  description: string;
  href: string;
};

export const aboutProjects: AboutProject[] = [
  {
    name: "NexusFlow",
    language: "TypeScript",
    description: "Full-stack TypeScript project with a deployed frontend and a separate backend API.",
    href: "https://github.com/ABHISHEK-DHARIYAL/NexusFlow",
  },
  {
    name: "WorkSpace_Nexus",
    language: "TypeScript",
    description: "TypeScript workspace application built end to end.",
    href: "https://github.com/ABHISHEK-DHARIYAL/WorkSpace_Nexus",
  },
  {
    name: "Live-Caption",
    language: "Kotlin",
    description: "Android app that captures live captions and saves transcripts.",
    href: "https://github.com/ABHISHEK-DHARIYAL/Live-Caption",
  },
  {
    name: "DigitalHub",
    language: "CSS",
    description: "Web project focused on a polished, responsive interface.",
    href: "https://github.com/ABHISHEK-DHARIYAL/DigitalHub",
  },
];

export const aboutEducation = {
  degree: "Bachelor of Technology — CSBS",
  school: "Pandit Deendayal Energy University (PDEU), 2024–2028",
  description:
    "Computer Science and Business Systems, a curriculum designed by Tata Consultancy Services (TCS) that combines core computer science with business systems.",
};

export const aboutFocus = [
  "Competitive Programming",
  "Backend Development",
  "Full Stack Development",
  "Applied AI",
  "System Design",
];

/** `icon` names map to icons in About.tsx. */
export type AboutLink = { label: string; href: string; icon: "github" | "leetcode" | "codechef" | "codeforces" | "linkedin" | "mail" };

export const aboutLinks: AboutLink[] = [
  { label: "GitHub", href: "https://github.com/ABHISHEK-DHARIYAL", icon: "github" },
  { label: "LeetCode", href: "https://leetcode.com/u/Abhishek_notKnown/", icon: "leetcode" },
  { label: "CodeChef", href: "https://www.codechef.com/users/idk_notknown", icon: "codechef" },
  { label: "Codeforces", href: "https://codeforces.com/profile/idk_notKnown", icon: "codeforces" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/abhishek-dhariyal/", icon: "linkedin" },
  { label: "Email", href: "mailto:dhariyalabhi@gmail.com", icon: "mail" },
];

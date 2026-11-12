import type { AboutContent } from "@/lib/about-schema";

/**
 * Default About content. This is what the site shows until you save your
 * own version at /admin/about (and what "Reset to defaults" restores).
 * Numbers are as of November 2026.
 */
export const defaultAbout: AboutContent = {
  heading: "Competitive programmer building real systems",
  intro: [
    "I'm Abhishek Dhariyal, a Computer Science and Business Systems (CSBS) student at Pandit Deendayal Energy University (PDEU), graduating in 2028.",
    "I train as a competitive programmer — a LeetCode Knight with a 1,954 contest rating, in the top 3.4% globally — and bring the same problem-decomposition discipline to backend, full-stack and applied AI projects.",
    "I'm currently looking for internship opportunities.",
  ],
  stats: [
    { value: "1,954", label: "LeetCode contest rating", detail: "Knight · top 3.4% globally · 48 contests" },
    { value: "651", label: "LeetCode problems solved", detail: "198 easy · 355 medium · 98 hard" },
    { value: "1812", label: "CodeChef rating", detail: "4★ · highest 1814 · global rank 3697" },
    { value: "1328", label: "Codeforces rating", detail: "Pupil · max 1374" },
  ],
  links: [
    { label: "GitHub", href: "https://github.com/ABHISHEK-DHARIYAL", icon: "github" },
    { label: "LeetCode", href: "https://leetcode.com/u/Abhishek_notKnown/", icon: "leetcode" },
    { label: "CodeChef", href: "https://www.codechef.com/users/idk_notknown", icon: "codechef" },
    { label: "Codeforces", href: "https://codeforces.com/profile/idk_notKnown", icon: "codeforces" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/abhishek-dhariyal/", icon: "linkedin" },
    { label: "Email", href: "mailto:dhariyalabhi@gmail.com", icon: "mail" },
  ],
};

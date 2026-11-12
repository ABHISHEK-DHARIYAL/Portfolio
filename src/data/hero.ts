import type { HeroContent } from "@/lib/hero-schema";

/**
 * Default hero questions. This is what the site shows until you save your
 * own version at /admin/hero (and what "Reset to defaults" restores).
 */
export const defaultHero: HeroContent = {
  items: [
    { q: "Why should you hire me?", a: "I turn ideas into products that ship.", href: "#projects", cta: "See my projects" },
    { q: "What can I bring to your team?", a: "Clean code, fast learning, and ownership.", href: "/skills", cta: "See my skills" },
    { q: "What problems do I solve?", a: "I build scalable systems and intelligent platforms.", href: "/stories", cta: "Read the stories behind my projects" },
    { q: "What makes me different?", a: "I blend full-stack skills with an AI mindset.", href: "#about", cta: "More about me" },
    { q: "How do I handle challenges?", a: "I break them down, iterate, and deliver.", href: "#journey", cta: "See my journey" },
    { q: "Where do I add value fast?", a: "From day one: building, debugging, improving.", href: "#achievements", cta: "See my achievements" },
  ],
};

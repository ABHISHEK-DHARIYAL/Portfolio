/**
 * Local answer engine for the portfolio chatbot.
 *
 * Instant, free, works offline, and grounded strictly in the site's own data
 * (see chat-knowledge.ts). It scores intents from keywords, recognises
 * project / skill names (with typo tolerance and aliases), and returns
 * structured replies: text + action buttons + contextual follow-up chips.
 *
 * `confident: false` means "I only have a generic fallback" — the UI uses
 * that to hand the question to the real AI model when one is configured.
 */
import { projects, otherProjects } from "@/data/projects";
import { skills, skillCategories, type Skill } from "@/data/skills";
import { journeySteps } from "@/data/timeline";
import { PROFILE } from "./chat-knowledge";

export type ChatAction =
  | { kind: "scroll"; label: string; target: string }
  | { kind: "link"; label: string; href: string }
  | { kind: "resume"; label: string };

export type ChatReply = {
  text: string;
  actions?: ChatAction[];
  followUps: string[];
  confident: boolean;
  /** Needs live data fetched from the site's own API by the UI. */
  live?: "achievements" | "profiles";
};

/* ------------------------------ text helpers ----------------------------- */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/c\+\+/g, "cpp")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const compact = (s: string) => norm(s).replace(/[\s.]/g, "");

function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** True if `name` appears in the query, tolerating one typo on longer names. */
function mentions(q: string, tokens: string[], name: string): boolean {
  const target = compact(name);
  // Short names (Java, Git, Node...) must be a whole word — otherwise "java"
  // matches "javascript" and "git" matches "github".
  if (target.length <= 4) return tokens.includes(target);
  if (compact(q).includes(target)) return true;
  if (target.length >= 6) {
    // also try adjacent-token pairs ("nexus flow") and single tokens with 1 typo
    const grams = [...tokens, ...tokens.slice(1).map((t, i) => tokens[i] + t)];
    const maxTypos = target.length >= 8 ? 2 : 1;
    return grams.some((g) => g.length >= 5 && lev(g, target) <= maxTypos);
  }
  return tokens.includes(target);
}

/**
 * Keyword test. Short words (<=4 chars, no spaces) must match a whole word
 * (optionally plural) so "ai" doesn't fire on "email" and "work" doesn't
 * fire on "framework"; longer words / phrases match as substrings.
 */
const has = (q: string, ...words: string[]) =>
  words.some((w) => {
    if (w.length <= 4 && !w.includes(" ")) {
      return new RegExp(`(^| )${w}s?( |$)`).test(q);
    }
    return q.includes(w);
  });

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

/* ------------------------------- aliases -------------------------------- */

const SKILL_ALIASES: Record<string, string[]> = {
  "C++": ["cpp", "cplusplus"],
  JavaScript: ["js", "javascript", "ecmascript"],
  TypeScript: ["ts", "typescript"],
  "Next.js": ["nextjs"],
  "Node.js": ["nodejs", "node"],
  "Express.js": ["expressjs", "express"],
  "Tailwind CSS": ["tailwind", "tailwindcss"],
  "REST APIs": ["restapi", "restapis", "api", "apis"],
  MongoDB: ["mongo", "mongodb"],
  "VS Code": ["vscode", "visualstudiocode"],
  MySQL: ["mysql", "sql"],
  Firebase: ["firebase", "firestore"],
};

function findSkills(q: string, tokens: string[]): Skill[] {
  const cq = compact(q);
  return skills.filter((s) => {
    if (mentions(q, tokens, s.name)) return true;
    return (SKILL_ALIASES[s.name] ?? []).some((a) =>
      a.length <= 4 ? tokens.includes(a) : cq.includes(a)
    );
  });
}

function findProjects(q: string, tokens: string[]) {
  const all = [
    ...projects.map((p) => ({ title: p.title, featured: true as const })),
    ...otherProjects.map((p) => ({ title: p.title, featured: false as const })),
  ];
  const hits = all.filter((p) => mentions(q, tokens, p.title));
  // Loose single-word matches ("interview", "medicare", "stayspot")
  if (!hits.length) {
    for (const p of all) {
      const words = norm(p.title).split(" ").filter((w) => w.length >= 6 && w !== "website");
      if (words.some((w) => tokens.some((t) => t.length >= 5 && lev(t, w) <= 1))) hits.push(p);
    }
  }
  return hits;
}

/* ------------------------------- reply kit ------------------------------ */

const A = {
  projects: { kind: "scroll", label: "View projects", target: "projects" } as ChatAction,
  skills: { kind: "scroll", label: "See skills", target: "skills" } as ChatAction,
  contact: { kind: "scroll", label: "Contact form", target: "contact" } as ChatAction,
  journey: { kind: "scroll", label: "See journey", target: "journey" } as ChatAction,
  about: { kind: "scroll", label: "About section", target: "about" } as ChatAction,
  github: { kind: "link", label: "GitHub profile", href: PROFILE.github } as ChatAction,
  linkedin: { kind: "link", label: "LinkedIn", href: PROFILE.linkedin } as ChatAction,
  email: { kind: "link", label: "Send an email", href: `mailto:${PROFILE.email}` } as ChatAction,
  resume: { kind: "resume", label: "Download resume" } as ChatAction,
};

export const STARTERS = [
  "Tell me about Abhishek",
  "What projects has he built?",
  "What's his tech stack?",
  "How do I contact him?",
];

const ok = (r: Omit<ChatReply, "confident">): ChatReply => ({ ...r, confident: true });

/* ------------------------------ project reply ---------------------------- */

function projectReply(title: string, q: string): ChatReply {
  const p = projects.find((x) => x.title === title);
  if (!p) {
    const o = otherProjects.find((x) => x.title === title)!;
    const actions: ChatAction[] = [{ kind: "link", label: "View on GitHub", href: o.githubUrl }];
    if (o.demoUrl) actions.unshift({ kind: "link", label: "Live demo", href: o.demoUrl });
    return ok({
      text: `**${o.title}** is one of Abhishek's additional projects. ${
        o.demoUrl ? "It has a live demo and the source is public on GitHub." : "The source is public on GitHub."
      }`,
      actions,
      followUps: ["What projects has he built?", "What's his tech stack?"],
    });
  }

  const wantsLive = has(q, "live", "demo", "link", "try", "visit", "website", "deployed");
  const wantsStack = has(q, "stack", "tech", "built with", "made with", "use", "language");
  const wantsFeatures = has(q, "feature", "do", "can it", "functionality", "capab");

  const parts: string[] = [`**${p.title}** — ${p.tagline}.`];
  if (p.description) parts.push(p.description);
  else parts.push("It's a digital learning platform — check the links below to explore it.");

  if ((wantsStack || !wantsFeatures) && p.stack.length) {
    parts.push(`**Built with:** ${p.stack.join(", ")}.`);
  }
  if ((wantsFeatures || (!wantsStack && !wantsLive)) && p.features.length) {
    parts.push(`**Highlights:**\n${bullets(p.features.slice(0, 5))}`);
  }
  if (wantsLive && !p.liveUrl) parts.push("There's no live demo yet, but the source is on GitHub.");

  const actions: ChatAction[] = [];
  if (p.liveUrl) actions.push({ kind: "link", label: "Live demo", href: p.liveUrl });
  if (p.githubUrl) actions.push({ kind: "link", label: "View code", href: p.githubUrl });

  const others = projects.filter((x) => x.title !== p.title).map((x) => `Tell me about ${x.title}`);
  return ok({ text: parts.join("\n\n"), actions, followUps: [...others.slice(0, 2), "What's his tech stack?"] });
}

/* ------------------------------ skill reply ------------------------------ */

function skillReply(found: Skill[]): ChatReply {
  if (found.length === 1) {
    const s = found[0];
    const used = s.usedIn.length && !s.usedIn.includes("All projects") ? s.usedIn : [];
    const text =
      `**${s.name}** (${s.category.toLowerCase()}) — ${s.description}` +
      (s.usedIn.includes("All projects")
        ? "\n\nIt's part of his workflow on every project."
        : used.length
          ? `\n\nUsed in: ${used.join(", ")}.`
          : "\n\nHe's learned it but hasn't shipped a featured project with it yet.");
    return ok({
      text,
      actions: [A.skills, A.projects],
      followUps: used.length ? used.slice(0, 2).map((u) => `Tell me about ${u}`) : ["What's his tech stack?"],
    });
  }
  const names = found.map((s) => s.name);
  const shared = projects
    .filter((p) => found.every((s) => s.usedIn.includes(p.title)))
    .map((p) => p.title);
  return ok({
    text:
      `Here's how those fit together:\n${bullets(found.map((s) => `**${s.name}** — ${s.description}`))}` +
      (shared.length ? `\n\nHe's used ${names.join(" and ")} together in ${shared.join(", ")}.` : ""),
    actions: [A.skills, A.projects],
    followUps: ["What's his tech stack?", "What projects has he built?"],
  });
}

/* -------------------------------- main API ------------------------------- */

export function answer(question: string): ChatReply {
  const q = norm(question);
  const tokens = q.split(" ").filter(Boolean);

  if (!tokens.length) {
    return { text: "Ask me anything about Abhishek's work — try one of the suggestions below.", followUps: STARTERS, confident: true };
  }

  /* small talk */
  if (tokens.length <= 5 && /^(hi|hii+|hello|hey+|hola|yo|namaste|sup|good (morning|afternoon|evening))\b/.test(q)) {
    return ok({
      text: "Hey! 👋 I'm the Portfolio Guide. I can walk you through Abhishek's projects, skills, journey, or help you get in touch.",
      followUps: STARTERS,
    });
  }
  if (/\b(thanks|thank you|thx|ty|cheers|appreciate)\b/.test(q) && tokens.length <= 6) {
    return ok({
      text: "Happy to help! Anything else you'd like to know?",
      followUps: ["Show me his best project", "How do I contact him?"],
    });
  }
  if (/^(bye|goodbye|see you|cya|later)\b/.test(q)) {
    return ok({ text: "Thanks for stopping by — hope to see you again! 👋", followUps: ["How do I contact him?"] });
  }
  if (has(q, "who are you", "what are you", "are you ai", "are you a bot", "are you real", "are you human", "chatgpt")) {
    return ok({
      text: "I'm the Portfolio Guide, a chatbot built into this site. I answer from the real content of Abhishek's portfolio — projects, skills and journey — and I won't make things up. For anything else, the contact form reaches the real him.",
      actions: [A.contact],
      followUps: STARTERS,
    });
  }
  if (has(q, "what can you do", "help", "how do you work", "what do you know", "what can i ask")) {
    return ok({
      text: `You can ask me about:\n${bullets([
        "**Projects** — features, tech stack, live demos, code",
        "**Skills** — languages, frameworks, and where each was used",
        "**Journey & education** — his path so far",
        "**Contact** — email, LinkedIn, GitHub, resume",
      ])}\n\nTry naming a project or technology directly, like “HourGlass” or “Where has he used React?”`,
      followUps: STARTERS,
    });
  }

  /* projects by name */
  const pHits = findProjects(q, tokens);
  const ambiguousNexus = compact(q).includes("nexus") && !pHits.length;
  if (ambiguousNexus) {
    return ok({
      text: "There are two “Nexus” projects — which one do you mean?\n- **NexusFlow** — an AI-powered developer intelligence platform\n- **Workspace Nexus** — a collaborative document platform",
      followUps: ["Tell me about NexusFlow", "Tell me about Workspace Nexus"],
    });
  }
  if (pHits.length === 1) return projectReply(pHits[0].title, q);
  if (pHits.length > 1) {
    return ok({
      text: `Those are two different projects:\n${bullets(
        pHits.map((h) => {
          const p = projects.find((x) => x.title === h.title);
          return `**${h.title}**${p ? ` — ${p.tagline}` : ""}`;
        })
      )}`,
      followUps: pHits.slice(0, 2).map((h) => `Tell me about ${h.title}`),
      actions: [A.projects],
    });
  }

  /* skills / technologies by name */
  const sHits = findSkills(q, tokens);
  // "GitHub" alone is a link/profile question, not a skills question.
  const onlyGithub = sHits.length === 1 && sHits[0].name === "GitHub" &&
    !has(q, "know", "skill", "used", "use", "experience", "comfortable", "proficient");
  if (sHits.length && sHits.length <= 3 && !onlyGithub) {
    // "does he know react" → specific answer beats the generic overview
    return skillReply(sHits);
  }

  /* skill categories */
  const cat = skillCategories.find((c) => {
    const w = c.toLowerCase().replace(/s$/, "");
    return q.includes(w) && (tokens.length <= 3 || has(q, "skill", "know", "use", "tech", "stack", "what", "which", "list", "tools", "language", "framework"));
  });
  if (cat) {
    const list = skills.filter((s) => s.category === cat).map((s) => s.name);
    return ok({
      text: `**${cat}:** ${list.join(", ")}.\n\nAsk about any of them to see where he's used it.`,
      actions: [A.skills],
      followUps: list.slice(0, 2).map((n) => `Where has he used ${n}?`),
    });
  }

  /* "do you know Python?" — a technology that isn't in the skills data */
  const askedTech = q.match(
    /\b(?:know|knows|use|uses|used|familiar with|experience (?:with|in)|proficient in|worked? with|good at|learn(?:ed|ing)?|skilled in|write|code in)\s+(?:in\s+|with\s+)?([a-z][a-z0-9.#]{1,20})\b/
  );
  const NOT_TECH = new Set(["a","an","any","the","him","his","much","what","which","about","more","some","all","many","how","that","this","it","things","stuff","abhishek"]);
  if (askedTech && !NOT_TECH.has(askedTech[1]) && !has(q, "project", "skill", "stack")) {
    const t = askedTech[1];
    return ok({
      text: `I don't see **${t}** in his listed skills, so I can't vouch for it. Here's what he does work with:\n${bullets(
        skillCategories.map((c) => `**${c}:** ${skills.filter((s) => s.category === c).map((s) => s.name).join(", ")}`)
      )}\n\nIf ${t} matters for your project, ask him directly.`,
      actions: [A.skills, A.contact],
      followUps: ["What projects has he built?", "How do I contact him?"],
    });
  }

  /* intents by keywords, scored */
  const intents: { name: string; score: number }[] = [
    { name: "hire", score: has(q, "hire", "hiring", "available", "availability", "freelance", "open to", "work with", "opportunit", "collaborat", "internship", "job", "recruit") ? 3 : 0 },
    { name: "resume", score: has(q, "resume", "cv", "curriculum") ? 3 : 0 },
    { name: "contact", score: has(q, "contact", "email", "mail", "reach", "get in touch", "message", "linkedin", "phone", "connect") ? 2 : 0 },
    { name: "github", score: has(q, "github", "git hub", "repo", "source code", "open source") ? 2 : 0 },
    { name: "profiles", score: has(q, "leetcode", "codeforces", "codechef", "competitive", "coding profile", "contest") ? 2.5 : 0 },
    { name: "achievements", score: has(q, "achievement", "award", "certif", "hackathon", "accomplish", "rank", "win", "won", "milestone") ? 2.5 : 0 },
    { name: "location", score: has(q, "where does", "where is he", "where do you", "located", "location", "based", "which city", "country", "live in", "lives in", "from where", "where are you") ? 2 : 0 },
    { name: "education", score: has(q, "education", "study", "studying", "college", "university", "pdeu", "degree", "b tech", "btech", "csbs", "student", "tcs", "graduat") ? 2.5 : 0 },
    { name: "journey", score: has(q, "journey", "timeline", "experience", "background", "history", "started", "how did", "career", "story") ? 2 : 0 },
    { name: "ai", score: has(q, "ai", "llm", "gemini", "machine learning", "ml", "artificial") ? 2.2 : 0 },
    { name: "site", score: has(q, "this site", "this website", "this portfolio", "built this", "made this", "how was this", "your website") ? 3 : 0 },
    { name: "best", score: has(q, "best", "favourite", "favorite", "proud", "top project", "most impressive", "flagship", "recommend") ? 2.5 : 0 },
    { name: "otherprojects", score: has(q, "other project", "more project", "side project", "smaller", "additional", "everything else") ? 3 : 0 },
    { name: "projects", score: has(q, "project", "built", "build", "made", "work", "app", "product", "demo") ? 1.6 : 0 },
    { name: "skills", score: has(q, "skill", "stack", "tech", "technolog", "language", "framework", "tools", "good at", "expert", "know") ? 1.6 : 0 },
    { name: "about", score: has(q, "about", "who is", "who's", "introduce", "tell me about abhishek", "abhishek", "him", "intro") ? 1.2 : 0 },
  ];
  const top = intents.sort((a, b) => b.score - a.score)[0];

  // Personal details that aren't part of the portfolio — say so honestly.
  if (has(q, "salary", "ctc", "pay", "rate", "age", "old", "phone", "number", "address", "married", "girlfriend", "family", "religion", "birthday", "whatsapp", "expected")) {
    return ok({
      text: "That's not something I have — it isn't part of his portfolio, and I won't guess. The best move is to ask him directly.",
      actions: [A.contact, A.email],
      followUps: ["Is he available for work?", "What projects has he built?"],
    });
  }

  switch (top.score > 0 ? top.name : "none") {
    case "site":
      return ok({
        text: "This portfolio is built with **Next.js 15**, **React 19**, **TypeScript** and **Tailwind CSS**, with **Framer Motion** and **Three.js** for the animation and 3D hero. Content and the contact form run on **Firebase** and **Resend**.",
        actions: [A.github],
        followUps: ["What projects has he built?", "What's his tech stack?"],
      });
    case "hire":
      return ok({
        text: "Abhishek is open to collaborations, freelance work, and interesting problems. The fastest way to start a conversation is the contact form or a direct email — I don't have details on specific availability or rates, so ask him directly.",
        actions: [A.contact, A.email, A.resume],
        followUps: ["Show me his best project", "What's his tech stack?"],
      });
    case "resume":
      return ok({
        text: "You can grab his resume right here — it opens in a new tab.",
        actions: [A.resume, A.contact],
        followUps: ["What projects has he built?", "How do I contact him?"],
      });
    case "contact":
      return ok({
        text: `Best ways to reach him:\n${bullets([
          `Email: **${PROFILE.email}**`,
          "The contact form at the bottom of this page",
          "LinkedIn or GitHub for a professional chat",
        ])}`,
        actions: [A.email, A.contact, A.linkedin],
        followUps: ["Is he available for work?", "Can I download his resume?"],
      });
    case "github":
      return ok({
        text: `His code lives on GitHub — every featured project links to its repository, and the GitHub section on this page shows live stats pulled from the API.`,
        actions: [A.github, { kind: "scroll", label: "GitHub stats", target: "github" }],
        followUps: ["What projects has he built?", "What's his tech stack?"],
      });
    case "profiles":
      return { text: "", live: "profiles", followUps: ["What's his tech stack?", "Show me his achievements"], confident: true };
    case "achievements":
      return { text: "", live: "achievements", actions: [{ kind: "scroll", label: "Achievements", target: "achievements" }], followUps: ["What projects has he built?", "What's his tech stack?"], confident: true };
    case "location":
      return ok({
        text: `He's based in **${PROFILE.location}**, and studies at ${PROFILE.university}.`,
        actions: [A.contact],
        followUps: ["Tell me about his education", "How do I contact him?"],
      });
    case "education":
      return ok({
        text: `Abhishek is pursuing a **${PROFILE.degree}** at ${PROFILE.university} (${PROFILE.years}). CSBS is a curriculum designed by Tata Consultancy Services (TCS) that blends core computer science with business systems.`,
        actions: [A.about, A.journey],
        followUps: ["What's his journey so far?", "What's his tech stack?"],
      });
    case "journey": {
      const dated = journeySteps.filter((s) => s.year).map((s) => `**${s.year}** — ${s.title}`);
      const built = journeySteps.filter((s) => s.title.startsWith("Built ")).map((s) => s.title.replace("Built ", ""));
      return ok({
        text: `${bullets(dated)}\n\nThen came the projects, in order: ${built.join(" → ")}.`,
        actions: [A.journey],
        followUps: ["Tell me about his education", "Show me his best project"],
      });
    }
    case "ai":
      return ok({
        text: "AI is one of his core interests, and he applies it to real tools rather than demos: **NexusFlow** pairs a custom Java concurrency engine with **Google Gemini** to turn GitHub activity into engineering insight.",
        actions: [A.projects],
        followUps: ["Tell me about NexusFlow", "What's his tech stack?"],
      });
    case "best": {
      return ok({
        text: "The most technically involved is **NexusFlow** — a custom Java concurrency engine with priority-based task scheduling, GitHub OAuth, and Gemini-powered analysis. For something you can click through right now, **Workspace Nexus** and **HourGlass** both have live demos.",
        actions: [A.projects],
        followUps: ["Tell me about NexusFlow", "Tell me about HourGlass"],
      });
    }
    case "otherprojects":
      return ok({
        text: `Beyond the featured work, he's also built:\n${bullets(otherProjects.map((p) => `**${p.title}**${p.demoUrl ? " (live demo)" : ""}`))}`,
        actions: [A.projects, A.github],
        followUps: otherProjects.slice(0, 2).map((p) => `Tell me about ${p.title}`),
      });
    case "projects":
      return ok({
        text: `He has **${projects.length} featured projects**:\n${bullets(projects.map((p) => `**${p.title}** — ${p.tagline}`))}\n\nPlus ${otherProjects.length} more, including ${otherProjects.map((p) => p.title).slice(0, 2).join(" and ")}.`,
        actions: [A.projects, A.github],
        followUps: projects.slice(0, 2).map((p) => `Tell me about ${p.title}`),
      });
    case "skills":
      return ok({
        text: `His toolkit, by area:\n${bullets(
          skillCategories.map((c) => `**${c}:** ${skills.filter((s) => s.category === c).map((s) => s.name).join(", ")}`)
        )}`,
        actions: [A.skills],
        followUps: ["Where has he used React?", "What backend skills does he have?"],
      });
    case "about":
      if (top.score >= 1.2)
        return ok({
          text: `**${PROFILE.name}** is a ${PROFILE.roles.join(" / ")} studying ${PROFILE.degree} at ${PROFILE.university}. His focus: ${PROFILE.focus.join(", ")}. He builds complete products — from database design to polished UI — and integrates AI into real developer tools.`,
          actions: [A.about, A.projects, A.resume],
          followUps: ["What projects has he built?", "What's his tech stack?"],
        });
  }

  /* fallback — not confident; UI may hand this to the AI model */
  return {
    text: "I'm not sure I have that one. I can help with his **projects**, **skills**, **education**, **journey**, or **how to reach him** — or you can ask him directly.",
    actions: [A.contact],
    followUps: STARTERS,
    confident: false,
  };
}

/* ------------------------- live-data reply formatters --------------------- */

export type LiveAchievement = { title: string; organization?: string; category?: string; metric?: string };
export type LiveContest = { platform: string; handle?: string; url: string };

export function achievementsReply(items: LiveAchievement[] | null): ChatReply {
  const actions: ChatAction[] = [{ kind: "scroll", label: "Achievements", target: "achievements" }];
  if (!items || !items.length) {
    return {
      text: "There aren't any achievements published on the site right now. His projects are the best window into what he can do.",
      actions: [A.projects],
      followUps: ["What projects has he built?", "What's his tech stack?"],
      confident: true,
    };
  }
  const shown = items.slice(0, 5).map(
    (a) => `**${a.title}**${a.organization ? ` — ${a.organization}` : ""}${a.metric ? ` (${a.metric})` : ""}`
  );
  return {
    text: `Highlights from the Achievements section:\n${bullets(shown)}${items.length > 5 ? `\n\n…and ${items.length - 5} more on the page.` : ""}`,
    actions,
    followUps: ["What projects has he built?", "What's his tech stack?"],
    confident: true,
  };
}

export function profilesReply(items: LiveContest[] | null): ChatReply {
  if (!items || !items.length) {
    return {
      text: "There are no coding profiles listed on the site right now. His GitHub and projects are the best place to see his work.",
      actions: [A.github, A.projects],
      followUps: ["What projects has he built?", "What's his tech stack?"],
      confident: true,
    };
  }
  return {
    text: `Coding profiles listed on the site:\n${bullets(
      items.map((c) => `**${c.platform}**${c.handle ? ` — ${c.handle}` : ""}`)
    )}`,
    actions: items.slice(0, 3).map((c) => ({ kind: "link" as const, label: c.platform, href: c.url })),
    followUps: ["What's his tech stack?", "Show me his achievements"],
    confident: true,
  };
}

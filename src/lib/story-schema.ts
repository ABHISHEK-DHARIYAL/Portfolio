import { z } from "zod";

const approachStepSchema = z.object({
  step: z.string().trim().min(1).max(200),
  detail: z.string().trim().max(1500).default(""),
});

const decisionSchema = z.object({
  decision: z.string().trim().min(1).max(200),
  reason: z.string().trim().max(1000).default(""),
});

const challengeSchema = z.object({
  problem: z.string().trim().min(1).max(300),
  solution: z.string().trim().min(1).max(1000),
});

const learnedSchema = z
  .array(z.string().trim().min(1).max(300))
  .max(20)
  .transform((arr) => Array.from(new Set(arr)));

/**
 * One project's "story": how the idea started and how it was built.
 * `slug` should match a project's slug so the public page can pick up
 * that project's tech stack and links. Every content field is optional —
 * the public page hides sections that are empty.
 */
export const storySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(150).default(""),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Accent must be a hex color like #7C3AED")
    .optional()
    .or(z.literal("")),
  idea: z.string().trim().max(4000).default(""),
  problem: z.string().trim().max(4000).default(""),
  approach: z.array(approachStepSchema).max(20).default([]),
  decisions: z.array(decisionSchema).max(20).default([]),
  challenges: z.array(challengeSchema).max(20).default([]),
  learned: learnedSchema.default([]),
  next: z.string().trim().max(3000).default(""),
  order: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});

export type StoryFormValues = z.infer<typeof storySchema>;

/** Every field optional — for PATCH requests that update a subset. */
export const storyUpdateSchema = storySchema.partial();

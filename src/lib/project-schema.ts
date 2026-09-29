import { z } from "zod";

/**
 * A "problem/solution" pair for the project detail modal's Challenges
 * section. Kept as its own schema since it's a nested array of objects,
 * not a flat string list like features/stack/architecture/highlights.
 */
const challengeSchema = z.object({
  problem: z.string().trim().min(1).max(300),
  solution: z.string().trim().min(1).max(500),
});

/** Trimmed, de-duplicated, blank-filtered string list — used for features, stack, architecture, and highlights. */
const stringListSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(30)
  .transform((arr) => Array.from(new Set(arr)));

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(150).default(""),
  description: z.string().trim().max(1000).default(""),
  features: stringListSchema.default([]),
  stack: stringListSchema.default([]),
  liveUrl: z.string().trim().url().optional().or(z.literal("")),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Accent must be a hex color like #7C3AED")
    .default("#7C3AED"),
  architecture: stringListSchema.default([]),
  challenges: z.array(challengeSchema).max(20).default([]),
  highlights: stringListSchema.default([]),
  order: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

/** Same shape, but every field optional — for PATCH requests that update a subset of fields. */
export const projectUpdateSchema = projectSchema.partial();

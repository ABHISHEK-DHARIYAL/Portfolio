import { z } from "zod";

/**
 * A single competitive-programming profile link (LeetCode, Codeforces,
 * CodeChef, or anything else the admin wants to add — platform is a free
 * text label, not a fixed enum, so this isn't locked to three names).
 */
export const contestSchema = z.object({
  platform: z.string().trim().min(1).max(60),
  // Optional per-platform handle/username, shown under the platform
  // name on the card (purely cosmetic — the link itself is `url`).
  handle: z.string().trim().max(60).default(""),
  // Optional 1-3 letter abbreviation for the icon badge (e.g. "LC"). Left
  // blank, the UI derives one automatically from the platform name.
  shortLabel: z.string().trim().max(3).default(""),
  url: z.string().trim().url("Enter a full URL, including https://"),
  order: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});

export type ContestFormValues = z.infer<typeof contestSchema>;

/** Same shape, but every field optional — for PATCH requests that update a subset of fields. */
export const contestUpdateSchema = contestSchema.partial();

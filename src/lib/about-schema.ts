import { z } from "zod";

/** Icons the About section's link buttons can use. */
export const ABOUT_ICONS = ["github", "leetcode", "codechef", "codeforces", "linkedin", "mail", "link"] as const;
export type AboutIcon = (typeof ABOUT_ICONS)[number];

/**
 * Everything shown in the About section. The admin page at /admin/about
 * edits exactly this shape; the public site reads it from /api/about.
 */
export const aboutSchema = z.object({
  heading: z.string().trim().min(1, "Heading is required").max(120),
  intro: z.array(z.string().trim().min(1).max(700)).min(1, "Add at least one paragraph").max(5),
  stats: z
    .array(
      z.object({
        value: z.string().trim().min(1, "Value is required").max(12),
        label: z.string().trim().min(1, "Label is required").max(60),
        detail: z.string().trim().max(120).default(""),
      })
    )
    .max(8),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Label is required").max(40),
        href: z
          .string()
          .trim()
          .refine((v) => /^(https?:\/\/|mailto:)/i.test(v), "Use a full link starting with https:// or mailto:"),
        icon: z.enum(ABOUT_ICONS),
      })
    )
    .max(10),
});

export type AboutContent = z.infer<typeof aboutSchema>;

import { z } from "zod";

/**
 * The rotating "question + typed answer + button" in the home-page hero.
 * The admin page at /admin/hero edits exactly this shape; the public
 * site reads it from /api/hero.
 *
 * `href` can be:
 *   "#projects"            → scrolls to that section of the home page
 *   "/stories", "/skills"  → another page on this site
 *   "https://example.com"  → an external site (opens in a new tab)
 */
export const heroQuestionSchema = z.object({
  q: z.string().trim().min(1, "Question is required").max(90, "Keep the question under 90 characters"),
  a: z.string().trim().min(1, "Answer is required").max(140, "Keep the answer under 140 characters"),
  href: z
    .string()
    .trim()
    .refine((v) => /^(#[\w-]+|\/[^\s]*|https?:\/\/\S+)$/i.test(v), "Use #section, /page, or a full https:// link"),
  cta: z.string().trim().min(1, "Button text is required").max(60, "Keep the button text under 60 characters"),
});

export const heroSchema = z.object({
  items: z.array(heroQuestionSchema).min(1, "Add at least one question").max(12, "Up to 12 questions"),
});

export type HeroQuestion = z.infer<typeof heroQuestionSchema>;
export type HeroContent = z.infer<typeof heroSchema>;

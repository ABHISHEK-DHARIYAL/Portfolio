import { z } from "zod";

/**
 * A simple project entry: name + optional website/GitHub links. At least
 * one of the two links must be provided — a project with neither isn't
 * useful to show (nothing to click through to), so that's enforced here
 * via `.refine()` rather than left to be a silent no-op card.
 */
export const otherProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(150),
    // Empty string is the "not provided" value (same convention used by
    // ProjectFormValues.liveUrl and AchievementFormValues.link) —
    // validated as a real URL only when non-empty.
    websiteUrl: z
      .string()
      .trim()
      .max(500)
      .default("")
      .refine((val) => val === "" || z.string().url().safeParse(val).success, {
        message: "Enter a full URL, including https://",
      }),
    githubUrl: z
      .string()
      .trim()
      .max(500)
      .default("")
      .refine((val) => val === "" || z.string().url().safeParse(val).success, {
        message: "Enter a full URL, including https://",
      }),
  })
  .refine((data) => data.websiteUrl !== "" || data.githubUrl !== "", {
    message: "Provide at least a website URL or a GitHub URL.",
    path: ["websiteUrl"],
  });

export type OtherProjectFormValues = z.infer<typeof otherProjectSchema>;

/**
 * A separate, all-optional variant for PATCH requests — `.partial()`
 * can't be called on a schema built with `.refine()`, so this
 * re-declares the same three fields as fully optional instead. The
 * "at least one link" rule isn't re-checked here at the schema level;
 * see updateOtherProject() in firestore-other-projects.ts, which merges
 * the patch against the existing document and validates the *result*
 * has at least one link before writing.
 */
export const otherProjectUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  websiteUrl: z
    .string()
    .trim()
    .max(500)
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a full URL, including https://",
    })
    .optional(),
  githubUrl: z
    .string()
    .trim()
    .max(500)
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a full URL, including https://",
    })
    .optional(),
});

export type OtherProjectUpdateValues = z.infer<typeof otherProjectUpdateSchema>;

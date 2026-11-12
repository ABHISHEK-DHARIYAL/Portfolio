import { z } from "zod";

/**
 * Everything shown in the Journey timeline. The admin page at /admin/journey
 * edits exactly this shape; the public site reads it from /api/journey.
 */
export const journeySchema = z.object({
  steps: z
    .array(
      z.object({
        year: z.string().trim().max(12).default(""),
        title: z.string().trim().min(1, "Title is required").max(80),
        description: z.string().trim().max(140).default(""),
      })
    )
    .min(1, "Add at least one step")
    .max(30),
});

export type JourneyContent = z.infer<typeof journeySchema>;

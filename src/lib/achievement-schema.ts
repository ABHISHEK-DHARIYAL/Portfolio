import { z } from "zod";

/**
 * The complete, fixed set of categories — deliberately not free text (see
 * project spec: "The admin should NOT type arbitrary categories"). Both
 * the admin dropdown and server-side validation are driven from this one
 * array, so the two can never drift apart.
 */
export const ACHIEVEMENT_CATEGORIES = [
  "Programming",
  "Competitive Programming",
  "Hackathon",
  "Certification",
  "Academic",
  "Developer Program",
  "Open Source",
  "Internship / Work Experience",
  "OA / Assessment",
  "Competition",
  "Other",
] as const;

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

/**
 * Only `title`, `category`, and `visible` are required. Every other
 * field is optional and, when left blank, stored as an empty string
 * rather than omitted — the public site treats an empty string exactly
 * like "not provided" and skips rendering that part of the card
 * entirely (see PublicAchievement / Achievements.tsx). Storing "" is a
 * deliberate, simpler convention than storing `undefined`/omitting the
 * field, since Firestore + this codebase's read path already handle
 * "field is an empty string" uniformly everywhere else (see e.g.
 * ProjectFormValues.liveUrl in project-schema.ts, which follows the
 * same pattern).
 */
export const achievementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  organization: z.string().trim().max(150).default(""),
  category: z.enum(ACHIEVEMENT_CATEGORIES, {
    errorMap: () => ({ message: "Choose one of the listed categories." }),
  }),
  // e.g. "Top 1,000 out of 1.5 lakh+ participants", "95.5 Percentile"
  metric: z.string().trim().max(200).default(""),
  description: z.string().trim().max(1000).default(""),
  // Validated as a real URL only when non-empty — an empty string is a
  // valid "no link provided" value, not a validation failure.
  link: z
    .string()
    .trim()
    .max(500)
    .default("")
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a full URL, including https://",
    }),
  visible: z.boolean().default(true),
});

export type AchievementFormValues = z.infer<typeof achievementSchema>;

/** Same shape, but every field optional — for PATCH requests that update a subset of fields (e.g. just toggling visibility). */
export const achievementUpdateSchema = achievementSchema.partial();

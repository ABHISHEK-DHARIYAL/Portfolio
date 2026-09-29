import { z } from "zod";

/**
 * Single source of truth for contact-form validation. Imported by both the
 * client form (for instant feedback) and the API route (which is the only
 * validation that actually matters — client-side checks are a UX nicety,
 * never a security boundary, since any request can bypass the browser
 * entirely).
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  subject: z
    .string()
    .trim()
    .min(2, "Subject must be at least 2 characters")
    .max(150, "Subject must be under 150 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
  // Honeypot: a field real visitors never see or fill in (hidden off-screen
  // in the form). Bots that blindly fill every input trip it. Must arrive
  // empty; optional so it doesn't break if a client build omits it.
  company: z.string().max(0, "Spam check failed").optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** What the client actually submits — includes the honeypot as a plain string field. */
export type ContactFormInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
};

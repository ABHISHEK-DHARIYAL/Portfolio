/**
 * Strips HTML tags and control characters from user-submitted text.
 *
 * This isn't trying to allow-list safe HTML (there's no legitimate reason
 * for a contact-form field to contain any) — it just removes anything that
 * looks like markup so stored messages can't inject scripts into the admin
 * dashboard, and collapses excess whitespace. Zod's `.trim()` already
 * handles leading/trailing whitespace and length limits; this handles
 * content shape.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // strip control chars (keep \n \t)
    .replace(/[ \t]{2,}/g, " ") // collapse repeated spaces/tabs
    .replace(/\n{3,}/g, "\n\n") // collapse excess blank lines
    .trim();
}

export function sanitizeContactFields<T extends { name: string; subject: string; message: string }>(
  fields: T
): T {
  return {
    ...fields,
    name: sanitizeText(fields.name),
    subject: sanitizeText(fields.subject),
    message: sanitizeText(fields.message),
  };
}

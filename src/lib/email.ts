import "server-only";
import { Resend } from "resend";
import { getBackendEnv } from "./env";

export type ContactEmailData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date;
  ip: string;
  browser: string;
};

function formatDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function buildTextBody(data: ContactEmailData): string {
  return [
    "New Portfolio Contact",
    "",
    "Name:",
    data.name,
    "",
    "Email:",
    data.email,
    "",
    "Subject:",
    data.subject,
    "",
    "Message:",
    data.message,
    "",
    "Submitted At:",
    formatDate(data.submittedAt),
    "",
    "IP:",
    data.ip,
    "",
    "Browser:",
    data.browser,
  ].join("\n");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtmlBody(data: ContactEmailData): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #22263f;">
        <p style="margin:0 0 4px;font:600 11px/1 monospace;letter-spacing:.05em;text-transform:uppercase;color:#8b8fb3;">${label}</p>
        <p style="margin:0;font:15px/1.5 -apple-system,Segoe UI,sans-serif;color:#f4f4fb;white-space:pre-wrap;">${escapeHtml(value)}</p>
      </td>
    </tr>`;

  return `
  <div style="background:#050816;padding:32px 16px;font-family:-apple-system,Segoe UI,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#0a0f24;border:1px solid #22263f;border-radius:16px;padding:28px;">
      <p style="margin:0 0 4px;font:600 12px/1 monospace;letter-spacing:.08em;text-transform:uppercase;background:linear-gradient(135deg,#7C3AED,#3B82F6);-webkit-background-clip:text;background-clip:text;color:#7C3AED;">Portfolio</p>
      <h1 style="margin:0 0 20px;font-size:20px;color:#ffffff;">New Portfolio Contact</h1>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", data.name)}
        ${row("Email", data.email)}
        ${row("Subject", data.subject)}
        ${row("Message", data.message)}
        ${row("Submitted At", formatDate(data.submittedAt))}
        ${row("IP", data.ip)}
        ${row("Browser", data.browser)}
      </table>
    </div>
  </div>`;
}

/**
 * Sends the notification email via Resend. Throws on failure — the caller
 * (the API route) decides what that means for the HTTP response; this
 * function's only job is "send, or explain why not."
 */
export async function sendContactNotification(data: ContactEmailData): Promise<void> {
  const env = getBackendEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    // Resend's shared onboarding sender works out of the box for sending
    // to the email address your Resend account itself is registered
    // with — no custom domain verification needed for that case. See the
    // README for switching to a verified domain sender.
    from: "Portfolio Contact <onboarding@resend.dev>",
    to: env.CONTACT_RECIPIENT_EMAIL,
    replyTo: data.email,
    subject: "New Portfolio Contact",
    text: buildTextBody(data),
    html: buildHtmlBody(data),
  });

  if (error) {
    throw new Error(`Resend failed to send: ${error.message}`);
  }
}

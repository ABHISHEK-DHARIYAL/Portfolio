import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import { ToastProvider } from "@/components/ui/Toast";
import ThemeProvider from "@/components/layout/ThemeProvider";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin — Contact Messages",
  robots: { index: false, follow: false }, // never let this show up in search results
};

/**
 * The admin dashboard's own minimal root layout — deliberately without
 * the public site's decorative chrome (cursor, particles, cookie
 * consent). It DOES now share the same ThemeProvider as the public
 * site, though: since both live on the same origin, the "site-theme"
 * localStorage key ThemeProvider reads is naturally shared too — a
 * theme choice made on the public site is already in effect here on
 * first load, and vice versa, with no extra wiring needed.
 *
 * The light-theme CSS override layer in globals.css is what actually
 * does the re-coloring (targets plain utility classes like text-white,
 * border-white/10, bg-white/[0.03], bg-base — all already used
 * throughout the admin pages), so admin pages get light mode "for
 * free" the moment data-theme="light" is set. The one place that isn't
 * covered: admin components using hardcoded hex colors instead of
 * those utilities (e.g. MessageDetailModal's bg-[#0A0F24] panel) stay
 * dark in both themes — consistent with the same "floating overlay
 * chrome stays dark" pattern already documented for the public site's
 * command palette/cookie panel/etc.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-base font-body text-white antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

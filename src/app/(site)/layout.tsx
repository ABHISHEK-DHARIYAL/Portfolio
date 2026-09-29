import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://abhishekdhariyal.dev"
  ),
  title: "Abhishek Dhariyal — Software Engineer",
  description:
    "Software Engineer, Full Stack Developer, and AI enthusiast. Building scalable systems and intelligent platforms.",
  openGraph: {
    title: "Abhishek Dhariyal — Software Engineer",
    description:
      "Software Engineer, Full Stack Developer, and AI enthusiast. Building scalable systems and intelligent platforms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abhishek Dhariyal — Software Engineer",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-base font-body text-white antialiased md:cursor-none">
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}

import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

export const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
export const body = Inter({ subsets: ["latin"], variable: "--font-body" });
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;

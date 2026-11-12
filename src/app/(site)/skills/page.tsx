import type { Metadata } from "next";
import Skills from "@/components/sections/Skills";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Skills — Abhishek Dhariyal" };

export default function SkillsPage() {
  return (
    <main id="main-content" className="relative">
      <Skills standalone />
      <Footer />
    </main>
  );
}

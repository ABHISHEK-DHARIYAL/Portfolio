import type { Metadata } from "next";
import ProjectStories from "@/components/sections/ProjectStories";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Project Stories — Abhishek Dhariyal",
  description:
    "The story behind each project: how the idea started, how I approached it, the decisions I made and what I learned.",
};

export default function StoriesPage() {
  return (
    <main id="main-content" className="relative">
      <ProjectStories />
      <Footer />
    </main>
  );
}

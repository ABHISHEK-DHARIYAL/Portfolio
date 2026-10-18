import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import OtherProjects from "@/components/sections/OtherProjects";
import Journey from "@/components/sections/Journey";
import Achievements from "@/components/sections/Achievements";
import GithubSection from "@/components/sections/Github";
import CodingProfiles from "@/components/sections/CodingProfiles";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main id="main-content" className="relative">
      <Hero />
      <About />
      <Skills />
      <Projects />
      <OtherProjects />
      <Journey />
      <Achievements />
      <GithubSection />
      <CodingProfiles />
      <Contact />
      <Footer />
    </main>
  );
}

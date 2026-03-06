import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import Features from "@/components/Features";
import Download from "@/components/Download";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";

export default function LangPage() {
  return (
    <main>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Services />
      <Features />
      <Download />
      <Footer />
    </main>
  );
}

import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { Testimonials } from "@/components/site/Testimonials";
import { ToolsTicker } from "@/components/site/ToolsTicker";
import { Work } from "@/components/site/Work";

export default function Home() {
  return (
    <>
      <Hero />
      <ToolsTicker />
      <About />
      <Services />
      <Work />
      <Testimonials />
      <Contact />
    </>
  );
}

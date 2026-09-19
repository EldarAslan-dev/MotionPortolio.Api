import { About } from "@/components/site/About";
import { Clients } from "@/components/site/Clients";
import { Contact } from "@/components/site/Contact";
import { Hero } from "@/components/site/Hero";
import { ToolsTicker } from "@/components/site/ToolsTicker";
import { Work } from "@/components/site/Work";

export default function Home() {
  return (
    <>
      <Hero />
      <ToolsTicker />
      <Work />
      <Clients />
      <About />
      <Contact />
    </>
  );
}

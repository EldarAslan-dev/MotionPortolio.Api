"use client";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { Bulletin } from "@/components/site/Bulletin";
import { useStudio } from "@/lib/site/StudioContext";

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g);
  if (!parts) return [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function About() {
  const { ready, bio } = useStudio();
  const sentences = splitSentences(bio);

  return (
    <section id="about" className="relative border-t border-line px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1600px] gap-10 md:grid-cols-[240px_1fr] md:gap-16">
        <div className="md:sticky md:top-32 md:h-fit">
          <MaskReveal
            innerClassName="font-mono-tech text-xs text-cue"
          >
            01
          </MaskReveal>
          <MaskReveal
            innerClassName="mt-2 block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist"
          >
            Haqqında
          </MaskReveal>
        </div>

        <div className="max-w-3xl">
          {ready
            ? sentences.map((s, i) => (
                <MaskReveal
                  key={`${s.slice(0, 12)}-${i}`}
                  as="p"
                  className="mb-1"
                  innerClassName="font-display text-2xl italic leading-snug text-bone md:text-4xl md:leading-snug"
                  delay={i * 40}
                >
                  {s}
                </MaskReveal>
              ))
            : (
              <div className="space-y-4">
                <div className="h-8 w-full animate-pulse bg-bone/10" />
                <div className="h-8 w-4/5 animate-pulse bg-bone/10" />
              </div>
            )}

          <Bulletin />
        </div>
      </div>
    </section>
  );
}

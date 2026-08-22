"use client";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { useStudio } from "@/lib/site/StudioContext";

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g);
  if (!parts) return [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function About() {
  const { ready, bio, name, avatar } = useStudio();
  const sentences = splitSentences(bio);

  return (
    <section id="about" className="relative border-t border-line px-5 py-28 md:px-10">
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

          <div className="mt-12 flex items-center gap-4 border-t border-line pt-8">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={name}
                className="h-12 w-12 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full border border-line bg-surface" />
            )}
            <div>
              <p className="text-sm font-medium text-bone">{name}</p>
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mist">
                Motion Design &amp; Video Editing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

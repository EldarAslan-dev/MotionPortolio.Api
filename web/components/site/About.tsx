"use client";

import { Bulletin } from "@/components/site/Bulletin";
import { ABOUT_BODY } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

export function About() {
  const { ready, aboutPhoto } = useStudio();
  const body = ABOUT_BODY;

  return (
    <section id="about" className="relative scroll-mt-28 overflow-visible border-t border-line px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[720px]">
        {ready && aboutPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aboutPhoto} alt="" className="block w-full object-cover" />
        ) : (
          <div className="aspect-[4/5] w-full bg-surface" />
        )}

        {ready ? (
          <p className="mt-8 font-display text-[clamp(1.15rem,2.6vw,1.85rem)] font-medium uppercase leading-[1.28] tracking-[0.04em] text-bone">
            {body}
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            <div className="h-6 w-full animate-pulse bg-bone/10" />
            <div className="h-6 w-4/5 animate-pulse bg-bone/10" />
          </div>
        )}

        <Bulletin />
      </div>
    </section>
  );
}

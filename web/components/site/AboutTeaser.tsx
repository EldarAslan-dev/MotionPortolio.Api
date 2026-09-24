"use client";

import { ABOUT_TEASER } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

export function AboutTeaser() {
  const { ready, profile } = useStudio();
  const text = profile?.aboutTeaser?.trim() || ABOUT_TEASER;

  return (
    <div className="mx-auto mt-10 w-full max-w-[22rem] px-1 md:mt-8 md:max-w-3xl">
      {ready ? (
        <p className="text-center text-[17px] font-medium leading-[1.4] tracking-[-0.02em] text-bone md:text-2xl md:leading-snug">
          {text}
        </p>
      ) : (
        <div className="mx-auto h-12 w-4/5 animate-pulse bg-bone/10 md:h-8" />
      )}
    </div>
  );
}

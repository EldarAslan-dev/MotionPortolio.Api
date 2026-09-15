"use client";

import { ABOUT_TEASER } from "@/lib/site/copy";

export function AboutTeaser() {
  return (
    <section className="border-t border-line px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[17px] font-medium leading-snug tracking-[-0.02em] text-bone md:text-2xl md:leading-snug">
          {ABOUT_TEASER}
        </p>
      </div>
    </section>
  );
}

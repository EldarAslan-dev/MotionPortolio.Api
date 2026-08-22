"use client";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { useStudio } from "@/lib/site/StudioContext";

export function Contact() {
  const { profile, openInquiry } = useStudio();

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-line px-5 py-32 text-center md:px-10"
    >
      <div className="grain" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <MaskReveal innerClassName="block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
          05 — Əlaqə
        </MaskReveal>

        <MaskReveal
          as="h2"
          className="mt-8 flex justify-center"
          innerClassName="font-display text-5xl italic leading-[0.95] text-bone md:text-7xl"
          delay={80}
        >
          Bir kadrdan başlayaq.
        </MaskReveal>

        <MaskReveal
          as="p"
          className="mx-auto mt-6 max-w-lg"
          innerClassName="text-mist"
          delay={160}
        >
          Büdcəni və ehtiyacı yazın — studio desk-dən cavab gələcək.
        </MaskReveal>

        <div className="mt-12 flex flex-col items-center gap-8">
          <button
            type="button"
            data-cursor="link"
            onClick={() => openInquiry("Ümumi əməkdaşlıq")}
            className="rounded-full border border-bone/30 px-8 py-4 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
          >
            Əlaqə saxla
          </button>

          {profile?.instagramUrl ? (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer"
              data-cursor="view"
              data-cursor-label="AÇ"
              className="group font-display text-3xl italic text-bone transition-colors hover:text-cue md:text-4xl"
            >
              Instagram
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                ↗
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

"use client";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { useStudio } from "@/lib/site/StudioContext";

export function Testimonials() {
  const { ready, doubled, setReviewOpen } = useStudio();

  return (
    <section id="notes" className="border-t border-line py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <MaskReveal innerClassName="block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
            04 — Müştəri qeydləri
          </MaskReveal>
          <button
            type="button"
            data-cursor="link"
            onClick={() => setReviewOpen(true)}
            className="font-mono-tech text-xs uppercase tracking-[0.15em] text-mist underline decoration-cue/60 underline-offset-4 transition hover:text-bone"
          >
            Rəy yaz
          </button>
        </div>
      </div>

      {ready && doubled.length > 0 ? (
        <div className="mt-14 overflow-hidden">
          <div className="marquee-run flex w-max gap-6 px-5 md:px-10">
            {doubled.map((t, i) => (
              <figure
                key={`${t.id}-${i}`}
                className="w-80 shrink-0 border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cue/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
              >
                <p className="text-cue">{"★".repeat(t.rating || 5)}</p>
                <blockquote className="mt-4 text-sm leading-relaxed text-bone/90">
                  &ldquo;{t.comment}&rdquo;
                </blockquote>
                <figcaption className="mt-5 font-mono-tech text-[11px] uppercase tracking-[0.1em] text-mist">
                  {t.clientName}
                  {t.company ? ` · ${t.company}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-10 px-5 text-sm text-mist md:px-10">
          Rəylər yüklənəndə burada görünəcək.
        </p>
      )}
    </section>
  );
}

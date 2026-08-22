"use client";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { useStudio } from "@/lib/site/StudioContext";

const SERVICES = [
  {
    n: "01",
    title: "Logo motion",
    body: "Brend imzası üçün qısa, yadda qalan logo animasiyaları.",
  },
  {
    n: "02",
    title: "Explainer",
    body: "Məhsulu və ideyanı 2D motion ilə aydın izah edən videolar.",
  },
  {
    n: "03",
    title: "Sosial reels",
    body: "Instagram və TikTok üçün ritmik, diqqət çəkən kadrlar.",
  },
  {
    n: "04",
    title: "Promo",
    body: "Kampaniya üçün montaj, səs dizaynı və rəng korreksiyası.",
  },
  {
    n: "05",
    title: "Montaj",
    body: "Tam video editing — kəsim, tipografiya və temp.",
  },
];

export function Services() {
  const { openInquiry } = useStudio();

  return (
    <section id="services" className="border-t border-line px-5 py-28 md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <MaskReveal innerClassName="block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
          02 — Xidmətlər
        </MaskReveal>

        <div className="mt-10 border-t border-line">
          {SERVICES.map((s) => (
            <button
              key={s.n}
              type="button"
              data-cursor="link"
              onClick={() => openInquiry(s.title)}
              className="group relative block w-full border-b border-line py-8 text-left transition-colors duration-300 hover:bg-surface/40 md:py-10"
            >
              <div className="flex items-center gap-6 px-2 md:gap-10 md:px-4">
                <span className="w-10 shrink-0 font-mono-tech text-sm text-mist transition-colors duration-300 group-hover:text-cue">
                  {s.n}
                </span>
                <h3 className="font-display text-3xl italic text-bone transition-transform duration-500 group-hover:translate-x-2 md:text-5xl">
                  {s.title}
                </h3>
                <p className="ml-auto hidden max-w-xs shrink-0 text-right text-sm text-mist opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block md:translate-x-4">
                  {s.body}
                </p>
                <span className="hidden shrink-0 font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition-opacity duration-300 group-hover:opacity-100 md:inline-flex md:opacity-0">
                  Sifariş →
                </span>
              </div>
              <p className="mt-3 px-2 text-sm text-mist md:hidden md:px-4">{s.body}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { INQUIRY_GENERAL, SOCIALS } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

export function Contact() {
  const { profile, openInquiry } = useStudio();
  const instagram = profile?.instagramUrl || SOCIALS.instagramFallback;

  return (
    <section
      id="contact"
      className="relative scroll-mt-28 overflow-visible border-t border-line px-5 py-32 text-center md:px-10"
    >
      <div className="grain" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="mb-5 font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
          CONTACT
        </p>

        <h2 className="font-display mt-8 text-4xl leading-[1.05] text-bone sm:text-5xl md:text-7xl md:leading-[0.95]">
          Start with one frame.
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-mist">
          Send the brief and the budget. Studio desk replies.
        </p>

        <div className="mt-12 flex flex-col items-center gap-10">
          <button
            type="button"
            data-cursor="link"
            onClick={() => openInquiry(INQUIRY_GENERAL)}
            className="rounded-full border border-bone/30 px-8 py-4 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
          >
            Get in touch
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="font-display inline-block text-xl text-bone transition-[color,transform] duration-300 hover:scale-110 hover:text-cue md:text-2xl"
            >
              Instagram
            </a>
            <a
              href={SOCIALS.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="font-display inline-block text-xl text-bone transition-[color,transform] duration-300 hover:scale-110 hover:text-cue md:text-2xl"
            >
              LinkedIn
            </a>
            <a
              href={SOCIALS.behance}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="font-display inline-block text-xl text-bone transition-[color,transform] duration-300 hover:scale-110 hover:text-cue md:text-2xl"
            >
              Behance
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

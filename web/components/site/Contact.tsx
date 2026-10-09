"use client";

import { INQUIRY_GENERAL, SOCIALS } from "@/lib/site/copy";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";

export function Contact() {
  const { profile, openInquiry } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const instagram = profile?.instagramUrl || SOCIALS.instagramFallback;

  return (
    <section id="contact" className="relative z-[1] px-6 py-[110px] text-center">
      <div className="rise mx-auto max-w-[860px]">
        <h2
          className="mb-10 font-extrabold leading-[1.02] tracking-[-0.045em]"
          style={{ fontSize: `clamp(32px, 7vw, ${design.contactSize}px)` }}
        >
          <span className="gt">{design.contactTitle}</span>
        </h2>
        <button type="button" className="gold-btn" onClick={() => openInquiry(INQUIRY_GENERAL)}>
          {design.contactButton}
        </button>
        <div className="soc mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <a href={instagram} target="_blank" rel="noreferrer">
            {design.instagramLabel}
          </a>
          <a href={design.linkedinUrl || SOCIALS.linkedin} target="_blank" rel="noreferrer">
            {design.linkedinLabel}
          </a>
          <a href={design.behanceUrl || SOCIALS.behance} target="_blank" rel="noreferrer">
            {design.behanceLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

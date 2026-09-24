"use client";

import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";

export function Clients() {
  const { clientLogos } = useStudio();
  const logos = clientLogos ?? [];

  return (
    <section id="clients" className="scroll-mt-28 border-t border-line px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1600px]">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
          Companies we&apos;ve worked with
        </p>
        <div className="mt-10 overflow-visible">
          <div className="client-grid">
            {logos
              .filter((logo) => logo.logoUrl)
              .map((logo) => (
                <div key={logo.id} className="client-mark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(logo.logoUrl)} alt="" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

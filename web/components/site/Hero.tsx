"use client";

import { CylinderGallery } from "@/components/site/CylinderGallery";
import { parseHeroGallery } from "@/lib/config";
import { STUDIO_NAME } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

export function Hero() {
  const { ready, name, profile } = useStudio();
  const items = parseHeroGallery(profile?.heroGalleryJson);
  const display = ready ? name.trim() || STUDIO_NAME : STUDIO_NAME;

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-visible px-5 pb-16 pt-28 md:px-10"
    >
      <div className="grain" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center text-center">
        <p className="mb-5 font-mono-tech text-[10px] uppercase tracking-[0.28em] text-mist md:text-[11px]">
          Motion studio
        </p>
        <h1 className="font-display max-w-[16ch] text-[clamp(2.6rem,10vw,7.2rem)] leading-[0.92] text-bone">
          {display}
        </h1>
        <div className="mt-12 w-full md:mt-16">
          <CylinderGallery items={items} />
        </div>
        <p className="mt-12 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-mist">
          Baku, Azerbaijan
        </p>
      </div>
    </section>
  );
}

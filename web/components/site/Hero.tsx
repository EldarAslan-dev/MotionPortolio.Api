"use client";

import { AboutTeaser } from "@/components/site/AboutTeaser";
import { STUDIO_NAME } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

export function Hero() {
  const { ready, name, profile } = useStudio();
  const display = (ready ? name.trim() || STUDIO_NAME : STUDIO_NAME)
    .toUpperCase()
    .replaceAll("İ", "I");
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || display;
  const lastName = nameParts.slice(1).join(" ");
  const hasTicker = Boolean(profile?.showAnnouncement && profile.announcementText?.trim());

  return (
    <section
      id="top"
      className={`relative flex flex-col overflow-visible px-3 pb-16 md:min-h-[100svh] md:px-4 md:pb-10 ${
        hasTicker ? "pt-32 md:pt-28" : "pt-24 md:pt-20"
      }`}
    >
      <div className="grain" />
      <div className="relative z-10 mx-auto flex w-full flex-1 flex-col items-center text-center">
        <h1 className="font-display w-full text-center text-[clamp(3.25rem,15.6vw,4.85rem)] uppercase leading-[0.88] text-bone md:whitespace-nowrap md:text-[clamp(4.1rem,9vw,12rem)] md:leading-[0.8]">
          <span className="block md:inline">{firstName}</span>
          {lastName ? (
            <>
              <span className="hidden md:inline"> </span>
              <span className="block md:inline">{lastName}</span>
            </>
          ) : null}
        </h1>
        <AboutTeaser />
      </div>
    </section>
  );
}

"use client";

import { CylinderGallery } from "@/components/site/CylinderGallery";
import { AboutTeaser } from "@/components/site/AboutTeaser";
import { isVideoMedia, parseGallery, parseHeroGallery } from "@/lib/config";
import { STUDIO_NAME } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";
import type { GalleryItem, Project } from "@/lib/types";

function uniqueBandItems(profile: { heroGalleryJson?: string } | null, projects: Project[]): GalleryItem[] {
  const seen = new Set<string>();
  const items: GalleryItem[] = [];
  const add = (item: GalleryItem | undefined) => {
    if (!item?.url || seen.has(item.url)) return;
    seen.add(item.url);
    const poster = item.posterUrl;
    items.push(
      poster
        ? { url: poster, type: "image" }
        : { url: item.url, type: isVideoMedia(item) ? "video" : "image" },
    );
  };
  for (const item of parseHeroGallery(profile?.heroGalleryJson)) add(item);
  for (const project of projects) {
    if (items.length >= 7) break;
    add({ url: project.cardImageUrl || project.thumbnailUrl || "", type: "image" });
    if (items.length >= 7) break;
    const gallery = parseGallery(project.galleryJson);
    add(gallery.find((entry) => entry.type === "image"));
    if (items.length >= 7) break;
    const posted = gallery.find((entry) => entry.posterUrl);
    if (posted?.posterUrl) add({ url: posted.posterUrl, type: "image" });
  }
  return items.slice(0, 7);
}

export function Hero() {
  const { ready, name, profile, projects } = useStudio();
  const items = uniqueBandItems(profile, projects);
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
        <p className="mb-5 hidden font-mono-tech text-[10px] uppercase tracking-[0.28em] text-mist">
          Motion studio
        </p>
        <div className="relative w-full">
          <h1 className="font-display relative z-0 w-full text-center text-[clamp(3.25rem,15.6vw,4.85rem)] uppercase leading-[0.88] text-bone md:whitespace-nowrap md:text-[clamp(4.1rem,9vw,12rem)] md:leading-[0.8]">
            <span className="block md:inline">{firstName}</span>
            {lastName ? (
              <>
                <span className="hidden md:inline"> </span>
                <span className="block md:inline">{lastName}</span>
              </>
            ) : null}
          </h1>
          <div className="mt-4 flex w-full justify-center md:absolute md:inset-x-0 md:top-[14%] md:z-10 md:mt-0">
            <CylinderGallery items={items} />
          </div>
        </div>
        <div className="pointer-events-none hidden md:block md:h-[min(22vw,280px)]" aria-hidden />
        <AboutTeaser />
      </div>
    </section>
  );
}

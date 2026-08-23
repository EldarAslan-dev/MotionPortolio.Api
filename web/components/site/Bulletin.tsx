"use client";

import { LazyVideo } from "@/components/motion/LazyVideo";
import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { Story } from "@/lib/types";

const MONTHS = [
  "YAN",
  "FEV",
  "MAR",
  "APR",
  "MAY",
  "İYN",
  "İYL",
  "AVQ",
  "SEN",
  "OKT",
  "NOY",
  "DEK",
];

function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function isVideo(story: Story): boolean {
  return story.mediaType === "video" || story.mediaUrl.toLowerCase().endsWith(".mp4");
}

export function Bulletin() {
  const { profile, liveStories, setStoryIndex } = useStudio();
  const pinned =
    profile?.showAnnouncement && profile.announcementText?.trim()
      ? profile.announcementText.trim()
      : "";

  if (!pinned && liveStories.length === 0) {
    return (
      <div
        id="updates"
        className="mt-12 border-t border-line pt-8"
      >
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mist">
          Duyuru
        </p>
        <p className="mt-3 text-sm text-mist">Hazırda yeni duyuru yoxdur.</p>
      </div>
    );
  }

  return (
    <div id="updates" className="mt-12 border-t border-line pt-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mist">
            Studiya lövhəsi
          </p>
          <p className="mt-1 font-display text-2xl italic text-bone md:text-3xl">
            Duyuru
          </p>
        </div>
        {liveStories.length > 0 ? (
          <span className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-cue">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cue opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cue" />
            </span>
            Canlı
          </span>
        ) : null}
      </div>

      <div className="divide-y divide-line border-y border-line">
        {pinned ? (
          <div className="flex gap-4 py-5 md:gap-8">
            <span className="w-14 shrink-0 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-cue md:w-16">
              Pin
            </span>
            <p className="text-sm leading-relaxed text-bone md:text-base">{pinned}</p>
          </div>
        ) : null}

        {liveStories.map((story, i) => (
          <button
            key={story.id}
            type="button"
            data-cursor="view"
            data-cursor-label="BAX"
            onClick={() => setStoryIndex(i)}
            className="group flex w-full items-center gap-4 py-5 text-left md:gap-8"
          >
            <span className="w-14 shrink-0 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-mist md:w-16">
              {stamp(story.createdAt)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-xl italic text-bone transition group-hover:text-cue md:text-2xl">
                {story.title || "Yeni paylaşım"}
              </span>
              <span className="mt-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-mist">
                {isVideo(story) ? "Video" : "Kadr"} · 24 saat
              </span>
            </span>
            <span className="relative h-12 w-12 shrink-0 overflow-hidden border border-line bg-surface md:h-14 md:w-14">
              {isVideo(story) ? (
                <LazyVideo
                  src={mediaUrl(story.mediaUrl)}
                  hoverToPlay
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(story.mediaUrl)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80"
                />
              )}
            </span>
            <span className="hidden font-mono-tech text-xs text-mist transition group-hover:translate-x-1 group-hover:text-bone sm:inline">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

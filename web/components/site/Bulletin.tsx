"use client";

import { LazyVideo } from "@/components/motion/LazyVideo";
import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { Story } from "@/lib/types";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function isVideo(story: Story): boolean {
  return story.mediaType === "video" || story.mediaUrl.toLowerCase().endsWith(".mp4");
}

export function Bulletin() {
  const { liveStories, setStoryIndex } = useStudio();
  if (liveStories.length === 0) return null;

  return (
    <section id="updates" className="scroll-mt-28 border-t border-line px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[720px]">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mist">Studio board</p>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {liveStories.map((story, i) => (
            <button
              key={story.id}
              type="button"
              data-cursor="view"
              data-cursor-label="VIEW"
              onClick={() => setStoryIndex(i)}
              className="group flex w-full items-center gap-4 py-5 text-left md:gap-8"
            >
              <span className="w-14 shrink-0 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-mist md:w-16">
                {stamp(story.createdAt)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-xl text-bone md:text-2xl">
                  {story.title || "New post"}
                </span>
              </span>
              <span className="relative h-12 w-12 shrink-0 overflow-hidden bg-surface md:h-14 md:w-14">
                {isVideo(story) ? (
                  <LazyVideo src={mediaUrl(story.mediaUrl)} hoverToPlay className="h-full w-full object-cover opacity-80" />
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
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

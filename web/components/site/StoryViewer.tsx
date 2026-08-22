"use client";

import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";

export function StoryViewer() {
  const {
    currentStory,
    liveStories,
    storyIndex,
    setStoryIndex,
    storyProgress,
    avatar,
    name,
  } = useStudio();

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-void/90 p-6"
      onClick={() => setStoryIndex(null)}
    >
      <div
        className="w-full max-w-sm overflow-hidden border border-line bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex gap-1">
          {liveStories.map((_, i) => (
            <div key={i} className="story-bar">
              <div
                className="story-bar-fill"
                style={{
                  width:
                    i < (storyIndex ?? 0)
                      ? "100%"
                      : i === storyIndex
                        ? `${storyProgress * 100}%`
                        : "0%",
                  transition: i === storyIndex ? "none" : "width 0.2s",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mb-3 flex items-center gap-2">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : null}
          <span className="font-mono-tech text-sm text-bone">{name}</span>
        </div>
        {currentStory.mediaType === "video" || currentStory.mediaUrl.endsWith(".mp4") ? (
          <video
            src={mediaUrl(currentStory.mediaUrl)}
            autoPlay
            muted
            controls
            className="w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(currentStory.mediaUrl)} alt="" className="w-full" />
        )}
        <div className="mt-3 flex justify-between font-mono-tech text-xs uppercase tracking-[0.15em] text-bone">
          <button
            type="button"
            data-cursor="link"
            onClick={() => setStoryIndex((i: number | null) => (i && i > 0 ? i - 1 : 0))}
          >
            Əvvəl
          </button>
          <button
            type="button"
            data-cursor="link"
            onClick={() =>
              setStoryIndex((i: number | null) =>
                i === null || i >= liveStories.length - 1 ? null : i + 1,
              )
            }
          >
            Növbəti
          </button>
        </div>
      </div>
    </div>
  );
}

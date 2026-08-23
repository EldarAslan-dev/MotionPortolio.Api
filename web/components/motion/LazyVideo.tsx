"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted/looping background video that only fetches its source and plays
 * once it's near the viewport, and pauses again once it scrolls away —
 * keeps pages with several full-bleed project videos (the Work stack,
 * next-project teasers) from downloading/decoding all of them at once.
 *
 * When `hoverToPlay` is set, playback on pointer devices is driven by
 * hover instead of scroll visibility (a silent preview that starts on
 * mouse-enter and stops on mouse-leave) — the source itself still only
 * loads once the element is near the viewport. Touch devices (no real
 * hover) fall back to the normal visibility-based autoplay.
 */
export function LazyVideo({
  src,
  className,
  poster,
  hoverToPlay = false,
}: {
  src: string;
  className?: string;
  poster?: string;
  hoverToPlay?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    setSupportsHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const hoverMode = hoverToPlay && supportsHover;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = !!entries[0]?.isIntersecting;
        setInView((prev) => prev || visible);
        if (hoverMode) return;
        if (visible) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "60% 0px 60% 0px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hoverMode]);

  useEffect(() => {
    if (!hoverMode) return;
    const el = ref.current;
    if (!el) return;
    if (hovering) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [hovering, hoverMode]);

  return (
    <div
      className="h-full w-full"
      onMouseEnter={hoverMode ? () => setHovering(true) : undefined}
      onMouseLeave={hoverMode ? () => setHovering(false) : undefined}
    >
      <video
        ref={ref}
        src={inView ? src : undefined}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className={className}
      />
    </div>
  );
}

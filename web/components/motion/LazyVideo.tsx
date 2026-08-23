"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted/looping background video that only fetches its source and plays
 * once it's near the viewport, and pauses again once it scrolls away.
 *
 * Observe the wrapper (not the video): an unloaded <video> has 0 height, so
 * IntersectionObserver never fires and the source never attaches.
 *
 * `eager` loads and plays immediately — used for the hero reel.
 * `hoverToPlay` plays on hover (touch falls back to visibility autoplay).
 */
export function LazyVideo({
  src,
  className,
  poster,
  hoverToPlay = false,
  eager = false,
}: {
  src: string;
  className?: string;
  poster?: string;
  hoverToPlay?: boolean;
  eager?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(eager);
  const [hovering, setHovering] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    setSupportsHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const hoverMode = hoverToPlay && supportsHover;

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = ref.current;
    if (!wrap) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = !!entries[0]?.isIntersecting;
        setInView((prev) => prev || visible || eager);
        if (hoverMode || !el) return;
        if (visible || eager) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "80% 0px 80% 0px", threshold: 0.01 },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [hoverMode, eager]);

  useEffect(() => {
    if (eager) {
      ref.current?.play().catch(() => {});
    }
  }, [eager, inView, src]);

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
      ref={wrapRef}
      className="relative h-full w-full"
      onMouseEnter={hoverMode ? () => setHovering(true) : undefined}
      onMouseLeave={hoverMode ? () => setHovering(false) : undefined}
    >
      <video
        ref={ref}
        src={inView || eager ? src : undefined}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay={eager}
        preload={eager ? "auto" : "none"}
        className={className}
      />
    </div>
  );
}

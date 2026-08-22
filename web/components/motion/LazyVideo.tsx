"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted/looping background video that only fetches its source and plays
 * once it's near the viewport, and pauses again once it scrolls away —
 * keeps pages with several full-bleed project videos (the Work stack,
 * next-project teasers) from downloading/decoding all of them at once.
 */
export function LazyVideo({
  src,
  className,
  poster,
}: {
  src: string;
  className?: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = !!entries[0]?.isIntersecting;
        setInView((prev) => prev || visible);
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
  }, []);

  return (
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
  );
}

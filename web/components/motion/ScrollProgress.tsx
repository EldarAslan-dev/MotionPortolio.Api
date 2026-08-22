"use client";

import { useEffect, useRef } from "react";

/** The fixed top "playhead" line — fills with `cue` as the page scrolls. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      if (ref.current) {
        ref.current.style.transform = `scaleX(${progress})`;
      }
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className="progress-line" aria-hidden="true" />;
}

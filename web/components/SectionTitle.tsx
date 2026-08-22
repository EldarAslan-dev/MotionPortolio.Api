"use client";

import { useEffect, useRef } from "react";

/**
 * Big display heading with a stroked outline that fills in with solid
 * color as it scrolls into the center of the viewport — mirrors the
 * "stroke -> fill" reveal used for About / Services / Projects / Reviews
 * titles on the original site.
 */
export function SectionTitle({
  children,
  light = false,
  className = "",
}: {
  children: string;
  light?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let current = 0;
    function update() {
      const wrap = wrapRef.current;
      const fill = fillRef.current;
      if (wrap && fill) {
        const rect = wrap.getBoundingClientRect();
        const vh = window.innerHeight;
        const target = Math.min(
          1,
          Math.max(0, (vh - rect.top) / (vh * 0.65)),
        );
        current += (target - current) * 0.08;
        fill.style.opacity = String(Math.pow(current, 3));
      }
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Unified dark graphite canvas: default stroke is a faint warm-ivory
  // outline (reads against graphite/panel backgrounds); the `light`
  // variant swaps in a faint electric-cobalt outline for accent headings.
  const strokeColor = light
    ? "rgba(91,97,230,0.45)"
    : "rgba(245,242,234,0.5)";

  return (
    <div
      ref={wrapRef}
      className={`relative inline-grid font-display leading-[0.95] ${className}`}
    >
      <span
        className="col-start-1 row-start-1 select-none"
        style={{ color: "transparent", WebkitTextStroke: `1.4px ${strokeColor}` }}
      >
        {children}
      </span>
      <span
        ref={fillRef}
        className="col-start-1 row-start-1 select-none"
        style={{ opacity: 0 }}
      >
        {children}
      </span>
    </div>
  );
}

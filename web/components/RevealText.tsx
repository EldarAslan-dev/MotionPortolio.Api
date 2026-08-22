"use client";

import { useEffect, useRef } from "react";

/**
 * Splits `text` into per-character spans and fades each one in as the
 * viewport scrolls past it — the same "typewriter reveal" effect the
 * original site used for the About paragraph and service descriptions.
 */
export function RevealText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "span";
}) {
  const ref = useRef<HTMLParagraphElement | HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-ch]"));
    if (spans.length === 0) return;

    let raf = 0;
    function update() {
      const rect = el!.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (vh * 0.9 - rect.top) / (vh * 0.55 + rect.height)),
      );
      const revealCount = Math.round(progress * spans.length);
      spans.forEach((span, i) => {
        span.style.opacity = i < revealCount ? "1" : "0.14";
      });
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <Tag ref={ref as never} className={className}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          data-ch
          style={{ opacity: 0.14, transition: "opacity 0.18s linear" }}
        >
          {ch}
        </span>
      ))}
    </Tag>
  );
}

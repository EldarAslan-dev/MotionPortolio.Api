"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl } from "@/lib/config";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { GalleryItem } from "@/lib/types";

function padItems(items: GalleryItem[], min = 8): GalleryItem[] {
  if (items.length === 0) return [];
  const out = [...items];
  let i = 0;
  while (out.length < min) {
    out.push(items[i % items.length]);
    i += 1;
  }
  return out;
}

function useCylinderMetrics(count: number) {
  const [m, setM] = useState({ w: 180, r: 220 });

  useEffect(() => {
    const compute = () => {
      const mobile = window.innerWidth < 768;
      const w = mobile ? 132 : 180;
      const r = Math.round(w / 2 / Math.tan(Math.PI / Math.max(count, 8)));
      setM({ w, r });
    };
    compute();
    window.addEventListener("resize", compute, { passive: true });
    return () => window.removeEventListener("resize", compute);
  }, [count]);

  return m;
}

function Slide({ item }: { item: GalleryItem }) {
  const src = mediaUrl(item.url);
  if (item.type === "video") {
    return (
      <video
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="h-full w-full object-cover object-center"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-full w-full object-cover object-center" />;
}

export function CylinderGallery({
  items,
  className = "",
  scrollLinked = true,
}: {
  items: GalleryItem[];
  className?: string;
  scrollLinked?: boolean;
}) {
  const reduced = useReducedMotion();
  const rigRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => padItems(items, 8), [items]);
  const count = Math.max(slides.length, 1);
  const metrics = useCylinderMetrics(Math.max(slides.length, 6));

  useEffect(() => {
    if (!scrollLinked || reduced) return;
    const el = rigRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.setProperty("--cyl-scroll", `${window.scrollY * 0.12}deg`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollLinked, reduced]);

  if (reduced) {
    return (
      <div className={`cyl-fallback ${className}`}>
        {(slides.length ? slides : [null, null, null]).slice(0, 4).map((item, i) => (
          <div key={i} className="cyl-fallback-card">
            {item ? <Slide item={item} /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={`cyl-scene ${className}`}>
        <div
          ref={rigRef}
          className="cyl-rig"
          style={{
            width: metrics.w,
            ["--cyl-r" as string]: `${metrics.r}px`,
          }}
        >
          <div className="cyl-spin">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="cyl-item cyl-item-empty"
                style={{ ["--a" as string]: `${i * 60}deg` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const step = 360 / count;

  return (
    <div className={`cyl-scene ${className}`}>
      <div
        ref={rigRef}
        className="cyl-rig"
        style={{
            width: metrics.w,
            ["--cyl-r" as string]: `${metrics.r}px`,
          }}
      >
        <div className="cyl-spin">
          {slides.map((item, i) => (
            <div
              key={`${item.url}-${i}`}
              className="cyl-item"
              style={{ ["--a" as string]: `${i * step}deg` }}
            >
              <Slide item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

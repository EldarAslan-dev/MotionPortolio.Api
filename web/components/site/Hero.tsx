"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isVideoMedia, mediaUrl, parseHeroGallery } from "@/lib/config";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";

export function Hero() {
  const { profile } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const headline = design.headline;
  const deckRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState(0.36);
  const cards = useMemo(() => parseHeroGallery(profile?.heroGalleryJson), [profile?.heroGalleryJson]);
  const mid = (Math.max(cards.length, 1) - 1) / 2;
  const maxW = Math.max(250, ...cards.map((item) => item.width || 250));
  const maxH = Math.max(350, ...cards.map((item) => item.height || 350));

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const apply = () => {
      const vw = window.innerWidth;
      if (vw > 700) {
        setFit(1);
        return;
      }
      const room = Math.max(200, vw - 32) / 2;
      const spread = Math.round(maxW * 0.53);
      const edge = maxW / 2 + spread * 0.96;
      setFit(Math.min(0.5, Math.max(0.24, room / edge)));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [maxW]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || !window.matchMedia("(pointer:fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = deck.getBoundingClientRect();
      const ry = -((e.clientY - r.top) / r.height - 0.5) * 9;
      const rx = ((e.clientX - r.left) / r.width - 0.5) * 9;
      deck.style.transform = `rotateX(${ry}deg) rotateY(${rx}deg)`;
    };
    const onLeave = () => {
      deck.style.transform = "";
    };
    deck.addEventListener("mousemove", onMove);
    deck.addEventListener("mouseleave", onLeave);
    return () => {
      deck.removeEventListener("mousemove", onMove);
      deck.removeEventListener("mouseleave", onLeave);
    };
  }, [cards.length]);

  return (
    <section id="hero" className="pub-wrap relative z-[1] pb-10 pt-12 text-center">
      <span id="top" className="sr-only" />
      <h1
        className="mx-auto mb-5 max-w-[960px] font-extrabold leading-[1.02] tracking-[-0.045em]"
        style={{ fontSize: `clamp(32px, 7.6vw, ${design.headlineSize}px)` }}
        aria-label={headline}
      >
        {headline.split(" ").map((word, i) => (
          <span key={`${word}-${i}`}>
            {i > 0 ? " " : null}
            <span className="wd" aria-hidden="true">
              <span className="gt" style={{ ["--d" as string]: `${150 + i * 90}ms` }}>
                {word}
              </span>
            </span>
          </span>
        ))}
      </h1>
      <p className="mx-auto max-w-[520px] text-[rgb(var(--mist))]" style={{ fontSize: `clamp(15px, 4.2vw, ${design.sublineSize}px)` }}>
        {design.subline}
      </p>
      <div
        ref={deckRef}
        className={`deck ${open ? "in" : ""}`}
        style={{
          ["--mid" as string]: mid,
          ["--deck-h" as string]: maxH + 100,
          ["--spread" as string]: Math.round(maxW * 0.53),
          ["--fit" as string]: fit,
        }}
      >
        {cards.map((item, i) => {
          const video = isVideoMedia(item);
          const image = mediaUrl(video ? item.posterUrl || "" : item.url);
          return (
            <div
              key={`${item.url}-${i}`}
              className="deck-card"
              style={{
                ["--i" as string]: i,
                ["--card-w" as string]: item.width || 250,
                ["--card-h" as string]: item.height || 350,
                ["--card-r" as string]: item.radius ?? 24,
                ["--card-fit" as string]: item.fit === "contain" ? "contain" : "cover",
              }}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" />
              ) : video ? (
                <video src={mediaUrl(item.url)} muted playsInline autoPlay loop />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <a href="#work" className="gold-btn">
          {design.exploreLabel}
        </a>
        <a href="#contact" className="ghost-btn">
          {design.touchLabel}
        </a>
      </div>
    </section>
  );
}

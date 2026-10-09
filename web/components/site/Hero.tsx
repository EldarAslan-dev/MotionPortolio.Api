"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { isVideoMedia, mediaUrl, parseHeroGallery } from "@/lib/config";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";

function fanBox(cards: { width?: number; height?: number }[]) {
  const list = cards.length ? cards : [{ width: 250, height: 350 }];
  const mid = (list.length - 1) / 2;
  const maxW = Math.max(...list.map((card) => card.width || 250));
  const spread = Math.round(maxW * 0.53);
  let halfW = 1;
  let above = 1;
  let below = 1;
  list.forEach((card, index) => {
    const w = card.width || 250;
    const h = card.height || 350;
    const o = index - mid;
    const tx = Math.abs(o) * spread;
    const ty = o * o * 14;
    const ang = Math.abs(o) * 6.5 * (Math.PI / 180);
    const cos = Math.abs(Math.cos(ang));
    const sin = Math.abs(Math.sin(ang));
    const hw = (w / 2) * cos + (h / 2) * sin;
    const hh = (w / 2) * sin + (h / 2) * cos;
    halfW = Math.max(halfW, tx + hw + 10);
    above = Math.max(above, hh + ty + 24);
    below = Math.max(below, hh + ty + 24);
  });
  return { width: halfW * 2, height: Math.ceil((above + below) * 1.28), spread };
}

export function Hero() {
  const { profile } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const headline = design.headline;
  const deckRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState(1);
  const cards = useMemo(() => parseHeroGallery(profile?.heroGalleryJson), [profile?.heroGalleryJson]);
  const mid = (Math.max(cards.length, 1) - 1) / 2;
  const fan = useMemo(() => fanBox(cards), [cards]);

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  useLayoutEffect(() => {
    const apply = () => {
      const room = Math.min(1120, window.innerWidth - (window.innerWidth > 700 ? 48 : 28));
      setFit(Math.min(1, room / fan.width));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [fan.width]);

  useLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck || !open) return;
    const grow = () => {
      const boxes = [...deck.querySelectorAll(".deck-card")];
      if (!boxes.length) return;
      let minTop = Infinity;
      let maxBottom = -Infinity;
      boxes.forEach((node) => {
        const box = node.getBoundingClientRect();
        minTop = Math.min(minTop, box.top);
        maxBottom = Math.max(maxBottom, box.bottom);
      });
      const need = Math.ceil(maxBottom - minTop + 36);
      if (need > deck.getBoundingClientRect().height + 1) deck.style.height = `${need}px`;
    };
    grow();
    const id = window.setTimeout(grow, 1100);
    return () => window.clearTimeout(id);
  }, [fit, open, cards.length, fan.height]);

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
          ["--deck-h" as string]: fan.height,
          ["--spread" as string]: fan.spread,
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

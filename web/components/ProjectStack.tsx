"use client";

import { useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/config";
import type { Project } from "@/lib/types";

/**
 * The pinned card-stack effect from the original site: each project card
 * is absolutely positioned and pinned to the viewport while the next one
 * slides up from below, peeling the previous one back to a small "peek"
 * bar. Falls back to a simple sticky stack on touch devices.
 */
export function ProjectStack({
  projects,
  onOrder,
}: {
  projects: Project[];
  onOrder: (title: string) => void;
}) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects.length === 0) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const stack = stackRef.current;
      if (!stack) return;
      const cards = Array.from(
        stack.querySelectorAll<HTMLElement>(".project-stack-item"),
      );
      if (cards.length < 2) {
        cards.forEach((c) => gsap.set(c, { clearProps: "all" }));
        return;
      }

      const isTouch = window.matchMedia(
        "(hover: none) and (pointer: coarse)",
      ).matches;

      if (isTouch) {
        stack.style.height = "auto";
        cards.forEach((card, i) => {
          card.style.position = "sticky";
          card.style.top = `${20 + i * 20}px`;
          card.style.paddingBottom = i === cards.length - 1 ? "0px" : "90px";
        });
        return;
      }

      const PEEK = 84;
      const heights = cards.map((c) => c.offsetHeight);
      const maxH = Math.max(...heights);
      stack.style.height = `${maxH + PEEK * (cards.length - 1)}px`;
      const restY = cards.map((_, i) => PEEK * i);

      cards.forEach((card, i) => {
        gsap.set(card, {
          zIndex: i + 1,
          force3D: true,
          y: i === 0 ? restY[0] : window.innerHeight,
        });
      });

      const tl = gsap.timeline({ defaults: { ease: "none", force3D: true } });
      for (let i = 1; i < cards.length; i++) {
        tl.to(cards[i], { y: restY[i], duration: 1 }, i - 1);
      }

      const trigger = ScrollTrigger.create({
        trigger: stack,
        start: "top top+=88",
        end: () => `+=${window.innerHeight * (cards.length - 1)}`,
        scrub: 0.6,
        pin: true,
        pinType: "transform",
        anticipatePin: 1,
        animation: tl,
        invalidateOnRefresh: true,
      });

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      cleanup = () => {
        trigger.kill();
        tl.kill();
        window.removeEventListener("resize", onResize);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [projects]);

  if (projects.length === 0) {
    return <p className="text-white/40">Hələ layihə yayımlanmayıb.</p>;
  }

  return (
    <div ref={stackRef} className="relative mx-auto max-w-3xl">
      {projects.map((p, i) => (
        <article
          key={p.id}
          className="project-stack-item absolute left-0 top-0 w-full will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="film-frame overflow-hidden rounded-2xl bg-[#0e0c09]">
            <div className="flex items-center gap-4 border-b border-white/10 bg-gradient-to-r from-[#241c14] to-[#120f0b] px-5 py-4">
              <span className="font-display text-3xl text-white/90">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-soft">
                  {p.category}
                </p>
                <h3 className="truncate text-lg font-medium text-white">
                  {p.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOrder(p.title)}
                className="shrink-0 rounded-full border border-white/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-ink"
              >
                Sifariş
              </button>
            </div>
            <div className="relative aspect-video max-h-[70vh] bg-black">
              <video
                src={mediaUrl(p.videoUrl)}
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-relaxed text-white/60">
                {p.description}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

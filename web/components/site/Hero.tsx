"use client";

import { useEffect, useRef } from "react";
import { MaskLines, MaskReveal } from "@/components/motion/MaskReveal";
import { useFinePointer } from "@/lib/useFinePointer";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";

export function Hero() {
  const { ready, name, bio, profile, projects, openInquiry } = useStudio();
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const rawHero =
    profile?.heroVideoUrl ||
    (profile as { HeroVideoUrl?: string } | null)?.HeroVideoUrl ||
    projects[0]?.videoUrl ||
    "";
  const bgVideo = rawHero ? mediaUrl(rawHero) : "";

  useEffect(() => {
    if (!fine || reduced || !bgVideo) return;
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const loop = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      layer.style.transform = `scale(1.08) translate3d(${current.x * -10}px, ${current.y * -10}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    stage.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      stage.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced, bgVideo]);

  const nameWords = name.split(" ").filter(Boolean);

  return (
    <section
      id="top"
      ref={stageRef}
      className="hero-stage relative flex min-h-[100svh] flex-col overflow-hidden bg-void"
    >
      <div ref={layerRef} className="absolute inset-0 z-0 will-change-transform">
        {bgVideo ? (
          <video
            key={bgVideo}
            src={bgVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-void/20 via-void/10 to-void/85" />
      <div className="hero-fade-bottom" />
      <div className="grain" />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-6 pt-28 sm:px-6 md:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col">
          <MaskReveal
            as="p"
            trigger="mount"
            className="mb-5 md:mb-6"
            innerClassName="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.3em] text-mist md:text-[11px]"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cue" />
              REC — MOTION REEL
            </span>
          </MaskReveal>

          {ready ? (
            <MaskLines
              as="h1"
              trigger="mount"
              stagger={90}
              lineClassName="block"
              innerClassName="font-display text-[clamp(2.4rem,12vw,9rem)] italic leading-[0.92] text-bone [word-break:break-word]"
              lines={nameWords}
            />
          ) : (
            <div className="space-y-3">
              <div className="h-[10vw] w-2/3 animate-pulse bg-bone/10 md:h-[7vw]" />
            </div>
          )}

          {ready ? (
            <MaskReveal
              as="p"
              trigger="mount"
              delay={280}
              className="mt-6 max-w-lg md:mt-8"
              innerClassName="text-[15px] leading-relaxed text-mist md:text-lg"
            >
              {bio}
            </MaskReveal>
          ) : null}

          <div className="mt-8 flex flex-col items-stretch gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            <button
              type="button"
              data-cursor="link"
              onClick={() => openInquiry("Ümumi əməkdaşlıq")}
              className="btn-glow group inline-flex items-center justify-center gap-3 rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue sm:justify-start"
            >
              Layihə başlat
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a
              href="#work"
              data-cursor="link"
              className="group inline-flex items-center justify-center gap-2 font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition hover:text-bone sm:justify-start"
            >
              İşlərə bax
              <span className="h-px w-6 bg-mist transition-all group-hover:w-10 group-hover:bg-bone" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pb-6 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mist sm:px-6 md:px-10 md:pb-8">
        <span>Bakı, Azərbaycan</span>
        <span className="hidden items-center gap-2 sm:flex">
          Scroll
          <span className="h-6 w-px bg-mist" />
        </span>
      </div>
    </section>
  );
}

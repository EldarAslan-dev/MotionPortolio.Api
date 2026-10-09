"use client";

import { useEffect, useRef } from "react";
import { mediaUrl, projectPoster } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Full-bleed cinematic banner built from the top project's own cover media — no hardcoded asset. */
export function FeatureReel() {
  const { ready, projects } = useStudio();
  const reduced = useReducedMotion();
  const featured = projects[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!featured || reduced) return;
    videoRef.current?.play().catch(() => {});
  }, [featured, reduced]);

  if (!ready || !featured) return null;

  const poster = mediaUrl(projectPoster(featured));
  const video = !reduced ? mediaUrl(featured.videoUrl) : "";

  return (
    <section className="relative overflow-hidden border-t border-line">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] md:aspect-[21/9]">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {video ? (
          <video
            ref={videoRef}
            src={video}
            muted
            loop
            playsInline
            autoPlay
            poster={poster || undefined}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <h2 className="font-hero max-w-3xl text-[clamp(1.9rem,5.6vw,4.2rem)] leading-[1.05] text-white">
            We don&apos;t just animate.
            <br />
            We make brands move.
          </h2>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Wires up Lenis inertia scrolling synced to GSAP's ticker + ScrollTrigger.
 * Renders nothing — it only owns the scroll side-effect for its subtree's page.
 * No-ops entirely when the user prefers reduced motion (native scroll stays).
 */
export function SmoothScrollProvider() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reducedMotion || coarse) return;
    let lenis: import("lenis").default | null = null;
    let tickerFn: ((time: number) => void) | null = null;
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
      });

      lenis.on("scroll", ScrollTrigger.update);

      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    })();

    return () => {
      cancelled = true;
      if (tickerFn) {
        import("gsap").then(({ default: gsap }) => {
          if (tickerFn) gsap.ticker.remove(tickerFn);
        });
      }
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return null;
}

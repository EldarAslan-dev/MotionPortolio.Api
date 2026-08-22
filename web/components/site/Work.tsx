"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { mediaUrl } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { Project } from "@/lib/types";

/**
 * The centerpiece "pin and peel" mechanic (same GSAP ScrollTrigger approach
 * as the retired ProjectStack) but with all card chrome stripped: full-bleed
 * media, a lower-third title/category reveal, and a mono index counter.
 * Each frame now opens the dedicated /work/[id] case-study page.
 */
function WorkStack({ projects }: { projects: Project[] }) {
  const stackRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        stack.querySelectorAll<HTMLElement>(".work-stack-item"),
      );
      if (cards.length < 2) {
        cards.forEach((c) => gsap.set(c, { clearProps: "all" }));
        return;
      }

      const isTouch = window.matchMedia(
        "(hover: none) and (pointer: coarse)",
      ).matches;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (isTouch || reduced) {
        stack.style.height = "auto";
        cards.forEach((card, i) => {
          card.style.position = "sticky";
          card.style.top = `${16 + i * 16}px`;
          card.style.paddingBottom = i === cards.length - 1 ? "0px" : "64px";
        });
        return;
      }

      const PEEK = 96;
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

  function goTo(id: number, e: React.MouseEvent) {
    e.preventDefault();
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => router.push(`/work/${id}`));
    } else {
      router.push(`/work/${id}`);
    }
  }

  return (
    <div ref={stackRef} className="relative mx-auto max-w-[1600px]">
      {projects.map((p, i) => (
        <article
          key={p.id}
          className="work-stack-item absolute left-0 top-0 w-full will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          <a
            href={`/work/${p.id}`}
            onClick={(e) => goTo(p.id, e)}
            data-cursor="view"
            data-cursor-label="BAX"
            className="group relative block h-[70vh] w-full overflow-hidden bg-surface md:h-[82vh]"
          >
            <LazyVideo
              src={mediaUrl(p.videoUrl)}
              poster={mediaUrl(p.thumbnailUrl) || undefined}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-void/40" />

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-6 md:p-10">
              <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-bone/80">
                {p.category}
              </span>
              <span className="font-mono-tech text-xs tracking-[0.2em] text-bone/80">
                {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 md:p-10">
              <h3 className="font-display text-4xl italic text-bone md:text-6xl">
                {p.title}
              </h3>
              <p className="mt-3 max-w-md text-sm text-mist opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {p.description}
              </p>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}

export function Work() {
  const { ready, projects } = useStudio();

  return (
    <section id="work" className="border-t border-line py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex items-end justify-between gap-6">
          <MaskReveal innerClassName="block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
            03 — İşlər
          </MaskReveal>
          <MaskReveal
            as="p"
            className="hidden max-w-xs text-right md:block"
            innerClassName="text-sm text-mist"
          >
            Hər iş öz nisbətində göstərilir — kəsilmədən, şişirdilmədən.
          </MaskReveal>
        </div>
      </div>

      <div className="mt-12">
        {!ready ? (
          <div className="mx-auto max-w-[1600px] space-y-4 px-5 md:px-10">
            {[0, 1].map((i) => (
              <div key={i} className="aspect-video animate-pulse bg-surface" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="px-5 text-mist md:px-10">Hələ layihə yayımlanmayıb.</p>
        ) : (
          <WorkStack projects={projects} />
        )}
      </div>
    </section>
  );
}

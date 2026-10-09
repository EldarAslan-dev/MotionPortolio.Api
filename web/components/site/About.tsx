"use client";

import { useEffect, useRef } from "react";
import { ABOUT_BODY } from "@/lib/site/copy";
import { resolveTools } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";

export function About() {
  const { ready, aboutPhoto, profile, name } = useStudio();
  const body = profile?.aboutBody?.trim() || ABOUT_BODY;
  const words = body.split(/\s+/).filter(Boolean);
  const tools = resolveTools(profile?.toolsJson);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nodes = [...el.querySelectorAll<HTMLElement>(".w")];
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.25)));
      nodes.forEach((node, i) => node.classList.toggle("on", i / nodes.length < p * 1.08));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [body]);

  return (
    <section id="about" className="pub-sec relative z-[1]">
      <div className="pub-wrap about-grid rise">
        <div className="about-photo">
          {ready && aboutPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={aboutPhoto} alt="" />
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            <b className="block text-2xl">{ready ? name : "Bilgeyis Mirzazada"}</b>
            <small>Motion Designer &amp; Art Director</small>
          </div>
        </div>
        <div>
          <p ref={ref} className="manifesto">
            {words.map((word, i) => (
              <span key={`${word}-${i}`} className="w">
                {word}{" "}
              </span>
            ))}
          </p>
          {tools.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <span key={tool.id} className="rounded-full border border-[var(--bd)] bg-[var(--sf)] px-3.5 py-1.5 text-sm">
                  {tool.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

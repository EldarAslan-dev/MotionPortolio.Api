"use client";

import { createElement, useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Tag = "div" | "span" | "h1" | "h2" | "h3" | "p";

type MaskRevealProps = {
  children: React.ReactNode;
  as?: Tag;
  className?: string;
  innerClassName?: string;
  /** "scroll" reveals once the line enters the viewport; "mount" reveals immediately (used for the hero's entrance). */
  trigger?: "scroll" | "mount";
  /** Extra delay in ms before this line's reveal starts — used to stagger a stack of MaskReveal lines. */
  delay?: number;
  duration?: number;
};

/**
 * A single masked line: an overflow-hidden wrapper with an inner span that
 * slides up from below its own box while fading in. This is the one reveal
 * primitive used everywhere in the new design (nav, hero, headings, body
 * copy) — no per-character typewriter gimmick, just a clean editorial wipe.
 */
export function MaskReveal({
  children,
  as = "div",
  className = "",
  innerClassName = "",
  trigger = "scroll",
  delay = 0,
  duration = 0.9,
}: MaskRevealProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  // A stable object reference so that if this component re-renders for an
  // unrelated reason (e.g. a parent subscribed to fast-changing context),
  // React's style reconciliation bails out (same reference in, same
  // reference out) instead of stomping GSAP's live animated values back
  // to this initial hidden state.
  const initialStyle = useRef<React.CSSProperties>({
    opacity: 0,
    transform: "translateY(110%)",
  }).current;

  useEffect(() => {
    const inner = innerRef.current;
    const wrap = wrapRef.current;
    if (!inner || !wrap) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function reveal() {
      if (cancelled) return;
      const { default: gsap } = await import("gsap");
      if (cancelled) return;
      if (reduced) {
        gsap.set(inner, { opacity: 1, yPercent: 0 });
        return;
      }
      gsap.to(inner, {
        yPercent: 0,
        opacity: 1,
        duration,
        ease: "power3.out",
        delay: delay / 1000,
      });
    }

    if (trigger === "mount") {
      timeoutId = setTimeout(reveal, 0);
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            reveal();
            observer?.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
      );
      observer.observe(wrap);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [trigger, delay, duration, reduced]);

  return createElement(
    as,
    { ref: wrapRef, className: `reveal-line ${className}` },
    <span ref={innerRef} className={innerClassName} style={initialStyle}>
      {children}
    </span>,
  );
}

/** A stack of MaskReveal lines with an automatic per-line stagger. */
export function MaskLines({
  lines,
  as = "div",
  lineClassName = "",
  innerClassName = "",
  trigger = "scroll",
  stagger = 70,
}: {
  lines: string[];
  as?: Tag;
  lineClassName?: string;
  innerClassName?: string;
  trigger?: "scroll" | "mount";
  stagger?: number;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <MaskReveal
          key={`${line}-${i}`}
          as={as}
          className={lineClassName}
          innerClassName={innerClassName}
          trigger={trigger}
          delay={i * stagger}
        >
          {line}
        </MaskReveal>
      ))}
    </>
  );
}

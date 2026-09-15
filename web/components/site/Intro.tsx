"use client";

import { useEffect, useRef } from "react";
import { useStudio } from "@/lib/site/StudioContext";
import { useReducedMotion } from "@/lib/useReducedMotion";

const FILL_MS = 1250;
const DOOR_HOLD_MS = 380;
const OPEN_MS = 1400;
const READY_FALLBACK_MS = 5000;

export function Intro() {
  const { ready } = useStudio();
  const reduced = useReducedMotion();
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro-pending")) return;

    const started = Number(html.getAttribute("data-intro-at") || Date.now());
    const fillWait = reduced ? 0 : Math.max(0, FILL_MS - (Date.now() - started));

    let revealed = false;
    let poll = 0;
    let fallbackTimer = 0;
    let holdTimer = 0;
    let openTimer = 0;

    const finish = () => {
      html.classList.remove("intro-pending");
      html.classList.remove("intro-opening");
      html.removeAttribute("data-intro-at");
    };

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      window.clearInterval(poll);
      window.clearTimeout(fallbackTimer);
      const screen = document.getElementById("site-intro");
      if (reduced) {
        finish();
        return;
      }
      screen?.classList.add("is-door");
      holdTimer = window.setTimeout(() => {
        screen?.classList.add("is-open");
        html.classList.add("intro-opening");
        const opts: KeyframeAnimationOptions = {
          duration: OPEN_MS,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          fill: "forwards",
        };
        screen?.querySelector(".intro-door-l")?.animate(
          [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-108deg)" }],
          opts,
        );
        screen?.querySelector(".intro-door-r")?.animate(
          [{ transform: "rotateY(0deg)" }, { transform: "rotateY(108deg)" }],
          opts,
        );
        openTimer = window.setTimeout(finish, OPEN_MS);
      }, DOOR_HOLD_MS);
    };

    const fillTimer = window.setTimeout(() => {
      if (readyRef.current) {
        reveal();
        return;
      }
      poll = window.setInterval(() => {
        if (readyRef.current) reveal();
      }, 50);
      fallbackTimer = window.setTimeout(reveal, READY_FALLBACK_MS);
    }, fillWait);

    return () => {
      window.clearTimeout(fillTimer);
      window.clearInterval(poll);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(openTimer);
    };
  }, [reduced]);

  return null;
}

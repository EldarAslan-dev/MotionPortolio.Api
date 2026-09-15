"use client";

import { useEffect, useRef } from "react";
import { useStudio } from "@/lib/site/StudioContext";
import { useReducedMotion } from "@/lib/useReducedMotion";

const FILL_MS = 1250;
const HOLD_MS = 280;
const LIFT_MS = 900;
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
    let liftTimer = 0;

    const finish = () => {
      html.classList.remove("intro-pending");
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
      holdTimer = window.setTimeout(() => {
        screen?.classList.add("is-open");
        liftTimer = window.setTimeout(finish, LIFT_MS);
      }, HOLD_MS);
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
      window.clearTimeout(liftTimer);
    };
  }, [reduced]);

  return null;
}

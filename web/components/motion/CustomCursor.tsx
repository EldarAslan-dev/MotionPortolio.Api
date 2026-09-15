"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer } from "@/lib/useFinePointer";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Mode = "default" | "link" | "view";

/**
 * Small dot + lerped ring. Reads data-cursor="link" / "view" (with an
 * optional data-cursor-label) off any ancestor element to morph. Never
 * mounts on touch/coarse-pointer devices — the OS cursor is untouched there.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("default");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("has-custom-cursor");

    const lerpFactor = reduced ? 1 : 0.18;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    let raf = 0;

    function onMove(e: MouseEvent) {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
    }
    function onOver(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.(
        "[data-cursor]",
      ) as HTMLElement | null;
      if (el) {
        const kind = el.getAttribute("data-cursor") === "view" ? "view" : "link";
        setMode(kind);
        setLabel(el.getAttribute("data-cursor-label") || (kind === "view" ? "VIEW" : ""));
      }
    }
    function onOut(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      if (el) {
        setMode("default");
        setLabel("");
      }
    }
    function onLeave() {
      setMode("default");
      setLabel("");
    }

    function loop() {
      ring.x += (pos.x - ring.x) * lerpFactor;
      ring.y += (pos.y - ring.y) * lerpFactor;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  if (!fine) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div
        ref={ringRef}
        className={`cursor-ring ${mode === "view" ? "is-view" : mode === "link" ? "is-link" : ""}`}
      >
        {mode === "view" ? label || "BAX" : null}
      </div>
    </>
  );
}

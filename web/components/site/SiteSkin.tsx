"use client";

import { useEffect } from "react";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";

export function SiteSkin() {
  const { profile } = useStudio();
  const raw = profile?.siteDesignJson;

  useEffect(() => {
    const design = parseDesign(raw);
    if (!design.colorsOn) return;
    const root = document.documentElement;
    const prev = {
      bg: document.body.style.backgroundColor,
      color: document.body.style.color,
    };
    root.style.setProperty("--g1", design.accent);
    root.style.setProperty("--g2", design.accent2);
    root.style.setProperty("--g3", design.accent);
    root.style.setProperty(
      "--hero-text",
      design.gradient
        ? `linear-gradient(${design.gradientAngle}deg, ${design.text} 0%, ${design.accent} 42%, ${design.accent2} 78%)`
        : design.text,
    );
    document.body.style.backgroundColor = design.bg;
    document.body.style.color = design.text;
    return () => {
      root.style.removeProperty("--g1");
      root.style.removeProperty("--g2");
      root.style.removeProperty("--g3");
      root.style.removeProperty("--hero-text");
      document.body.style.backgroundColor = prev.bg;
      document.body.style.color = prev.color;
    };
  }, [raw]);

  return null;
}

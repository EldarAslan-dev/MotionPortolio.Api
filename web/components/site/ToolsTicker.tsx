"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { mediaUrl, resolveTools } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { ToolItem } from "@/lib/types";

const PX_PER_SEC = 48;

function ToolMark({ tool }: { tool: ToolItem }) {
  if (tool.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(tool.logoUrl)}
        alt={tool.name || ""}
        className="h-4 w-auto max-w-[4.2rem] object-contain opacity-90 sm:h-[18px] sm:max-w-[5rem]"
      />
    );
  }
  return <span className="whitespace-nowrap">{tool.name}</span>;
}

function ToolRow({
  tools,
  measureRef,
}: {
  tools: ToolItem[];
  measureRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={measureRef} className="flex shrink-0 items-center">
      {tools.map((tool) => (
        <span key={tool.id} className="flex items-center">
          <ToolMark tool={tool} />
          <span className="tool-even" aria-hidden>
            <svg viewBox="0 0 12 12" width="0.42em" height="0.42em" aria-hidden>
              <path fill="currentColor" d="M6 0.4 7.15 4.85 11.6 6 7.15 7.15 6 11.6 4.85 7.15 0.4 6 4.85 4.85Z" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}

export function ToolsTicker() {
  const { profile } = useStudio();
  const tools = resolveTools(profile?.toolsJson);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(4);
  const [duration, setDuration] = useState(28);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const measure = measureRef.current;
    if (!scroller || !measure || tools.length === 0) return;

    const update = () => {
      const unit = measure.scrollWidth;
      const view = scroller.clientWidth;
      if (unit < 8) return;
      const pairs = Math.max(1, Math.ceil((view + 1) / unit));
      const nextCopies = pairs * 2;
      setCopies(nextCopies);
      setDuration(Math.max(12, (pairs * unit) / PX_PER_SEC));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    ro.observe(measure);
    const images = Array.from(measure.querySelectorAll("img"));
    images.forEach((img) => img.addEventListener("load", update));
    return () => {
      ro.disconnect();
      images.forEach((img) => img.removeEventListener("load", update));
    };
  }, [tools]);

  if (tools.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      className="pub-mq relative z-[1]"
    >
      <div
        className="marquee-run flex w-max items-center"
        style={{ animationDuration: `${duration}s` }}
      >
        {Array.from({ length: copies }, (_, copy) => (
          <ToolRow
            key={copy}
            tools={tools}
            measureRef={copy === 0 ? measureRef : undefined}
          />
        ))}
      </div>
    </div>
  );
}

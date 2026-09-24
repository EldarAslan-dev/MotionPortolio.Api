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
        className="h-5 w-auto max-w-[5.5rem] object-contain opacity-90 sm:h-6 sm:max-w-[6.5rem] md:h-7 md:max-w-[7.5rem]"
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
        <span
          key={tool.id}
          className="flex items-center gap-4 px-4 sm:gap-6 sm:px-5 md:gap-8 md:px-6"
        >
          <ToolMark tool={tool} />
          <span className="h-1 w-1 shrink-0 rounded-full bg-mist" />
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
      className="overflow-hidden border-y border-line py-3 sm:py-4 md:py-5"
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

"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/config";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";
import type { ClientLogo } from "@/lib/types";

function plateFor(img: HTMLImageElement) {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let onInk = 0;
  let onPaper = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.2) continue;
    const y = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    onInk += Math.abs(y - 0.12) * alpha;
    onPaper += Math.abs(y - 0.96) * alpha;
  }
  if (onInk + onPaper === 0) return "";
  return onInk >= onPaper ? "plate-ink" : "plate-paper";
}

function ClientCard({ logo }: { logo: ClientLogo }) {
  const src = logo.logoUrl ? mediaUrl(logo.logoUrl) : "";
  const [plate, setPlate] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const measure = (img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    try {
      const next = plateFor(img);
      if (next) setPlate(next);
    } catch {
      /* Şəkil oxunmasa çərçivə əvvəlki fonda qalır. */
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) measure(img);
  }, [src]);

  return (
    <div className={`cc${plate ? ` ${plate}` : ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={(event) => measure(event.currentTarget)}
        />
      ) : (
        <b className="text-xl">{logo.name.slice(0, 1)}</b>
      )}
      {logo.name ? <b className="text-[13px]">{logo.name}</b> : null}
    </div>
  );
}

export function Clients() {
  const { clientLogos, profile } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const logos = (clientLogos ?? []).filter((logo) => logo.logoUrl || logo.name);

  return (
    <section id="clients" className="pub-sec relative z-[1] pt-0">
      <div className="pub-wrap">
        <span className="pub-lab mb-7" style={{ fontSize: `clamp(22px, 6vw, ${design.clientsSize}px)` }}>
          {design.clientsLabel}
        </span>
        <div className="client-cards">
          {logos.map((logo) => (
            <ClientCard key={logo.id} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/config";

export function ClientFace({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const letter = (name || "?").trim().slice(0, 1).toUpperCase();
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(src)}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="client-face" style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}>
      {letter}
    </span>
  );
}

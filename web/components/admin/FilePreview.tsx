"use client";

import { useEffect, useState } from "react";

export function FilePreview({
  file,
  square = false,
  showQualityBadge = false,
}: {
  file: File | null;
  square?: boolean;
  showQualityBadge?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [ratio, setRatio] = useState<string>(square ? "1 / 1" : "16 / 9");
  const [info, setInfo] = useState<string>("");
  const [lowRes, setLowRes] = useState(false);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file || !url) return null;
  const isVideo = file.type.startsWith("video");
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-line bg-void">
      <div
        className="flex items-center justify-center overflow-hidden bg-void"
        style={{ aspectRatio: ratio, maxHeight: 320 }}
      >
        {isVideo ? (
          <video
            src={url}
            muted
            playsInline
            controls
            className="h-full w-full object-contain"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setRatio(`${v.videoWidth} / ${v.videoHeight}`);
                setInfo(`${v.videoWidth}×${v.videoHeight} px · ${sizeMb} MB`);
                setLowRes(v.videoWidth < 1280 || v.videoHeight < 720);
              }
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full object-contain"
            onLoad={(e) => {
              const img = e.currentTarget;
              setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
              setInfo(`${img.naturalWidth}×${img.naturalHeight} px · ${sizeMb} MB`);
            }}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 font-mono text-[11px] text-mist">
        <span>{info || "—"}</span>
        {showQualityBadge && isVideo && info ? (
          <span
            className={`rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold ${
              lowRes ? "text-mist" : "text-bone"
            }`}
          >
            {lowRes ? "Aşağı rezolyusiya" : "Keyfiyyət uyğundur"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

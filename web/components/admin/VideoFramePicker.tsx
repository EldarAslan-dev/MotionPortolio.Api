"use client";

import { useEffect, useRef, useState } from "react";
import { adminBtn } from "@/components/admin/ui";
import { snapshotVideo } from "@/lib/capturePoster";

export function VideoFramePicker({
  src,
  time,
  onFrame,
}: {
  src: string;
  time: number;
  onFrame: (time: number, blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [pending, setPending] = useState<{ time: number; blob: Blob; preview: string } | null>(null);

  useEffect(() => {
    return () => {
      if (pending?.preview) URL.revokeObjectURL(pending.preview);
    };
  }, [pending?.preview]);

  return (
    <div className="mt-3 space-y-2">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="w-full rounded-xl border border-line bg-void"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration || 0);
          const start = time > 0 ? time : Math.min(0.2, (v.duration || 1) * 0.05);
          try {
            v.currentTime = start;
          } catch {
            /* ignore */
          }
        }}
        onSeeked={async (e) => {
          const video = e.currentTarget;
          const time = video.currentTime;
          const blob = await snapshotVideo(video);
          if (!blob) return;
          setPending((prev) => {
            if (prev?.preview) URL.revokeObjectURL(prev.preview);
            return { time, blob, preview: URL.createObjectURL(blob) };
          });
        }}
      />
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.05}
        value={Math.min(pending?.time ?? time, duration || 0)}
        onChange={(e) => {
          const v = videoRef.current;
          const next = Number(e.target.value);
          if (v) v.currentTime = next;
        }}
        className="w-full accent-bone"
      />
      {pending ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pending.preview} alt="" className="max-h-40 w-full object-contain" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!pending}
          onClick={() => pending && onFrame(pending.time, pending.blob)}
          className={adminBtn}
        >
          Bu kadrı kapak et
        </button>
        <p className="text-xs text-mist">
          Videonu sürüşdür, kadrı gör, sonra təsdiqlə.
          {duration > 0 ? ` ${(pending?.time ?? time).toFixed(1)}s / ${duration.toFixed(1)}s` : ""}
        </p>
      </div>
    </div>
  );
}

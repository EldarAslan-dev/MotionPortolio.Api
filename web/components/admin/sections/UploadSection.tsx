"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AdminCard,
  AdminField,
  AdminFilePick,
  adminBtn,
  adminBtnGhost,
  adminFieldClass,
} from "@/components/admin/ui";
import { api } from "@/lib/api";
import { capturePosterFromFile, snapshotVideo, blobToPosterFile } from "@/lib/capturePoster";
import type { GalleryItem, Project } from "@/lib/types";

type MediaItem = {
  id: string;
  file: File;
  kind: "image" | "video";
  url: string;
  posterBlob?: Blob | null;
  posterPreview?: string;
};

type Cover =
  | { mode: "media"; id: string }
  | { mode: "frame"; id: string; time: number; blob: Blob; preview: string }
  | { mode: "file"; file: File; url: string };

const MEDIA_ACCEPT = "image/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";

function isVideoFile(file: File) {
  return file.type.startsWith("video") || /\.(mp4|mov|webm)$/i.test(file.name);
}

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
          const blob = await snapshotVideo(e.currentTarget);
          if (!blob) return;
          setPending((prev) => {
            if (prev?.preview) URL.revokeObjectURL(prev.preview);
            return { time: e.currentTarget.currentTime, blob, preview: URL.createObjectURL(blob) };
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

export function UploadSection({
  token,
  onUploaded,
  onToast,
}: {
  token: string;
  onUploaded: () => void;
  onToast: (msg: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cover, setCover] = useState<Cover | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const coverRef = useRef(cover);
  coverRef.current = cover;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.url);
        if (item.posterPreview) URL.revokeObjectURL(item.posterPreview);
      });
      const c = coverRef.current;
      if (c?.mode === "file") URL.revokeObjectURL(c.url);
      if (c?.mode === "frame" && c.preview) URL.revokeObjectURL(c.preview);
    };
  }, []);

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const next: MediaItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      kind: isVideoFile(file) ? ("video" as const) : ("image" as const),
      url: URL.createObjectURL(file),
    }));
    setItems((prev) => [...prev, ...next]);
    const firstVideo = next.find((item) => item.kind === "video");
    if (firstVideo) {
      setCover((prev) => prev ?? { mode: "frame", id: firstVideo.id, time: 0, blob: new Blob(), preview: "" });
    }
    for (const item of next) {
      if (item.kind !== "video") continue;
      void capturePosterFromFile(item.file).then((blob) => {
        if (!blob) return;
        const preview = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((entry) => {
            if (entry.id !== item.id) return entry;
            if (entry.posterPreview) URL.revokeObjectURL(entry.posterPreview);
            return { ...entry, posterBlob: blob, posterPreview: preview };
          }),
        );
      });
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
        if (item.posterPreview) URL.revokeObjectURL(item.posterPreview);
      }
      return prev.filter((entry) => entry.id !== id);
    });
    setCover((prev) => {
      if (!prev) return prev;
      if ((prev.mode === "media" || prev.mode === "frame") && prev.id === id) return null;
      return prev;
    });
  }

  function setCustomCover(file: File | undefined) {
    setCover((prev) => {
      if (prev?.mode === "file") URL.revokeObjectURL(prev.url);
      if (!file) return prev?.mode === "file" ? null : prev;
      return { mode: "file", file, url: URL.createObjectURL(file) };
    });
  }

  function pickMediaCover(item: MediaItem) {
    if (item.kind === "image") {
      setCover((prev) => {
        if (prev?.mode === "file") URL.revokeObjectURL(prev.url);
        if (prev?.mode === "frame" && prev.preview) URL.revokeObjectURL(prev.preview);
        return { mode: "media", id: item.id };
      });
      return;
    }
    setCover((prev) => {
      if (prev?.mode === "frame" && prev.id === item.id) return prev;
      if (prev?.mode === "frame" && prev.preview) URL.revokeObjectURL(prev.preview);
      return { mode: "frame", id: item.id, time: 0, blob: new Blob(), preview: "" };
    });
  }

  function resetMedia() {
    items.forEach((item) => {
      URL.revokeObjectURL(item.url);
      if (item.posterPreview) URL.revokeObjectURL(item.posterPreview);
    });
    if (cover?.mode === "file") URL.revokeObjectURL(cover.url);
    if (cover?.mode === "frame" && cover.preview) URL.revokeObjectURL(cover.preview);
    setItems([]);
    setCover(null);
  }

  function clearCover() {
    setCover((prev) => {
      if (prev?.mode === "file") URL.revokeObjectURL(prev.url);
      if (prev?.mode === "frame" && prev.preview) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }

  function coverImageSrc() {
    if (!cover) return "";
    if (cover.mode === "file") return cover.url;
    if (cover.mode === "media") return items.find((item) => item.id === cover.id)?.url || "";
    if (cover.mode === "frame") return cover.preview;
    return "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      onToast("Ən azı bir şəkil və ya video seçin.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const uploaded: { id: string; url: string; type: "image" | "video"; posterUrl?: string }[] = [];
      for (const item of items) {
        const posterPromise =
          item.kind === "video"
            ? item.posterBlob && item.posterBlob.size > 0
              ? Promise.resolve(item.posterBlob)
              : capturePosterFromFile(item.file)
            : Promise.resolve(null);
        const [res, posterBlob] = await Promise.all([api.upload(item.file, token), posterPromise]);
        if (!res.ok) throw new Error("Fayl yüklənə bilmədi.");
        const data = await res.json();
        if (!data?.url) continue;
        let posterUrl = "";
        if (posterBlob) {
          const posterRes = await api.upload(blobToPosterFile(posterBlob), token);
          if (posterRes.ok) {
            const posterData = await posterRes.json();
            posterUrl = posterData?.url || "";
          }
        }
        uploaded.push({
          id: item.id,
          url: data.url,
          type: item.kind,
          ...(posterUrl ? { posterUrl } : {}),
        });
      }
      if (uploaded.length === 0) throw new Error("Fayl yüklənə bilmədi.");

      const galleryItems: GalleryItem[] = uploaded.map((item) => ({
        url: item.url,
        type: item.type,
        ...(item.posterUrl ? { posterUrl: item.posterUrl } : {}),
      }));
      const firstVideo = uploaded.find((item) => item.type === "video");
      const firstImage = uploaded.find((item) => item.type === "image");

      let cardImageUrl = "";
      if (cover?.mode === "file") {
        const res = await api.upload(cover.file, token);
        if (res.ok) {
          const data = await res.json();
          cardImageUrl = data.url || "";
        }
      } else if (cover?.mode === "media") {
        cardImageUrl = uploaded.find((item) => item.id === cover.id)?.url || "";
      } else if (cover?.mode === "frame") {
        let blob: Blob | null = cover.blob.size > 0 ? cover.blob : null;
        if (!blob) {
          const source = items.find((item) => item.id === cover.id);
          if (source) blob = await capturePosterFromFile(source.file);
        }
        if (blob) {
          const posterFile = blobToPosterFile(blob, "cover.jpg");
          const res = await api.upload(posterFile, token);
          if (res.ok) {
            const data = await res.json();
            cardImageUrl = data.url || "";
          }
        }
      }
      if (!cardImageUrl) {
        cardImageUrl =
          firstImage?.url || firstVideo?.posterUrl || uploaded.find((item) => item.posterUrl)?.posterUrl || "";
      }

      const payload: Partial<Project> = {
        title: String(form.get("title") || ""),
        category: "",
        videoUrl: firstVideo?.url || "",
        description: String(form.get("description") || ""),
        thumbnailUrl: cardImageUrl,
        cardImageUrl,
        year: String(form.get("year") || "") || null,
        processNotes: String(form.get("processNotes") || "") || null,
        galleryJson: JSON.stringify(galleryItems),
      };

      const res = await api.createProject(payload, token);
      if (res.ok) {
        onToast("Yeni iş vitrinə əlavə edildi.");
        (e.target as HTMLFormElement).reset();
        resetMedia();
        onUploaded();
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  }

  const frameItem = cover?.mode === "frame" ? items.find((item) => item.id === cover.id) : null;
  const imageCoverSrc = coverImageSrc();

  return (
    <AdminCard
      title="Yeni iş"
      hint="İstədiyin qədər şəkil və video seç. Sonra kapak üçün şəkil, video kadrı və ya yeni şəkil seçə bilərsən."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AdminField label="Layihə başlığı">
          <input
            name="title"
            required
            placeholder="Məs: Cyberpunk 3D Commercial"
            className={adminFieldClass}
          />
        </AdminField>

        <AdminField label="Şəkil / video">
          <AdminFilePick
            id="upload-media"
            label={items.length === 0 ? "Fayl seç" : "Əlavə et"}
            accept={MEDIA_ACCEPT}
            multiple
            filename={items.length > 0 ? `${items.length} fayl` : undefined}
            onChange={addFiles}
          />
          {items.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((item) => {
                const selected =
                  (cover?.mode === "media" && cover.id === item.id) ||
                  (cover?.mode === "frame" && cover.id === item.id);
                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => pickMediaCover(item)}
                      className={`block aspect-square w-full overflow-hidden rounded-xl border bg-void ${
                        selected ? "border-bone" : "border-line"
                      }`}
                    >
                      {item.kind === "video" ? (
                        item.posterPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.posterPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <video
                            src={item.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                    {selected ? (
                      <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-bone px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-void">
                        Kapak
                      </span>
                    ) : item.kind === "video" ? (
                      <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-void/80 px-1.5 py-0.5 text-[9px] uppercase text-bone">
                        Video
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-bone text-[10px] text-void"
                      aria-label="Sil"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </AdminField>

        {items.length > 0 ? (
          <div className="rounded-2xl border border-line bg-void p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Kapak (opsional)</p>
            <p className="mt-1 text-sm text-mist">
              Videonu sürüşdürüb kadr seç, &quot;Bu kadrı kapak et&quot; ilə təsdiqlə. İstəsən ayrı şəkil də yüklə.
            </p>
            {imageCoverSrc ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageCoverSrc} alt="" className="max-h-48 w-full object-contain" />
                {cover?.mode === "frame" && cover.blob.size > 0 ? (
                  <p className="px-3 py-2 text-xs text-mist">Kapak təsdiqləndi.</p>
                ) : null}
              </div>
            ) : null}
            {frameItem && cover?.mode === "frame" ? (
              <VideoFramePicker
                key={frameItem.id}
                src={frameItem.url}
                time={cover.time}
                onFrame={(time, blob) =>
                  setCover((prev) => {
                    if (prev?.mode === "frame" && prev.preview) URL.revokeObjectURL(prev.preview);
                    return { mode: "frame", id: frameItem.id, time, blob, preview: URL.createObjectURL(blob) };
                  })
                }
              />
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AdminFilePick
                id="upload-cover"
                label="Yeni kapak şəkli"
                accept="image/*"
                filename={cover?.mode === "file" ? cover.file.name : undefined}
                onChange={(files) => setCustomCover(files[0])}
              />
              {cover ? (
                <button type="button" onClick={clearCover} className={adminBtnGhost}>
                  Kapakı sil
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <AdminField label="Layihə haqqında">
          <textarea
            name="description"
            rows={2}
            required
            placeholder="Cinema4D, After Effects..."
            className={adminFieldClass}
          />
        </AdminField>
        <AdminField label="İl (opsional)">
          <input name="year" placeholder="Məs: 2026" className={adminFieldClass} />
        </AdminField>
        <AdminField label="Proses qeydləri (opsional)">
          <textarea
            name="processNotes"
            rows={3}
            placeholder="İş prosesi haqqında ətraflı qeydlər..."
            className={adminFieldClass}
          />
        </AdminField>
        <button type="submit" disabled={submitting} className={`${adminBtn} w-full`}>
          {submitting ? "Yüklənir…" : "Vitrinə paylaş"}
        </button>
      </form>
    </AdminCard>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { AdminCard, AdminFilePick, adminBtn, adminBtnQuiet } from "@/components/admin/ui";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { blobToPosterFile, capturePosterFromFile } from "@/lib/capturePoster";
import { isVideoMedia, mediaUrl, parseHeroGallery } from "@/lib/config";
import type { GalleryItem, StudioProfile } from "@/lib/types";

type CardShape = { width: number; height: number; radius: number; fit: "cover" | "contain" };

function shapeOf(item: GalleryItem): CardShape {
  return {
    width: item.width || 250,
    height: item.height || 350,
    radius: item.radius ?? 24,
    fit: item.fit === "contain" ? "contain" : "cover",
  };
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,.png,.jpg,.jpeg,.webp,.gif,.avif";
const MEDIA_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm`;

function mediaTypeOf(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (/\.(mp4|mov|webm)$/i.test(file.name)) return "video";
  return "image";
}

/** Admin-only: media for the public homepage hero flower animation. */
export function HeroGallerySection({
  profile,
  token,
  onSaveProfile,
  onToast,
}: {
  profile: StudioProfile;
  token: string;
  onSaveProfile: (patch: Partial<StudioProfile>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [shapes, setShapes] = useState<Record<string, CardShape>>({});
  const [savingUrl, setSavingUrl] = useState("");
  const heroItems = parseHeroGallery(profile.heroGalleryJson);

  function shapeFor(item: GalleryItem) {
    return shapes[item.url] || shapeOf(item);
  }

  function editShape(item: GalleryItem, patch: Partial<CardShape>) {
    setShapes((prev) => ({ ...prev, [item.url]: { ...(prev[item.url] || shapeOf(item)), ...patch } }));
  }

  async function saveShape(item: GalleryItem) {
    const shape = shapeFor(item);
    const next = heroItems.map((entry) => (entry.url === item.url ? { ...entry, ...shape } : entry));
    setSavingUrl(item.url);
    try {
      await onSaveProfile({ heroGalleryJson: JSON.stringify(next) });
      onToast("Hero size saved.");
    } finally {
      setSavingUrl("");
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const res = await api.upload(file, token);
    if (!res.ok) {
      let msg = "Fayl yüklənmədi. Çıxış edib yenidən daxil olun.";
      try {
        const data = await res.json();
        if (data?.message) msg = String(data.message);
      } catch {
        /* ignore */
      }
      onToast(msg);
      return null;
    }
    const data = await res.json();
    return data?.url || null;
  }

  async function onAddHeroImage(e: FormEvent) {
    e.preventDefault();
    if (heroFiles.length === 0) return;
    if (heroItems.length >= 4) {
      onToast("Hero-da maksimum 4 media ola bilər.");
      return;
    }
    setHeroUploading(true);
    try {
      const next = [...heroItems];
      let added = 0;
      for (const file of heroFiles) {
        const url = await uploadImage(file);
        if (url) {
          if (next.length >= 4) break;
          const item: { url: string; type: "image" | "video"; posterUrl?: string } = {
            url,
            type: mediaTypeOf(file),
          };
          if (item.type === "video") {
            const poster = await capturePosterFromFile(file);
            if (poster) {
              const posterUrl = await uploadImage(blobToPosterFile(poster));
              if (posterUrl) item.posterUrl = posterUrl;
            }
          }
          next.push(item);
          added += 1;
        }
      }
      if (added === 0) return;
      await onSaveProfile({ heroGalleryJson: JSON.stringify(next) });
      setHeroFiles([]);
      onToast(added === 1 ? "Hero-ya media əlavə olundu!" : `${added} media əlavə olundu!`);
    } finally {
      setHeroUploading(false);
    }
  }

  async function onRemoveHeroImage(url: string) {
    const next = heroItems.filter((item) => item.url !== url);
    await onSaveProfile({ heroGalleryJson: JSON.stringify(next) });
    onToast("Hero-dan silindi.");
  }

  return (
    <AdminCard
      title={t("sec.hero")}
      hint="Homepage hero cards, up to 4. Width, height, corner, and fit are what visitors see."
    >
      <div className="mb-4 space-y-4">
        {heroItems.length === 0 ? (
          <p className="text-sm text-mist">No media yet. Add an image or a video.</p>
        ) : (
          heroItems.map((item, i) => {
            const shape = shapeFor(item);
            const scale = 150 / shape.width;
            const video = isVideoMedia(item);
            const image = mediaUrl(video ? item.posterUrl || "" : item.url);
            return (
              <div key={`${item.url}-${i}`} className="flex flex-col gap-4 rounded-2xl border border-line bg-void p-3 sm:flex-row">
                <div className="flex w-[170px] shrink-0 items-center justify-center">
                  <div
                    className="overflow-hidden border border-line bg-black"
                    style={{
                      width: Math.round(shape.width * scale),
                      height: Math.round(shape.height * scale),
                      borderRadius: Math.round(shape.radius * scale),
                    }}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full" style={{ objectFit: shape.fit }} />
                    ) : (
                      <video src={mediaUrl(item.url)} muted playsInline className="h-full w-full" style={{ objectFit: shape.fit }} />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-mist">{video ? "Video" : `Image ${i + 1}`}</span>
                    <button type="button" onClick={() => onRemoveHeroImage(item.url)} className="text-sm text-mist">Remove</button>
                  </div>
                  <label className="block text-sm">
                    <span className="mb-1 flex justify-between text-mist"><span>Width</span><span>{shape.width}px</span></span>
                    <input type="range" min={100} max={480} value={shape.width} onChange={(e) => editShape(item, { width: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 flex justify-between text-mist"><span>Height</span><span>{shape.height}px</span></span>
                    <input type="range" min={120} max={620} value={shape.height} onChange={(e) => editShape(item, { height: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 flex justify-between text-mist"><span>Corner</span><span>{shape.radius}px</span></span>
                    <input type="range" min={0} max={160} value={shape.radius} onChange={(e) => editShape(item, { radius: Number(e.target.value) })} className="w-full" />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => editShape(item, { fit: "cover" })} className={`${adminBtnQuiet} ${shape.fit === "cover" ? "border-[#e8c46a] text-bone" : ""}`}>Fill the frame</button>
                    <button type="button" onClick={() => editShape(item, { fit: "contain" })} className={`${adminBtnQuiet} ${shape.fit === "contain" ? "border-[#e8c46a] text-bone" : ""}`}>Show the whole image</button>
                    <button type="button" disabled={savingUrl === item.url} onClick={() => saveShape(item)} className={adminBtn}>
                      {savingUrl === item.url ? "Saving…" : "Save size"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onAddHeroImage} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminFilePick
          id="hero-gallery"
          label={
            heroFiles.length === 0
              ? "Şəkil / video seç"
              : heroFiles.length === 1
                ? "Dəyiş"
                : `${heroFiles.length} fayl`
          }
          accept={MEDIA_ACCEPT}
          multiple
          filename={
            heroFiles.length === 1
              ? heroFiles[0].name
              : heroFiles.length > 1
                ? `${heroFiles.length} fayl`
                : undefined
          }
          onChange={setHeroFiles}
        />
        <button type="submit" disabled={heroFiles.length === 0 || heroUploading || heroItems.length >= 4} className={adminBtn}>
          {heroItems.length >= 4 ? "Maksimum 4" : heroUploading ? "Yüklənir…" : "Hero-ya əlavə et"}
        </button>
      </form>
    </AdminCard>
  );
}

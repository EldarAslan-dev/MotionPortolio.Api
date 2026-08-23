"use client";

import { FormEvent, useState } from "react";
import { FilePreview } from "@/components/admin/FilePreview";
import { api } from "@/lib/api";
import type { GalleryItem, Project } from "@/lib/types";

const CATEGORIES = [
  "3D Motion",
  "2D Explainer",
  "3D Commercial",
  "VFX & Simulation",
  "Logo Animation",
];

export function UploadSection({
  token,
  onUploaded,
  onToast,
}: {
  token: string;
  onUploaded: () => void;
  onToast: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function onGalleryFilesChange(files: FileList | null) {
    setGalleryFiles(files ? Array.from(files) : []);
  }

  function removeGalleryFile(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file && galleryFiles.length === 0) {
      alert("Ən azı bir video və ya şəkil seçin.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      let videoUrl = "";
      if (file) {
        const uploadRes = await api.upload(file);
        if (!uploadRes.ok) throw new Error("Video yüklənə bilmədi.");
        const uploaded = await uploadRes.json();
        videoUrl = uploaded.url;
      }

      const galleryItems: GalleryItem[] = [];
      for (const f of galleryFiles) {
        const res = await api.upload(f);
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            galleryItems.push({
              url: data.url,
              type: f.type.startsWith("video") ? "video" : "image",
            });
          }
        }
      }

      const payload: Partial<Project> = {
        title: String(form.get("title") || ""),
        category: String(form.get("category") || CATEGORIES[0]),
        videoUrl,
        description: String(form.get("description") || ""),
        thumbnailUrl: "",
        year: String(form.get("year") || "") || null,
        processNotes: String(form.get("processNotes") || "") || null,
      };
      if (galleryItems.length > 0) {
        payload.galleryJson = JSON.stringify(galleryItems);
      }

      const res = await api.createProject(payload, token);
      if (res.ok) {
        onToast("Yeni iş vitrinə əlavə edildi!");
        (e.target as HTMLFormElement).reset();
        setFile(null);
        setGalleryFiles([]);
        onUploaded();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">🎬 Yeni Animasiya Paylaş</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            Layihə Başlığı:
          </label>
          <input
            name="title"
            required
            placeholder="Məs: Cyberpunk 3D Commercial"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">Kateqoriya:</label>
          <select
            name="category"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            Əsas Video (opsional, .mp4, .mov):
          </label>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-neutral-300"
          />
          <FilePreview file={file} showQualityBadge />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            Əlavə Şəkil/Video (istənilən sayda — brendinq işləri üçün):
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime,video/webm"
            onChange={(e) => onGalleryFilesChange(e.target.files)}
            className="w-full text-sm text-neutral-300"
          />
          {galleryFiles.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {galleryFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black p-1 text-center"
                >
                  <span className="line-clamp-3 text-[9px] leading-tight text-neutral-300">
                    {f.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGalleryFile(i)}
                    className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-red-600 text-[10px] text-white"
                    aria-label="Sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            Layihə Haqqında Qeydlər:
          </label>
          <textarea
            name="description"
            rows={2}
            required
            placeholder="Cinema4D, After Effects..."
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            İl (opsional):
          </label>
          <input
            name="year"
            placeholder="Məs: 2026"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">
            Proses Qeydləri (opsional, case-study səhifəsində göstərilir):
          </label>
          <textarea
            name="processNotes"
            rows={3}
            placeholder="İş prosesi haqqında ətraflı qeydlər..."
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Yüklənir…" : "Vitrinə Paylaş"}
        </button>
      </form>
    </div>
  );
}

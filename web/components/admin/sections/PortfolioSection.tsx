"use client";

import { FormEvent, useEffect, useState } from "react";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { api } from "@/lib/api";
import { mediaUrl, parseGallery, projectCover } from "@/lib/config";
import type { GalleryItem, Project } from "@/lib/types";

const CATEGORIES = [
  "3D Motion",
  "2D Explainer",
  "3D Commercial",
  "VFX & Simulation",
  "Logo Animation",
];

function CoverThumb({ project }: { project: Project }) {
  const cover = projectCover(project);
  if (!cover) return null;
  if (cover.type === "video") {
    return (
      <LazyVideo
        src={mediaUrl(cover.url)}
        hoverToPlay
        className="h-full w-full object-contain"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaUrl(cover.url)} alt="" className="h-full w-full object-contain" />;
}

export function PortfolioSection({
  projects,
  token,
  onChanged,
  onToast,
}: {
  projects: Project[];
  token: string;
  onChanged: () => void;
  onToast: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    setGalleryItems(editing ? parseGallery(editing.galleryJson) : []);
  }, [editing]);

  async function onDelete(id: number) {
    if (!confirm("Layihəni silmək istəyirsiniz?")) return;
    const res = await api.deleteProject(id, token);
    if (res.ok) onChanged();
  }

  async function onGalleryFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const uploaded: GalleryItem[] = [];
      for (const file of Array.from(files)) {
        const res = await api.upload(file);
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            uploaded.push({ url: data.url, type: file.type.startsWith("video") ? "video" : "image" });
          }
        }
      }
      setGalleryItems((prev) => [...prev, ...uploaded]);
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryItem(url: string) {
    setGalleryItems((prev) => prev.filter((item) => item.url !== url));
  }

  async function onSaveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const res = await api.updateProject(
      editing.id,
      {
        title: String(form.get("title") || ""),
        category: String(form.get("category") || ""),
        description: String(form.get("description") || ""),
        year: String(form.get("year") || "") || null,
        processNotes: String(form.get("processNotes") || "") || null,
        galleryJson: JSON.stringify(galleryItems),
      },
      token,
    );
    if (res.ok) {
      onToast("Layihə yeniləndi!");
      setEditing(null);
      onChanged();
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-white">🎬 Mövcud Portfel İdarəsi</h2>

      {/* Mobile / tablet: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex gap-3 rounded-xl border border-white/10 bg-neutral-950 p-3 text-white"
          >
            <div className="flex h-[64px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
              <CoverThumb project={p} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.title}</div>
              <div className="text-xs text-indigo-300">{p.category}</div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Redaktə
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <th className="border-b border-white/10 px-3 py-2">Önizləmə</th>
              <th className="border-b border-white/10 px-3 py-2">Başlıq</th>
              <th className="border-b border-white/10 px-3 py-2">Kateqoriya</th>
              <th className="border-b border-white/10 px-3 py-2">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-white/5 text-white">
                <td className="px-3 py-3">
                  <div className="flex h-[70px] w-[110px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
                    <CoverThumb project={p} />
                  </div>
                </td>
                <td className="px-3 py-3 font-semibold">{p.title}</td>
                <td className="px-3 py-3 text-indigo-300">{p.category}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Redaktə
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h3 className="mb-4 text-lg font-bold text-white">✏️ Layihəni Redaktə Et</h3>
            <form onSubmit={onSaveEdit} className="space-y-3">
              <input
                name="title"
                defaultValue={editing.title}
                required
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <select
                name="category"
                defaultValue={editing.category || CATEGORIES[0]}
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                name="description"
                defaultValue={editing.description}
                rows={3}
                required
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <input
                name="year"
                defaultValue={editing.year || ""}
                placeholder="İl (opsional, məs: 2026)"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <textarea
                name="processNotes"
                defaultValue={editing.processNotes || ""}
                rows={3}
                placeholder="Proses qeydləri (opsional)"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />

              <div>
                <label className="mb-1 block font-mono text-xs text-neutral-400">
                  Qalereya (opsional, istənilən sayda şəkil/video):
                </label>
                {galleryItems.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {galleryItems.map((item) => (
                      <div key={item.url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-black">
                        {item.type === "video" ? (
                          <video
                            src={mediaUrl(item.url)}
                            muted
                            preload="metadata"
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(item.url)} alt="" className="h-full w-full object-cover" />
                        )}
                        {item.type === "video" ? (
                          <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] uppercase text-white">
                            Video
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(item.url)}
                          className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-red-600 text-xs text-white"
                          aria-label="Media sil"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/quicktime,video/webm"
                  disabled={galleryUploading}
                  onChange={(e) => onGalleryFilesSelected(e.target.files)}
                  className="w-full text-sm text-neutral-300"
                />
                {galleryUploading ? (
                  <p className="mt-1 font-mono text-[11px] text-neutral-500">Yüklənir…</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white"
                >
                  Yenilə
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

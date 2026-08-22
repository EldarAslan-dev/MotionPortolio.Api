"use client";

import { FormEvent, useState } from "react";
import { FilePreview } from "@/components/admin/FilePreview";
import { api } from "@/lib/api";

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
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      alert("Video seçin.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const uploadRes = await api.upload(file);
      if (!uploadRes.ok) throw new Error("Video yüklənə bilmədi.");
      const uploaded = await uploadRes.json();

      const res = await api.createProject(
        {
          title: String(form.get("title") || ""),
          category: String(form.get("category") || CATEGORIES[0]),
          videoUrl: uploaded.url,
          description: String(form.get("description") || ""),
          thumbnailUrl: "",
          year: String(form.get("year") || "") || null,
          processNotes: String(form.get("processNotes") || "") || null,
        },
        token,
      );
      if (res.ok) {
        onToast("Yeni iş vitrinə əlavə edildi!");
        (e.target as HTMLFormElement).reset();
        setFile(null);
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
            Video Faylını Seçin (.mp4, .mov):
          </label>
          <input
            type="file"
            required
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-neutral-300"
          />
          <FilePreview file={file} showQualityBadge />
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

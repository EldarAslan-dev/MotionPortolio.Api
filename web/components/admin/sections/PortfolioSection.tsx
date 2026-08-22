"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/config";
import type { Project } from "@/lib/types";

const CATEGORIES = [
  "3D Motion",
  "2D Explainer",
  "3D Commercial",
  "VFX & Simulation",
  "Logo Animation",
];

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

  async function onDelete(id: number) {
    if (!confirm("Layihəni silmək istəyirsiniz?")) return;
    const res = await api.deleteProject(id, token);
    if (res.ok) onChanged();
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
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">🎬 Mövcud Portfel İdarəsi</h2>
      <div className="overflow-x-auto">
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
                    {p.videoUrl ? (
                      <video
                        src={mediaUrl(p.videoUrl)}
                        muted
                        preload="metadata"
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    ) : null}
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

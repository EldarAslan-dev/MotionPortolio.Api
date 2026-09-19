"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AdminCard,
  AdminField,
  AdminFilePick,
  adminBtn,
  adminBtnGhost,
  adminBtnQuiet,
  adminFieldClass,
} from "@/components/admin/ui";
import { api } from "@/lib/api";
import { blobToPosterFile, capturePosterFromFile } from "@/lib/capturePoster";
import { mediaUrl, parseGallery, projectPoster } from "@/lib/config";
import type { GalleryItem, Project, ProjectComment } from "@/lib/types";

const CATEGORIES = [
  "3D Motion",
  "2D Explainer",
  "3D Commercial",
  "VFX & Simulation",
  "Logo Animation",
];

function CoverThumb({ project }: { project: Project }) {
  const poster = projectPoster(project);
  if (poster) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl(poster)} alt="" className="h-full w-full object-contain" />;
  }
  return <div className="h-full w-full bg-void" />;
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
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [cardUploading, setCardUploading] = useState(false);
  const [social, setSocial] = useState<Project | null>(null);
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [likesDraft, setLikesDraft] = useState("");

  useEffect(() => {
    setGalleryItems(editing ? parseGallery(editing.galleryJson) : []);
    setCardImageUrl(editing?.cardImageUrl || "");
  }, [editing]);

  useEffect(() => {
    if (!social) return;
    const next = projects.find((p) => p.id === social.id);
    if (next) {
      setSocial(next);
      setLikesDraft(String(next.likesCount || 0));
    }
  }, [projects, social?.id]);

  async function onDelete(id: number) {
    if (!confirm("Layihəni silmək istəyirsiniz?")) return;
    const res = await api.deleteProject(id, token);
    if (res.ok) onChanged();
  }

  async function onGalleryFilesSelected(files: File[]) {
    if (files.length === 0) return;
    setGalleryUploading(true);
    try {
      const uploaded: GalleryItem[] = [];
      for (const file of files) {
        const res = await api.upload(file);
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            const item: GalleryItem = {
              url: data.url,
              type: file.type.startsWith("video") || /\.(mp4|mov|webm)$/i.test(file.name) ? "video" : "image",
            };
            if (item.type === "video") {
              const poster = await capturePosterFromFile(file);
              if (poster) {
                const posterRes = await api.upload(blobToPosterFile(poster));
                if (posterRes.ok) {
                  const posterData = await posterRes.json();
                  if (posterData?.url) item.posterUrl = posterData.url;
                }
              }
            }
            uploaded.push(item);
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
    const still =
      cardImageUrl ||
      galleryItems.find((item) => item.type === "image")?.url ||
      galleryItems.find((item) => item.posterUrl)?.posterUrl ||
      "";
    const res = await api.updateProject(
      editing.id,
      {
        title: String(form.get("title") || ""),
        category: String(form.get("category") || ""),
        description: String(form.get("description") || ""),
        year: String(form.get("year") || "") || null,
        processNotes: String(form.get("processNotes") || "") || null,
        galleryJson: JSON.stringify(galleryItems),
        cardImageUrl: still,
        thumbnailUrl: still || editing.thumbnailUrl,
      },
      token,
    );
    if (res.ok) {
      onToast("Layihə yeniləndi.");
      setEditing(null);
      onChanged();
    }
  }

  function openSocial(p: Project) {
    setSocial(p);
    setLikesDraft(String(p.likesCount || 0));
    setAuthor("");
    setCommentText("");
  }

  async function saveLikes(count: number) {
    if (!social) return;
    const next = Math.max(0, count);
    const res = await api.setProjectLikes(social.id, next, token);
    if (res.ok) {
      setLikesDraft(String(next));
      onToast("Bəyənmə yeniləndi.");
      onChanged();
    }
  }

  async function addAdminComment(e: FormEvent) {
    e.preventDefault();
    if (!social) return;
    const name = author.trim();
    const content = commentText.trim();
    if (!name || !content) return;
    const res = await api.commentProject(social.id, { authorName: name, content });
    if (res.ok) {
      setAuthor("");
      setCommentText("");
      onToast("Şərh əlavə olundu.");
      onChanged();
    }
  }

  async function removeComment(commentId: number) {
    if (!social) return;
    if (!confirm("Bu şərhi silmək istəyirsiniz?")) return;
    const res = await api.deleteProjectComment(social.id, commentId, token);
    if (res.ok) {
      onToast("Şərh silindi.");
      onChanged();
    }
  }

  return (
    <AdminCard title="Portfel" hint="Mövcud işləri redaktə et və ya sil.">
      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist">Hələ iş yoxdur.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {projects.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-2xl border border-line bg-void p-3">
                <div className="flex h-[64px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                  <CoverThumb project={p} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-bone">{p.title}</div>
                  <div className="text-xs text-mist">{p.category}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditing(p)} className={adminBtnGhost}>
                      Redaktə
                    </button>
                    <button type="button" onClick={() => openSocial(p)} className={adminBtnGhost}>
                      Bəyənmə / şərh
                    </button>
                    <button type="button" onClick={() => onDelete(p.id)} className={adminBtnQuiet}>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-mist">
                  <th className="border-b border-line px-3 py-2">Önizləmə</th>
                  <th className="border-b border-line px-3 py-2">Başlıq</th>
                  <th className="border-b border-line px-3 py-2">Kateqoriya</th>
                  <th className="border-b border-line px-3 py-2">Bəyənmə</th>
                  <th className="border-b border-line px-3 py-2">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-line text-bone">
                    <td className="px-3 py-3">
                      <div className="flex h-[70px] w-[110px] items-center justify-center overflow-hidden rounded-xl border border-line bg-void">
                        <CoverThumb project={p} />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold">{p.title}</td>
                    <td className="px-3 py-3 text-mist">{p.category}</td>
                    <td className="px-3 py-3 text-mist">{p.likesCount || 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setEditing(p)} className={adminBtnGhost}>
                          Redaktə
                        </button>
                        <button type="button" onClick={() => openSocial(p)} className={adminBtnGhost}>
                          Bəyənmə / şərh
                        </button>
                        <button type="button" onClick={() => onDelete(p.id)} className={adminBtnQuiet}>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-bone">Layihəni redaktə et</h3>
            <form onSubmit={onSaveEdit} className="space-y-3">
              <input name="title" defaultValue={editing.title} required className={adminFieldClass} />
              <select
                name="category"
                defaultValue={editing.category || CATEGORIES[0]}
                className={adminFieldClass}
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
                className={adminFieldClass}
              />
              <input
                name="year"
                defaultValue={editing.year || ""}
                placeholder="İl (opsional)"
                className={adminFieldClass}
              />
              <textarea
                name="processNotes"
                defaultValue={editing.processNotes || ""}
                rows={3}
                placeholder="Proses qeydləri (opsional)"
                className={adminFieldClass}
              />

              <AdminField label="Kart şəkli">
                {cardImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(cardImageUrl)}
                    alt=""
                    className="mb-2 h-24 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="mb-2 text-xs text-mist">Kart şəkli yoxdur.</p>
                )}
                <AdminFilePick
                  id="edit-card"
                  label={cardUploading ? "Yüklənir…" : "Şəkil seç"}
                  accept="image/*"
                  disabled={cardUploading}
                  onChange={async (files) => {
                    const file = files[0];
                    if (!file) return;
                    setCardUploading(true);
                    try {
                      const res = await api.upload(file);
                      if (res.ok) {
                        const data = await res.json();
                        setCardImageUrl(data.url || "");
                      }
                    } finally {
                      setCardUploading(false);
                    }
                  }}
                />
              </AdminField>

              <AdminField label="Qalereya">
                {galleryItems.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {galleryItems.map((item) => (
                      <div
                        key={item.url}
                        className="relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-void"
                      >
                        {item.type === "video" ? (
                          item.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(item.posterUrl)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <video
                              src={mediaUrl(item.url)}
                              muted
                              preload="metadata"
                              playsInline
                              className="h-full w-full object-cover"
                            />
                          )
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(item.url)} alt="" className="h-full w-full object-cover" />
                        )}
                        {item.type === "video" ? (
                          <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-void/80 px-1 text-[9px] uppercase text-bone">
                            Video
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(item.url)}
                          className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-bone text-xs text-void"
                          aria-label="Media sil"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <AdminFilePick
                  id="edit-gallery"
                  label={galleryUploading ? "Yüklənir…" : "Fayl seç"}
                  accept="image/*,video/mp4,video/quicktime,video/webm"
                  multiple
                  disabled={galleryUploading}
                  onChange={onGalleryFilesSelected}
                />
              </AdminField>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing(null)} className={`${adminBtnGhost} flex-1 py-2.5`}>
                  Ləğv et
                </button>
                <button type="submit" className={`${adminBtn} flex-1`}>
                  Yenilə
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {social ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setSocial(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-1 font-display text-lg font-semibold text-bone">{social.title}</h3>
            <p className="mb-5 text-sm text-mist">Bəyənmə sayını dəyiş və istədiyin adla şərh yaz.</p>

            <AdminField label="Bəyənmə">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={adminBtnQuiet}
                  onClick={() => saveLikes(Number(likesDraft || 0) - 1)}
                >
                  −
                </button>
                <input
                  value={likesDraft}
                  onChange={(e) => setLikesDraft(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => saveLikes(Number(likesDraft || 0))}
                  className={`${adminFieldClass} max-w-[120px] text-center`}
                />
                <button
                  type="button"
                  className={adminBtnQuiet}
                  onClick={() => saveLikes(Number(likesDraft || 0) + 1)}
                >
                  +
                </button>
              </div>
            </AdminField>

            <div className="mt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-mist">
                Şərhlər · {(social.comments || []).length}
              </p>
              <div className="mb-4 max-h-48 space-y-3 overflow-y-auto">
                {(social.comments || []).length === 0 ? (
                  <p className="text-sm text-mist">Hələ şərh yoxdur.</p>
                ) : (
                  (social.comments || []).map((c: ProjectComment) => (
                    <div key={c.id} className="rounded-xl border border-line bg-void p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-bone">{c.authorName}</p>
                          <p className="mt-1 text-sm text-mist">{c.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComment(c.id)}
                          className={adminBtnQuiet}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={addAdminComment} className="space-y-2">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  placeholder="Ad (məs: Aysel)"
                  className={adminFieldClass}
                />
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  rows={2}
                  placeholder="Şərh mətni"
                  className={adminFieldClass}
                />
                <button type="submit" className={adminBtn}>
                  Şərh əlavə et
                </button>
              </form>
            </div>

            <button
              type="button"
              onClick={() => setSocial(null)}
              className={`${adminBtnGhost} mt-5 w-full py-2.5`}
            >
              Bağla
            </button>
          </div>
        </div>
      ) : null}
    </AdminCard>
  );
}

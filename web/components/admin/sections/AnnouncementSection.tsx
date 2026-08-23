"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/config";
import type { StudioProfile } from "@/lib/types";

export function AnnouncementSection({
  profile,
  onSave,
}: {
  profile: StudioProfile;
  onSave: (patch: Partial<StudioProfile>) => Promise<void>;
}) {
  const [text, setText] = useState(profile.announcementText || "");
  const [show, setShow] = useState(profile.showAnnouncement);
  const [heroUrl, setHeroUrl] = useState(profile.heroVideoUrl || "");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ announcementText: text, showAnnouncement: show });
    alert("Vitrin elanı uğurla tətbiq olundu!");
  }

  async function onUploadHero(e: FormEvent) {
    e.preventDefault();
    if (!heroFile) return;
    setUploading(true);
    try {
      const uploadRes = await api.upload(heroFile);
      if (!uploadRes.ok) {
        alert("Video yüklənmədi.");
        return;
      }
      const data = await uploadRes.json();
      await onSave({ heroVideoUrl: data.url });
      setHeroUrl(data.url);
      setHeroFile(null);
      alert("Ana səhifə videosu yeniləndi!");
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveHero() {
    if (!confirm("Ana səhifə videosunu silmək istəyirsiniz?")) return;
    await onSave({ heroVideoUrl: "" });
    setHeroUrl("");
    setHeroFile(null);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">🎬 Ana səhifə videosu</h2>
        <p className="mb-4 font-mono text-xs text-neutral-400">
          Bu video müştəri panelinin arxa planında göstərilir. Yalnız buradan
          yüklədiyiniz fayl istifadə olunur — portfel videosu avtomatik düşmür.
        </p>
        {heroUrl ? (
          <video
            src={mediaUrl(heroUrl)}
            muted
            playsInline
            controls
            className="mb-3 max-h-48 w-full rounded-lg border border-white/10 bg-black object-cover"
          />
        ) : (
          <p className="mb-3 text-sm text-neutral-500">Hələ video yüklənməyib.</p>
        )}
        <form onSubmit={onUploadHero} className="space-y-3">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-neutral-300"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!heroFile || uploading}
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {uploading ? "Yüklənir…" : "Videonu yüklə"}
            </button>
            {heroUrl ? (
              <button
                type="button"
                onClick={onRemoveHero}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Sil
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">📢 Vitrin Elanı</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-xs text-neutral-400">
              Elan / Xüsusi Təklif Mətni:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Məs: 🎉 Yeni ay münasibəti ilə endirim!"
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Elanı ana səhifədə aktiv göstər
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Elanı Yenilə
          </button>
        </form>
      </div>
    </div>
  );
}

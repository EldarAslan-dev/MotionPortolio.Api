"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl, parseHeroGallery } from "@/lib/config";
import type { ClientLogo, StudioProfile } from "@/lib/types";

export function SiteImagesSection({
  profile,
  logos,
  token,
  onSaveProfile,
  onLogosChanged,
  onToast,
}: {
  profile: StudioProfile;
  logos: ClientLogo[];
  token: string;
  onSaveProfile: (patch: Partial<StudioProfile>) => Promise<void>;
  onLogosChanged: () => void;
  onToast: (msg: string) => void;
}) {
  const [aboutFile, setAboutFile] = useState<File | null>(null);
  const [aboutUploading, setAboutUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploadingId, setLogoUploadingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const heroItems = parseHeroGallery(profile.heroGalleryJson);

  async function onUploadAbout(e: FormEvent) {
    e.preventDefault();
    if (!aboutFile) return;
    setAboutUploading(true);
    try {
      const res = await api.upload(aboutFile);
      if (!res.ok) return;
      const data = await res.json();
      await onSaveProfile({ aboutPhotoUrl: data.url });
      setAboutFile(null);
      onToast("About Photo yeniləndi!");
    } finally {
      setAboutUploading(false);
    }
  }

  async function onAddHeroImage(files: FileList | null) {
    if (!files || files.length === 0) return;
    setHeroUploading(true);
    try {
      const next = [...heroItems];
      for (const file of Array.from(files)) {
        const res = await api.upload(file);
        if (res.ok) {
          const data = await res.json();
          if (data?.url) next.push({ url: data.url, type: "image" });
        }
      }
      await onSaveProfile({ heroGalleryJson: JSON.stringify(next) });
      onToast("Hero gallery image əlavə olundu!");
    } finally {
      setHeroUploading(false);
    }
  }

  async function onRemoveHeroImage(url: string) {
    const next = heroItems.filter((item) => item.url !== url);
    await onSaveProfile({ heroGalleryJson: JSON.stringify(next) });
  }

  async function onUploadLogo(logo: ClientLogo, file: File | undefined) {
    if (!file) return;
    setLogoUploadingId(logo.id);
    try {
      const res = await api.upload(file);
      if (!res.ok) return;
      const data = await res.json();
      await api.updateClientLogo(
        logo.id,
        { name: logo.name, logoUrl: data.url, sortOrder: logo.sortOrder },
        token,
      );
      onLogosChanged();
      onToast(`Client Logo — ${logo.name} yeniləndi!`);
    } finally {
      setLogoUploadingId(null);
    }
  }

  async function onClearLogo(id: number, name: string, sortOrder: number) {
    await api.updateClientLogo(id, { name, logoUrl: "", sortOrder }, token);
    onLogosChanged();
  }

  async function onAddCompany(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const res = await api.createClientLogo({ name, logoUrl: "", sortOrder: logos.length }, token);
    if (res.ok) {
      setNewName("");
      onLogosChanged();
    }
  }

  async function onDeleteCompany(id: number) {
    if (!confirm("Bu loqonu silmək istəyirsiniz?")) return;
    const res = await api.deleteClientLogo(id, token);
    if (res.ok) onLogosChanged();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <h2 className="mb-1 text-lg font-bold text-white">About Photo</h2>
        <p className="mb-4 font-mono text-xs text-neutral-400">
          Full About section photo only. Nav avatar is a separate field.
        </p>
        {profile.aboutPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(profile.aboutPhotoUrl)}
            alt=""
            className="mb-3 h-28 w-28 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <p className="mb-3 text-sm text-neutral-500">No About Photo uploaded.</p>
        )}
        <form onSubmit={onUploadAbout} className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAboutFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-neutral-300"
          />
          <button
            type="submit"
            disabled={!aboutFile || aboutUploading}
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {aboutUploading ? "Yüklənir…" : "Upload About Photo"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <h2 className="mb-1 text-lg font-bold text-white">Hero Gallery Images</h2>
        <p className="mb-4 font-mono text-xs text-neutral-400">
          Each image is its own slot for the rotating hero gallery. Not taken from Work.
        </p>
        <div className="mb-3 flex flex-wrap gap-3">
          {heroItems.map((item, i) => (
            <div key={`${item.url}-${i}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(item.url)} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white">
                Hero Gallery Image {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemoveHeroImage(item.url)}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-red-600 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={heroUploading}
          onChange={(e) => {
            onAddHeroImage(e.target.files);
            e.currentTarget.value = "";
          }}
          className="w-full text-sm text-neutral-300"
        />
        {heroUploading ? <p className="mt-1 font-mono text-[11px] text-neutral-500">Yüklənir…</p> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <h2 className="mb-1 text-lg font-bold text-white">Client Logos</h2>
        <p className="mb-4 font-mono text-xs text-neutral-400">
          One independent logo file per company. Empty slots show as placeholders on the site.
        </p>
        <div className="space-y-3">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
                {logo.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(logo.logoUrl)} alt="" className="max-h-10 max-w-[96px] object-contain" />
                ) : (
                  <span className="text-[10px] text-neutral-600">empty</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Client Logo — {logo.name}</p>
                <input
                  type="file"
                  accept="image/*"
                  disabled={logoUploadingId === logo.id}
                    onChange={(e) => {
                    onUploadLogo(logo, e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                  className="mt-2 w-full text-xs text-neutral-300"
                />
              </div>
              <div className="flex gap-2">
                {logo.logoUrl ? (
                  <button
                    type="button"
                    onClick={() => onClearLogo(logo.id, logo.name, logo.sortOrder)}
                    className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-white"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDeleteCompany(logo.id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onAddCompany} className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New company name"
            className="flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
          />
          <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

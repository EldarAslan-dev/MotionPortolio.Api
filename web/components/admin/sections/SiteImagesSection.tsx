"use client";

import { FormEvent, useState } from "react";
import { AdminCard, AdminFilePick, adminBtn, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
import { api } from "@/lib/api";
import { blobToPosterFile, capturePosterFromFile } from "@/lib/capturePoster";
import { isVideoMedia, mediaUrl, parseHeroGallery } from "@/lib/config";
import type { ClientLogo, StudioProfile } from "@/lib/types";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,.png,.jpg,.jpeg,.webp,.gif,.avif";
const MEDIA_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm`;

function mediaTypeOf(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (/\.(mp4|mov|webm)$/i.test(file.name)) return "video";
  return "image";
}

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
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploadingId, setLogoUploadingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [addingLogo, setAddingLogo] = useState(false);
  const heroItems = parseHeroGallery(profile.heroGalleryJson);

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
    setHeroUploading(true);
    try {
      const next = [...heroItems];
      let added = 0;
      for (const file of heroFiles) {
        const url = await uploadImage(file);
        if (url) {
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
      onToast(added === 1 ? "Hero gallery-yə media əlavə olundu!" : `${added} media əlavə olundu!`);
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
      const url = await uploadImage(file);
      if (!url) return;
      const res = await api.updateClientLogo(
        logo.id,
        { name: logo.name, logoUrl: url, sortOrder: logo.sortOrder },
        token,
      );
      if (!res.ok) {
        onToast("Logo yadda saxlanılmadı.");
        return;
      }
      onLogosChanged();
      onToast(`Client Logo — ${logo.name} yeniləndi!`);
    } finally {
      setLogoUploadingId(null);
    }
  }

  async function onRenameLogo(logo: ClientLogo, name: string) {
    const next = name.trim();
    if (!next || next === logo.name) return;
    const res = await api.updateClientLogo(
      logo.id,
      { name: next, logoUrl: logo.logoUrl, sortOrder: logo.sortOrder },
      token,
    );
    if (res.ok) onLogosChanged();
  }

  async function onClearLogo(id: number, name: string, sortOrder: number) {
    await api.updateClientLogo(id, { name, logoUrl: "", sortOrder }, token);
    onLogosChanged();
  }

  async function onAddCompany(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim() || (newFile ? newFile.name.replace(/\.[^.]+$/, "") : "");
    if (!name && !newFile) return;
    setAddingLogo(true);
    try {
      let logoUrl = "";
      if (newFile) {
        const url = await uploadImage(newFile);
        if (!url) return;
        logoUrl = url;
      }
      const res = await api.createClientLogo(
        { name: name || "Logo", logoUrl, sortOrder: logos.length },
        token,
      );
      if (!res.ok) {
        onToast("Logo əlavə olunmadı.");
        return;
      }
      setNewName("");
      setNewFile(null);
      onLogosChanged();
      onToast("Client logo paylaşıldı!");
    } finally {
      setAddingLogo(false);
    }
  }

  async function onDeleteCompany(id: number) {
    if (!confirm("Bu loqonu silmək istəyirsiniz?")) return;
    const res = await api.deleteClientLogo(id, token);
    if (!res.ok) {
      onToast("Silinmədi. Yenidən daxil olub yoxlayın.");
      return;
    }
    onLogosChanged();
    onToast("Logo silindi.");
  }

  return (
    <div className="space-y-5">
      <AdminCard title="Hero qalereya" hint="Silindrdə fırlanan şəkil və video. Portfeldən gəlmir.">
        <div className="mb-4 flex flex-wrap gap-3">
          {heroItems.length === 0 ? (
            <p className="text-sm text-mist">Hələ media yoxdur.</p>
          ) : (
            heroItems.map((item, i) => (
              <div
                key={`${item.url}-${i}`}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-void"
              >
                {isVideoMedia(item) ? (
                  item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(item.posterUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video
                      src={mediaUrl(item.url)}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(item.url)} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[9px] uppercase text-bone">
                  {isVideoMedia(item) ? "Video" : i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveHeroImage(item.url)}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-bone text-xs text-void"
                >
                  ×
                </button>
              </div>
            ))
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
          <button
            type="submit"
            disabled={heroFiles.length === 0 || heroUploading}
            className={adminBtn}
          >
            {heroUploading ? "Yüklənir…" : "Qalereyaya əlavə et"}
          </button>
        </form>
      </AdminCard>

      <AdminCard title="Müştəri loqoları" hint="Şirkət adı və loqo. Birlikdə paylaş.">
        <form onSubmit={onAddCompany} className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Şirkət adı"
            className={adminFieldClass}
          />
          <AdminFilePick
            id="new-logo"
            label="Logo seç"
            accept={IMAGE_ACCEPT}
            filename={newFile?.name}
            onChange={(files) => setNewFile(files[0] || null)}
          />
          <button
            type="submit"
            disabled={addingLogo || (!newName.trim() && !newFile)}
            className={`${adminBtn} shrink-0`}
          >
            {addingLogo ? "Yüklənir…" : "Paylaş"}
          </button>
        </form>
        <div className="space-y-3">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-void p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                {logo.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(logo.logoUrl)} alt="" className="max-h-10 max-w-[96px] object-contain" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-mist">boş</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  defaultValue={logo.name}
                  key={`${logo.id}-${logo.name}`}
                  onBlur={(e) => onRenameLogo(logo, e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-bone outline-none"
                />
                <AdminFilePick
                  id={`logo-${logo.id}`}
                  label={logoUploadingId === logo.id ? "Yüklənir…" : "Logo dəyiş"}
                  accept={IMAGE_ACCEPT}
                  disabled={logoUploadingId === logo.id}
                  onChange={(files) => onUploadLogo(logo, files[0])}
                />
              </div>
              <div className="flex gap-2">
                {logo.logoUrl ? (
                  <button
                    type="button"
                    onClick={() => onClearLogo(logo.id, logo.name, logo.sortOrder)}
                    className={adminBtnQuiet}
                  >
                    Təmizlə
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDeleteCompany(logo.id)}
                  className={adminBtnQuiet}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

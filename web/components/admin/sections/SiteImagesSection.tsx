"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminCard, AdminFilePick, adminBtn, adminBtnQuiet, adminFieldClass, moveToIndex, OrderField, reorderList } from "@/components/admin/ui";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/config";
import type { ClientLogo, StudioProfile } from "@/lib/types";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,.png,.jpg,.jpeg,.webp,.gif,.avif";

export function SiteImagesSection({
  logos,
  token,
  onLogosChanged,
  onToast,
}: {
  profile?: StudioProfile;
  logos: ClientLogo[];
  token: string;
  onSaveProfile?: (patch: Partial<StudioProfile>) => Promise<void>;
  onLogosChanged: () => void;
  onToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [logoUploadingId, setLogoUploadingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [addingLogo, setAddingLogo] = useState(false);
  const [rows, setRows] = useState(logos);
  const [dragId, setDragId] = useState<number | null>(null);

  useEffect(() => {
    setRows(logos);
  }, [logos]);

  function placeAt(id: number, position: number) {
    const next = moveToIndex(rows, id, position, (logo) => logo.id);
    if (!next) return;
    setRows(next);
    void api.reorderLogos(next.map((logo) => logo.id), token).then((res) => {
      if (!res.ok) onToast("Could not save the order.");
      else onLogosChanged();
    });
  }

  function dropOn(targetId: number) {
    if (dragId == null) return;
    const next = reorderList(rows, dragId, targetId, (logo) => logo.id);
    setDragId(null);
    if (!next) return;
    setRows(next);
    void api.reorderLogos(next.map((logo) => logo.id), token).then((res) => {
      if (!res.ok) onToast("Could not save the order.");
      else onLogosChanged();
    });
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
      <AdminCard title={t("sec.logos")} hint={t("sec.logosHint")}>
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
            {addingLogo ? "Uploading…" : "Add"}
          </button>
        </form>
        <div className="space-y-3">
          {rows.map((logo, index) => (
            <div
              key={logo.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(logo.id)}
              className="flex flex-col gap-3 rounded-xl border border-line bg-void p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <OrderField index={index} total={rows.length} onPlace={(position) => placeAt(logo.id, position)} />
                <button
                  type="button"
                  draggable
                  aria-label="Drag to reorder"
                  onDragStart={() => setDragId(logo.id)}
                  onDragEnd={() => setDragId(null)}
                  className="hidden cursor-grab px-1 text-lg leading-none text-mist md:inline"
                >
                  ⋮⋮
                </button>
              </div>
              <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                {logo.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(logo.logoUrl)} alt="" className="max-h-10 max-w-[96px] object-contain" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-mist">empty</span>
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
                  label={logoUploadingId === logo.id ? "Uploading…" : "Replace logo"}
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
                    Clear
                  </button>
                ) : null}
                <button type="button" onClick={() => onDeleteCompany(logo.id)} className={adminBtnQuiet}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

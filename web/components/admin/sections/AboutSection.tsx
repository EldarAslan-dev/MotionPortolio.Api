"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminCard, AdminFilePick, adminBtn, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
import { api } from "@/lib/api";
import { mediaUrl, resolveTools } from "@/lib/config";
import { ABOUT_BODY, ABOUT_TEASER } from "@/lib/site/copy";
import type { StudioProfile, ToolItem } from "@/lib/types";

const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/avif,.png,.jpg,.jpeg,.webp,.gif,.avif";

export function AboutSection({
  profile,
  token,
  onSave,
  onToast,
}: {
  profile: StudioProfile;
  token: string;
  onSave: (patch: Partial<StudioProfile>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [teaser, setTeaser] = useState(profile.aboutTeaser?.trim() || ABOUT_TEASER);
  const [body, setBody] = useState(profile.aboutBody?.trim() || ABOUT_BODY);
  const [saving, setSaving] = useState(false);
  const [aboutFile, setAboutFile] = useState<File | null>(null);
  const [aboutUploading, setAboutUploading] = useState(false);
  const [tools, setTools] = useState<ToolItem[]>(() => resolveTools(profile.toolsJson));
  const [newName, setNewName] = useState("");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [addingTool, setAddingTool] = useState(false);
  const [logoBusyId, setLogoBusyId] = useState<string | null>(null);

  useEffect(() => {
    setTeaser(profile.aboutTeaser?.trim() || ABOUT_TEASER);
    setBody(profile.aboutBody?.trim() || ABOUT_BODY);
  }, [profile.aboutTeaser, profile.aboutBody]);

  useEffect(() => {
    setTools(resolveTools(profile.toolsJson));
  }, [profile.toolsJson]);

  function nextId() {
    return `tool-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function persistTools(next: ToolItem[]) {
    setTools(next);
    await onSave({ toolsJson: JSON.stringify(next) });
  }

  async function uploadFile(file: File): Promise<string | null> {
    const res = await api.upload(file, token);
    if (!res.ok) {
      onToast("Fayl yüklənmədi. Çıxış edib yenidən daxil olun.");
      return null;
    }
    const data = await res.json();
    return data?.url || null;
  }

  async function onSaveCopy(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        aboutTeaser: teaser.trim(),
        aboutBody: body.trim(),
      });
      onToast("Haqqında mətnləri yeniləndi!");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAbout(e: FormEvent) {
    e.preventDefault();
    if (!aboutFile) return;
    setAboutUploading(true);
    try {
      const res = await api.upload(aboutFile, token);
      if (!res.ok) {
        onToast("Şəkil yüklənmədi. Çıxış edib yenidən daxil olun.");
        return;
      }
      const data = await res.json();
      if (!data?.url) return;
      await onSave({ aboutPhotoUrl: data.url });
      setAboutFile(null);
      onToast("Haqqında şəkli yeniləndi!");
    } finally {
      setAboutUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminCard title="Haqqında mətnləri" hint="Yuxarı qısa teaser və aşağı uzun mətn.">
        <form onSubmit={onSaveCopy} className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-mist">Yuxarı — silindrin altı</p>
            <textarea
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              rows={3}
              placeholder={ABOUT_TEASER}
              className={adminFieldClass}
            />
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-mist">Aşağı — şəkilin altı</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={ABOUT_BODY}
              className={adminFieldClass}
            />
          </div>
          <button type="submit" disabled={saving} className={adminBtn}>
            {saving ? "Saxlanılır…" : "Mətnləri yadda saxla"}
          </button>
        </form>
      </AdminCard>

      <AdminCard title="Proqramlar" hint="Haqqında bölməsinin altındakı hərəkət edən sətir. Ad, loqo, və ya hər ikisi.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const name = newName.trim() || (newLogo ? newLogo.name.replace(/\.[^.]+$/, "") : "");
            if (!name && !newLogo) return;
            setAddingTool(true);
            try {
              let logoUrl = "";
              if (newLogo) {
                const url = await uploadFile(newLogo);
                if (!url) return;
                logoUrl = url;
              }
              await persistTools([...tools, { id: nextId(), name, logoUrl }]);
              setNewName("");
              setNewLogo(null);
              onToast("Proqram əlavə olundu.");
            } finally {
              setAddingTool(false);
            }
          }}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Proqram adı (məs: After Effects)"
            className={adminFieldClass}
          />
          <AdminFilePick
            id="new-tool-logo"
            label="Loqo (opsional)"
            accept={IMAGE_ACCEPT}
            filename={newLogo?.name}
            onChange={(files) => setNewLogo(files[0] || null)}
          />
          <button
            type="submit"
            disabled={addingTool || (!newName.trim() && !newLogo)}
            className={`${adminBtn} shrink-0`}
          >
            {addingTool ? "Yüklənir…" : "Əlavə et"}
          </button>
        </form>
        <div className="space-y-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-void p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
                {tool.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(tool.logoUrl)} alt="" className="max-h-8 max-w-[88px] object-contain" />
                ) : (
                  <span className="px-1 text-center text-[10px] uppercase tracking-wider text-mist">ad</span>
                )}
              </div>
              <input
                defaultValue={tool.name}
                key={`${tool.id}-${tool.name}`}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name === tool.name) return;
                  persistTools(tools.map((item) => (item.id === tool.id ? { ...item, name } : item)));
                }}
                placeholder="Ad"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-bone outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <AdminFilePick
                  id={`tool-logo-${tool.id}`}
                  label={logoBusyId === tool.id ? "Yüklənir…" : tool.logoUrl ? "Loqo dəyiş" : "Loqo qoy"}
                  accept={IMAGE_ACCEPT}
                  disabled={logoBusyId === tool.id}
                  onChange={async (files) => {
                    const file = files[0];
                    if (!file) return;
                    setLogoBusyId(tool.id);
                    try {
                      const url = await uploadFile(file);
                      if (!url) return;
                      await persistTools(
                        tools.map((item) => (item.id === tool.id ? { ...item, logoUrl: url } : item)),
                      );
                      onToast("Loqo əlavə olundu.");
                    } finally {
                      setLogoBusyId(null);
                    }
                  }}
                />
                {tool.logoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      persistTools(
                        tools.map((item) => (item.id === tool.id ? { ...item, logoUrl: "" } : item)),
                      )
                    }
                    className={adminBtnQuiet}
                  >
                    Loqonu sil
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => persistTools(tools.filter((item) => item.id !== tool.id))}
                  className={adminBtnQuiet}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Haqqında şəkli" hint="Aşağı About bölməsindəki şəkil. Nav avatar ayrıca dəyişilir.">
        {profile.aboutPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(profile.aboutPhotoUrl)}
            alt=""
            className="mb-3 max-h-48 w-full rounded-xl object-cover ring-1 ring-line"
          />
        ) : (
          <p className="mb-3 text-sm text-mist">Hələ şəkil yoxdur.</p>
        )}
        <form onSubmit={onUploadAbout} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminFilePick
            id="about-photo"
            label="Şəkil seç"
            accept={IMAGE_ACCEPT}
            filename={aboutFile?.name}
            onChange={(files) => setAboutFile(files[0] || null)}
          />
          <button
            type="submit"
            disabled={!aboutFile || aboutUploading}
            className={adminBtn}
          >
            {aboutUploading ? "Yüklənir…" : "Şəkli yüklə"}
          </button>
        </form>
      </AdminCard>
    </div>
  );
}

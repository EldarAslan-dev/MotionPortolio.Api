"use client";

import { FormEvent, useState } from "react";
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ announcementText: text, showAnnouncement: show });
    alert("Vitrin elanı uğurla tətbiq olundu!");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">📢 Vitrin Elanı & Endirim Banneri</h2>
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
  );
}

"use client";

import { FormEvent, useState } from "react";
import { AdminCard, AdminField, adminFieldClass } from "@/components/admin/ui";
import type { StudioProfile } from "@/lib/types";

export function AnnouncementSection({
  profile,
  onSave,
  onToast,
}: {
  profile: StudioProfile;
  onSave: (patch: Partial<StudioProfile>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [text, setText] = useState(profile.announcementText || "");
  const [show, setShow] = useState(profile.showAnnouncement);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ announcementText: text, showAnnouncement: show });
      onToast("Elan yeniləndi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Üst elan"
      hint="Saytın yuxarısında hərəkət edən sətir. Boş saxlasan və ya söndürsən, görünməz."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AdminField label="Mətn">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Məs: Yeni reel paketimiz hazırdır"
            className={adminFieldClass}
          />
        </AdminField>
        <label className="flex items-center gap-3 text-sm text-bone">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="h-4 w-4 accent-bone"
          />
          Ana səhifədə göstər
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-bone px-5 py-2.5 text-sm font-semibold text-void disabled:opacity-50"
        >
          {saving ? "Saxlanılır…" : "Elanı yadda saxla"}
        </button>
      </form>
    </AdminCard>
  );
}

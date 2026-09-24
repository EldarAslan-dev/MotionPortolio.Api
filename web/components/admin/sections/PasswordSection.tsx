"use client";

import { FormEvent, useState } from "react";
import { AdminCard, AdminField, adminBtn, adminFieldClass } from "@/components/admin/ui";
import { api } from "@/lib/api";

export function PasswordSection({ token, onToast }: { token: string; onToast: (msg: string) => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await api.changePassword(
        String(form.get("old") || ""),
        String(form.get("new") || ""),
        token,
      );
      if (res.ok) {
        onToast("Şifrə yeniləndi.");
        (e.target as HTMLFormElement).reset();
      } else {
        onToast("Köhnə şifrəni düzgün daxil edin.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminCard title="Şifrə" hint="Admin hesabının giriş şifrəsi.">
      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <AdminField label="Köhnə şifrə">
          <input name="old" type="password" required className={adminFieldClass} />
        </AdminField>
        <AdminField label="Yeni şifrə">
          <input name="new" type="password" required className={adminFieldClass} />
        </AdminField>
        <button type="submit" disabled={submitting} className={`${adminBtn} w-full`}>
          Şifrəni yenilə
        </button>
      </form>
    </AdminCard>
  );
}

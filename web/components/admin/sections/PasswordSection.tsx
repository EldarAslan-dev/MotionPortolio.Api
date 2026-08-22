"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export function PasswordSection({ token }: { token: string }) {
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
        alert("Şifrəniz uğurla dəyişdirildi!");
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Köhnə şifrəni düzgün daxil edin.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">🔒 Admin Şifrəsini Dəyiş</h2>
      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">Köhnə Şifrə:</label>
          <input
            name="old"
            type="password"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-neutral-400">Yeni Şifrə:</label>
          <input
            name="new"
            type="password"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Şifrəni Yenilə
        </button>
      </form>
    </div>
  );
}

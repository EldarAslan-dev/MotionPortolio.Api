"use client";

import { FormEvent, useState } from "react";
import { adminBtn, adminFieldClass } from "@/components/admin/ui";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/auth";

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await api.login(
        String(form.get("username") || ""),
        String(form.get("password") || ""),
      );
      if (!res.ok) {
        setError("İstifadəçi adı və ya şifrə yanlışdır.");
        return;
      }
      const data = await res.json();
      adminAuth.setToken(data.token);
      onSuccess();
    } catch {
      setError("Serverlə əlaqə qurulmadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-mist">Studiya paneli</p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold tracking-[-0.03em] text-bone">
          Giriş
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="username"
            placeholder="İstifadəçi adı"
            required
            className={adminFieldClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Şifrə"
            required
            className={adminFieldClass}
          />
          {error ? <p className="text-sm text-mist">{error}</p> : null}
          <button type="submit" disabled={loading} className={`${adminBtn} w-full`}>
            {loading ? "Yoxlanılır…" : "Daxil ol"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <h1 className="text-center text-xl font-bold uppercase tracking-wide text-white">
          Studio Ofisinə Giriş
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="username"
            placeholder="İstifadəçi adı (admin)"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Şifrə"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Yoxlanılır…" : "Daxil ol"}
          </button>
        </form>
      </div>
    </div>
  );
}

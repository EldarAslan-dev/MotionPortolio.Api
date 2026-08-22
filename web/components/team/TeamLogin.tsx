"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { staffAuth } from "@/lib/auth";

export function TeamLogin({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    try {
      const res = await api.login(username, password);
      if (!res.ok) {
        setError("İstifadəçi adı, şifrə yanlışdır və ya bu hesab komanda hesabı deyil.");
        return;
      }
      const data = await res.json();
      staffAuth.setSession(data.token, username);
      onSuccess();
    } catch {
      setError("Serverlə əlaqə qurulmadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a11] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111422] p-8">
        <h2 className="mb-5 text-center text-lg font-bold text-white">Komanda Girişi</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="username"
            placeholder="İstifadəçi adı"
            required
            className="w-full rounded-lg border border-white/10 bg-[#0d1019] px-3 py-2.5 text-sm text-white outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Şifrə"
            required
            className="w-full rounded-lg border border-white/10 bg-[#0d1019] px-3 py-2.5 text-sm text-white outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Yoxlanılır…" : "Daxil ol"}
          </button>
          {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

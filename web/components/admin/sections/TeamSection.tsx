"use client";

import { FormEvent } from "react";
import { api } from "@/lib/api";
import type { StaffUser } from "@/lib/types";

export function TeamSection({
  staffList,
  token,
  onChanged,
  onToast,
}: {
  staffList: StaffUser[];
  token: string;
  onChanged: () => void;
  onToast: (msg: string) => void;
}) {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const res = await api.createStaff(username, password, token);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      onToast("Komanda üzvü əlavə edildi!");
      (e.target as HTMLFormElement).reset();
      onChanged();
    } else {
      alert(data.message || "Xəta baş verdi.");
    }
  }

  async function remove(id: number) {
    if (!confirm("Bu komanda üzvünü silmək istəyirsiniz?")) return;
    const res = await api.deleteStaff(id, token);
    if (res.ok) {
      onToast("Komanda üzvü silindi.");
      onChanged();
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-2 text-lg font-bold text-white">👥 Komanda İdarəetməsi</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Komanda üzvləri yalnız{" "}
        <a href="/team" target="_blank" className="text-indigo-400 underline">
          /team
        </a>{" "}
        panelindən öz hesabları ilə giriş edir, yalnız özlərinə təyin olunan işləri görür.
        Müştərinin adı və email-i onlara göstərilmir.
      </p>
      <form onSubmit={onSubmit} className="mb-5 flex flex-wrap gap-2">
        <input
          name="username"
          placeholder="İstifadəçi adı"
          required
          className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Şifrə"
          required
          className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Əlavə et
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <th className="border-b border-white/10 px-3 py-2">İstifadəçi adı</th>
              <th className="border-b border-white/10 px-3 py-2">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-neutral-500">
                  Hələ komanda üzvü əlavə edilməyib.
                </td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id} className="border-b border-white/5 text-white">
                  <td className="px-3 py-3 font-semibold">{s.username}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

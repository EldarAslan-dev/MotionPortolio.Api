"use client";

import { FormEvent } from "react";
import { AdminCard, adminBtn, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
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
      onToast("Komanda üzvü əlavə edildi.");
      (e.target as HTMLFormElement).reset();
      onChanged();
    } else {
      onToast(data.message || "Xəta baş verdi.");
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
    <AdminCard
      title="Komanda"
      hint="Üzvlər yalnız /team panelindən öz işlərini görür. Müştəri adı və email onlara göstərilmir."
    >
      <form onSubmit={onSubmit} className="mb-5 flex flex-wrap gap-2">
        <input
          name="username"
          placeholder="İstifadəçi adı"
          required
          className={`${adminFieldClass} min-w-[160px] flex-1`}
        />
        <input
          name="password"
          type="password"
          placeholder="Şifrə"
          required
          className={`${adminFieldClass} min-w-[160px] flex-1`}
        />
        <button type="submit" className={`${adminBtn} whitespace-nowrap`}>
          Əlavə et
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-mist">
              <th className="border-b border-line px-3 py-2">İstifadəçi adı</th>
              <th className="border-b border-line px-3 py-2">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-mist">
                  Hələ komanda üzvü əlavə edilməyib.
                </td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id} className="border-b border-line text-bone">
                  <td className="px-3 py-3 font-semibold">{s.username}</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => remove(s.id)} className={adminBtnQuiet}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { adminBtn, adminFieldClass } from "@/components/admin/ui";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/auth";

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useI18n();
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
        setError(t("login.bad"));
        return;
      }
      const data = await res.json();
      adminAuth.setToken(data.token);
      onSuccess();
    } catch {
      setError(t("login.offline"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login admin-app flex min-h-screen items-center justify-center p-5">
      <span className="admin-orb left-[-60px] top-[-120px] h-[420px] w-[420px] bg-[#d4a64a] opacity-30" />
      <span className="admin-orb bottom-[-120px] right-[-80px] h-[360px] w-[360px] bg-[#8a5a0c] opacity-30" />
      <form onSubmit={onSubmit} className="admin-login-card">
        <span className="admin-mark mb-4 h-12 w-12 rounded-[14px] text-[17px]">BM</span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t("login.title")}</h1>
        <p className="mb-5 mt-1 text-sm text-mist">{t("login.hint")}</p>
        <label className="mb-4 block">
          <span className="mb-1.5 block font-medium">{t("login.user")}</span>
          <input name="username" autoComplete="username" required className={adminFieldClass} />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block font-medium">{t("login.pass")}</span>
          <input name="password" type="password" autoComplete="current-password" required className={adminFieldClass} />
        </label>
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
        <button type="submit" disabled={loading} className={`${adminBtn} w-full`}>
          {loading ? t("login.busy") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}

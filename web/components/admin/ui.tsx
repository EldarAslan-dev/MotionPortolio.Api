"use client";

import type { ReactNode } from "react";

export function AdminCard({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      {title ? (
        <header className="mb-5">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-bone">{title}</h2>
          {hint ? <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist">{hint}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-mist">{label}</span>
      {children}
    </label>
  );
}

export const adminFieldClass =
  "w-full rounded-xl border border-line bg-void px-3.5 py-2.5 text-sm text-bone outline-none placeholder:text-mist/70 transition focus:border-bone/35";

export const adminSelectClass =
  "rounded-lg border border-line bg-void px-2.5 py-1.5 text-xs text-bone outline-none";

export const adminBtn =
  "rounded-xl bg-bone px-4 py-2.5 text-sm font-semibold text-void disabled:opacity-50";

export const adminBtnGhost =
  "rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-mist transition hover:border-bone/30 hover:text-bone";

export const adminBtnQuiet =
  "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-mist transition hover:text-bone";

export function AdminFilePick({
  id,
  label,
  accept,
  multiple,
  disabled,
  filename,
  onChange,
}: {
  id: string;
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  filename?: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div
        className={`relative inline-flex overflow-hidden rounded-xl border border-line bg-void ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <span className="pointer-events-none px-4 py-2.5 text-sm text-bone">{label}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            onChange(Array.from(e.target.files || []));
            e.currentTarget.value = "";
          }}
        />
      </div>
      {filename ? (
        <span className="max-w-[220px] truncate text-xs text-mist">{filename}</span>
      ) : null}
    </div>
  );
}

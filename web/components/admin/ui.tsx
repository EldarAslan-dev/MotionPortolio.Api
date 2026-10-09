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
    <section className="admin-glass p-5">
      {title ? (
        <header className="mb-5">
          <h2 className="text-[15px] font-semibold text-bone">{title}</h2>
          {hint ? <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist">{hint}</p> : null}
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
      <span className="mb-1.5 block text-sm font-medium text-bone">{label}</span>
      {children}
    </label>
  );
}

export const adminFieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bone outline-none placeholder:text-mist/70 transition focus:border-cue focus:shadow-[0_0_0_3px_rgb(227_185_92_/_0.22)]";

export const adminSelectClass =
  "rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-bone outline-none";

export const adminBtn =
  "admin-gold-btn rounded-lg px-3.5 py-2 text-sm disabled:opacity-50";

export const adminBtnGhost =
  "rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-bone transition hover:border-cue";

export const adminBtnQuiet =
  "rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] font-medium text-mist transition hover:border-cue hover:text-bone";

export function reorderList<T>(list: T[], fromId: number, toId: number, idOf: (item: T) => number) {
  const from = list.findIndex((item) => idOf(item) === fromId);
  const to = list.findIndex((item) => idOf(item) === toId);
  if (from < 0 || to < 0 || from === to) return null;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function OrderButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (dir: number) => void;
}) {
  return (
    <>
      <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className={adminBtnQuiet}>
        ↑
      </button>
      <button type="button" disabled={index >= total - 1} onClick={() => onMove(1)} className={adminBtnQuiet}>
        ↓
      </button>
    </>
  );
}

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

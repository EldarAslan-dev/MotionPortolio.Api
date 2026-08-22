"use client";

import { useState } from "react";

export function NotesSection({
  notes,
  onChange,
}: {
  notes: string[];
  onChange: (notes: string[]) => void;
}) {
  const [value, setValue] = useState("");

  function add() {
    const v = value.trim();
    if (!v) return;
    onChange([...notes, v]);
    setValue("");
  }

  function remove(index: number) {
    onChange(notes.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">📝 Dizaynerin Şəxsi Qeydləri</h2>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white"
          >
            <span>{n}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-1 text-lg text-red-400"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Yeni ideya, müştəri qeydi..."
          className="flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white"
        >
          Əlavə et
        </button>
      </div>
    </div>
  );
}

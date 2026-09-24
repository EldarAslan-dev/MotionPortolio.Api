"use client";

import { useState } from "react";
import { AdminCard, adminBtn, adminFieldClass } from "@/components/admin/ui";

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
    <AdminCard title="Qeydlər" hint="Yalnız sən görürsən — vitrində görünmür.">
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-void px-3 py-2.5 text-sm text-bone"
          >
            <span>{n}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-1 text-lg leading-none text-mist hover:text-bone"
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
          className={adminFieldClass}
        />
        <button type="button" onClick={add} className={`${adminBtn} shrink-0`}>
          Əlavə et
        </button>
      </div>
    </AdminCard>
  );
}

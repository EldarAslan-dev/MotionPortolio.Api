"use client";

import { useState } from "react";
import type { Inquiry, StaffUser } from "@/lib/types";

type Props = {
  inquiries: Inquiry[];
  staffList: StaffUser[];
  onStatusChange: (id: number, status: string, orderNumber: string) => void;
  onAssign: (id: number, username: string) => void;
  onApproveStaffFile: (id: number) => void;
  onToggleClientChat: (id: number) => void;
  onDeliverFile: (id: number, file: File, orderNumber: string) => void;
  onDelete: (id: number, orderNumber: string) => void;
};

export function InquiriesSection({
  inquiries,
  staffList,
  onStatusChange,
  onAssign,
  onApproveStaffFile,
  onToggleClientChat,
  onDeliverFile,
  onDelete,
}: Props) {
  const [files, setFiles] = useState<Record<number, File | null>>({});

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">📥 Gələn Əməkdaşlıq Müraciətləri</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <th className="border-b border-white/10 px-3 py-2">Sifariş №</th>
              <th className="border-b border-white/10 px-3 py-2">Müştəri ID</th>
              <th className="border-b border-white/10 px-3 py-2">Müştəri</th>
              <th className="border-b border-white/10 px-3 py-2">Stil</th>
              <th className="border-b border-white/10 px-3 py-2">Büdcə</th>
              <th className="border-b border-white/10 px-3 py-2">Status</th>
              <th className="border-b border-white/10 px-3 py-2">Komanda</th>
              <th className="border-b border-white/10 px-3 py-2">Fayl</th>
              <th className="border-b border-white/10 px-3 py-2">İdarə</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-neutral-500">
                  Hələ gələn müraciət yoxdur.
                </td>
              </tr>
            ) : (
              inquiries.map((i) => (
                <tr key={i.id} className="border-b border-white/5 align-top text-white">
                  <td className="px-3 py-3 font-semibold text-emerald-400">{i.orderNumber}</td>
                  <td className="px-3 py-3 font-bold text-indigo-300">{i.clientId || "—"}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{i.clientName}</div>
                    <div className="text-xs text-neutral-500">{i.clientEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-indigo-500/15 px-2 py-1 text-xs text-indigo-300">
                      🎯 {i.selectedProjectTitle || "Ümumi"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold">{i.budget}</td>
                  <td className="px-3 py-3">
                    <select
                      value={i.status}
                      onChange={(e) => onStatusChange(i.id, e.target.value, i.orderNumber)}
                      className="rounded-md border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white"
                    >
                      <option value="Yeni">Yeni</option>
                      <option value="İcrada">İcrada</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </td>
                  <td className="min-w-[170px] px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={i.assignedStaffUsername || ""}
                        onChange={(e) => onAssign(i.id, e.target.value)}
                        className="rounded-md border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white"
                      >
                        <option value="">— Təyin et —</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.username}>
                            {s.username}
                          </option>
                        ))}
                      </select>
                      {i.staffFileReady ? (
                        <button
                          type="button"
                          onClick={() => onApproveStaffFile(i.id)}
                          className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-black"
                        >
                          📦 Komanda faylı hazır — Təsdiqlə
                        </button>
                      ) : null}
                      <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <input
                          type="checkbox"
                          checked={i.clientChatEnabled}
                          onChange={() => onToggleClientChat(i.id)}
                        />
                        Komanda ↔ Müştəri çatı
                      </label>
                    </div>
                  </td>
                  <td className="min-w-[150px] px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        onChange={(e) =>
                          setFiles((prev) => ({ ...prev, [i.id]: e.target.files?.[0] || null }))
                        }
                        className="text-[11px] text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const f = files[i.id];
                          if (f) onDeliverFile(i.id, f, i.orderNumber);
                        }}
                        className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-black"
                      >
                        Göndər
                      </button>
                      {i.deliveredFileUrl ? (
                        <a
                          href={i.deliveredFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-300 underline"
                        >
                          Faylı Aç
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(i.id, i.orderNumber)}
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

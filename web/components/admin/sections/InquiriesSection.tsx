"use client";

import { useState } from "react";
import {
  AdminCard,
  AdminFilePick,
  adminBtn,
  adminBtnGhost,
  adminBtnQuiet,
  adminSelectClass,
} from "@/components/admin/ui";
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

function InquiryControls({
  inquiry,
  staffList,
  file,
  onStatusChange,
  onAssign,
  onApproveStaffFile,
  onToggleClientChat,
  onFile,
  onDeliver,
  onDelete,
  stacked,
}: {
  inquiry: Inquiry;
  staffList: StaffUser[];
  file: File | null;
  onStatusChange: Props["onStatusChange"];
  onAssign: Props["onAssign"];
  onApproveStaffFile: Props["onApproveStaffFile"];
  onToggleClientChat: Props["onToggleClientChat"];
  onFile: (file: File | null) => void;
  onDeliver: () => void;
  onDelete: () => void;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "space-y-3" : "space-y-2"}>
      <select
        value={inquiry.status}
        onChange={(e) => onStatusChange(inquiry.id, e.target.value, inquiry.orderNumber)}
        className={`${adminSelectClass} ${stacked ? "w-auto" : "w-full"}`}
      >
        <option value="Yeni">Yeni</option>
        <option value="İcrada">İcrada</option>
        <option value="Tamamlandı">Tamamlandı</option>
      </select>
      <select
        value={inquiry.assignedStaffUsername || ""}
        onChange={(e) => onAssign(inquiry.id, e.target.value)}
        className={`${adminSelectClass} w-full`}
      >
        <option value="">Komandaya təyin et</option>
        {staffList.map((s) => (
          <option key={s.id} value={s.username}>
            {s.username}
          </option>
        ))}
      </select>
      {inquiry.staffFileReady ? (
        <button
          type="button"
          onClick={() => onApproveStaffFile(inquiry.id)}
          className={`${adminBtn} w-full py-2 text-xs`}
        >
          Komanda faylını təsdiqlə
        </button>
      ) : null}
      <label className="flex items-center gap-2 text-[11px] text-mist">
        <input
          type="checkbox"
          checked={inquiry.clientChatEnabled}
          onChange={() => onToggleClientChat(inquiry.id)}
          className="accent-bone"
        />
        Komanda ↔ müştəri çatı
      </label>
      <AdminFilePick
        id={`deliver-${inquiry.id}`}
        label="Fayl seç"
        accept="*/*"
        filename={file?.name}
        onChange={(files) => onFile(files[0] || null)}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onDeliver} className={adminBtnGhost}>
          Göndər
        </button>
        {inquiry.deliveredFileUrl ? (
          <a
            href={inquiry.deliveredFileUrl}
            target="_blank"
            rel="noreferrer"
            className={adminBtnGhost}
          >
            Faylı aç
          </a>
        ) : null}
        <button type="button" onClick={onDelete} className={adminBtnQuiet}>
          Sil
        </button>
      </div>
    </div>
  );
}

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
    <AdminCard
      title="Müraciətlər"
      hint="Gələn əməkdaşlıq sorğuları, təyinat və fayl təhvili."
    >
      {inquiries.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist">Hələ gələn müraciət yoxdur.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:hidden">
            {inquiries.map((i) => (
              <div key={i.id} className="rounded-2xl border border-line bg-void p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-bone">{i.orderNumber}</span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-mist">
                    {i.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="font-semibold text-bone">{i.clientName}</div>
                  <div className="break-all text-xs text-mist">{i.clientEmail}</div>
                  {i.clientId ? (
                    <div className="mt-0.5 font-mono text-[11px] text-mist">ID: {i.clientId}</div>
                  ) : null}
                </div>
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg border border-line px-2 py-1 text-mist">
                    {i.selectedProjectTitle || "Ümumi"}
                  </span>
                  <span className="rounded-lg bg-bone/10 px-2 py-1 font-semibold text-bone">
                    {i.budget}
                  </span>
                </div>
                <InquiryControls
                  inquiry={i}
                  staffList={staffList}
                  file={files[i.id] || null}
                  stacked
                  onStatusChange={onStatusChange}
                  onAssign={onAssign}
                  onApproveStaffFile={onApproveStaffFile}
                  onToggleClientChat={onToggleClientChat}
                  onFile={(file) => setFiles((prev) => ({ ...prev, [i.id]: file }))}
                  onDeliver={() => {
                    const f = files[i.id];
                    if (f) onDeliverFile(i.id, f, i.orderNumber);
                  }}
                  onDelete={() => onDelete(i.id, i.orderNumber)}
                />
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-mist">
                  <th className="border-b border-line px-3 py-2">Sifariş</th>
                  <th className="border-b border-line px-3 py-2">Müştəri</th>
                  <th className="border-b border-line px-3 py-2">Stil</th>
                  <th className="border-b border-line px-3 py-2">Büdcə</th>
                  <th className="border-b border-line px-3 py-2">İdarə</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((i) => (
                  <tr key={i.id} className="border-b border-line align-top text-bone">
                    <td className="px-3 py-4">
                      <div className="font-mono text-sm font-semibold">{i.orderNumber}</div>
                      <div className="mt-1 text-[11px] text-mist">{i.clientId || "—"}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="font-semibold">{i.clientName}</div>
                      <div className="text-xs text-mist">{i.clientEmail}</div>
                    </td>
                    <td className="px-3 py-4 text-mist">{i.selectedProjectTitle || "Ümumi"}</td>
                    <td className="px-3 py-4 font-semibold">{i.budget}</td>
                    <td className="min-w-[240px] px-3 py-4">
                      <InquiryControls
                        inquiry={i}
                        staffList={staffList}
                        file={files[i.id] || null}
                        onStatusChange={onStatusChange}
                        onAssign={onAssign}
                        onApproveStaffFile={onApproveStaffFile}
                        onToggleClientChat={onToggleClientChat}
                        onFile={(file) => setFiles((prev) => ({ ...prev, [i.id]: file }))}
                        onDeliver={() => {
                          const f = files[i.id];
                          if (f) onDeliverFile(i.id, f, i.orderNumber);
                        }}
                        onDelete={() => onDelete(i.id, i.orderNumber)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminCard>
  );
}

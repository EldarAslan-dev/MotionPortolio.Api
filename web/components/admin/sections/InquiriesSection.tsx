"use client";

import { ChevronDown, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { AdminCard, AdminFilePick, adminBtn, adminBtnGhost } from "@/components/admin/ui";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Inquiry, StaffUser } from "@/lib/types";

const STATUSES = ["Yeni", "İcrada", "Tamamlandı"];

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

function StatusMenu({
  inquiry,
  onStatusChange,
}: {
  inquiry: Inquiry;
  onStatusChange: Props["onStatusChange"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1">
          <Badge variant={statusBadgeVariant(inquiry.status)}>
            {inquiry.status}
            <ChevronDown className="h-3 w-3" strokeWidth={2} />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onStatusChange(inquiry.id, s, inquiry.orderNumber)}>
            <Badge variant={statusBadgeVariant(s)} className="pointer-events-none">
              {s}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssignMenu({
  inquiry,
  staffList,
  onAssign,
}: {
  inquiry: Inquiry;
  staffList: StaffUser[];
  onAssign: Props["onAssign"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-bone transition hover:border-bone/30"
        >
          {inquiry.assignedStaffUsername || "Komandaya təyin et"}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Təyin et</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onAssign(inquiry.id, "")} disabled={!inquiry.assignedStaffUsername}>
          Təyinatı ləğv et
        </DropdownMenuItem>
        {staffList.length > 0 ? <DropdownMenuSeparator /> : null}
        {staffList.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => onAssign(inquiry.id, s.username)}>
            {s.username}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreActionsMenu({
  inquiry,
  onDelete,
}: {
  inquiry: Inquiry;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Daha çox əməliyyat"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mist transition hover:border-bone/30 hover:text-bone"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {inquiry.deliveredFileUrl ? (
          <DropdownMenuItem
            onSelect={() => window.open(inquiry.deliveredFileUrl!, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
            Faylı aç
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
      <div className="flex flex-wrap items-center gap-2">
        <StatusMenu inquiry={inquiry} onStatusChange={onStatusChange} />
        <AssignMenu inquiry={inquiry} staffList={staffList} onAssign={onAssign} />
        <MoreActionsMenu inquiry={inquiry} onDelete={onDelete} />
      </div>
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
          className="accent-cue"
        />
        Komanda ↔ müştəri çatı
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <AdminFilePick
          id={`deliver-${inquiry.id}`}
          label="Fayl seç"
          accept="*/*"
          filename={file?.name}
          onChange={(files) => onFile(files[0] || null)}
        />
        <button type="button" onClick={onDeliver} className={adminBtnGhost}>
          Göndər
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
                  <Badge variant={statusBadgeVariant(i.status)}>{i.status}</Badge>
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

          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sifariş</TableHead>
                  <TableHead>Müştəri</TableHead>
                  <TableHead>Stil</TableHead>
                  <TableHead>Büdcə</TableHead>
                  <TableHead>İdarə</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-mono text-sm font-semibold">{i.orderNumber}</div>
                      <div className="mt-1 text-[11px] text-mist">{i.clientId || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{i.clientName}</div>
                      <div className="text-xs text-mist">{i.clientEmail}</div>
                    </TableCell>
                    <TableCell className="text-mist">{i.selectedProjectTitle || "Ümumi"}</TableCell>
                    <TableCell className="font-semibold">{i.budget}</TableCell>
                    <TableCell className="min-w-[260px]">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminCard>
  );
}

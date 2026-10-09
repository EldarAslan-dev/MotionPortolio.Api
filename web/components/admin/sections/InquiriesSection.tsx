"use client";

import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminFilePick,
  adminBtn,
  adminBtnQuiet,
  adminFieldClass,
  adminSelectClass,
} from "@/components/admin/ui";
import { ClientFace } from "@/components/ClientFace";
import { statusText, useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { getApiUrl, mediaUrl } from "@/lib/config";
import type { Inquiry, StaffUser } from "@/lib/types";

type Props = {
  inquiries: Inquiry[];
  staffList: StaffUser[];
  onStatusChange: (id: number, status: string, orderNumber: string) => void;
  onAssign: (id: number, username: string) => void;
  onApproveStaffFile: (id: number) => void;
  onToggleClientChat: (id: number) => void;
  token: string;
  onPrepareDelivery: (inquiry: Inquiry, file: File | null, link: string) => void;
  onConfirmPayment: (inquiry: Inquiry) => void;
  onDelete: (id: number, orderNumber: string) => void;
  onMessage: (inquiry: Inquiry) => void;
};

type BriefRow = { label: string; value: string };

function fileHref(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = getApiUrl().replace(/\/$/, "");
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

function isImage(path: string) {
  return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(path);
}

function parseBrief(message: string) {
  const rows: BriefRow[] = [];
  let file = "";
  let offer = "";
  let pkg = "";
  for (const raw of message.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const cut = line.indexOf(": ");
    if (cut < 0) {
      rows.push({ label: "Qeyd", value: line });
      continue;
    }
    const label = line.slice(0, cut).trim();
    const value = line.slice(cut + 2).trim();
    if (/^paket$/i.test(label)) {
      pkg = value;
      continue;
    }
    if (/müştəri təklifi/i.test(label)) {
      offer = value;
      continue;
    }
    if (/^fayl$/i.test(label) || isImage(value)) {
      file = value;
      if (isImage(value)) continue;
    }
    rows.push({ label, value });
  }
  return { rows, file, offer, pkg };
}

function statusClass(status: string) {
  if (status === "Tamamlandı") return "border-emerald-500 text-emerald-400";
  if (status === "İcrada") return "border-sky-400 text-sky-300";
  if (status === "Ləğv edildi") return "border-line text-mist";
  return "border-[#e8c46a] text-[#e8c46a]";
}

function shortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("az", { day: "numeric", month: "short" });
}

function ReceiptPreview({ id, token }: { id: number; token: string }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<{ url: string; pdf: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    let objectUrl = "";
    api.inquiryReceipt(id, token).then(async (res) => {
      if (!res.ok || !alive) return;
      const blob = await res.blob();
      if (!alive) return;
      objectUrl = URL.createObjectURL(blob);
      setPreview({ url: objectUrl, pdf: (res.headers.get("content-type") || "").includes("pdf") });
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, token]);
  if (!preview) return <p className="text-sm text-mist">{t("inq.receiptLoading")}</p>;
  if (preview.pdf) return <iframe src={preview.url} title={t("inq.receiptAlt")} className="h-80 w-full rounded-xl border border-line" />;
  return <img src={preview.url} alt={t("inq.receiptAlt")} className="w-full rounded-xl border border-line" />;
}

function InquiryControls({
  inquiry,
  staffList,
  token,
  file,
  onStatusChange,
  onAssign,
  onApproveStaffFile,
  onToggleClientChat,
  onFile,
  onPrepare,
  onConfirm,
  onDelete,
}: {
  inquiry: Inquiry;
  staffList: StaffUser[];
  token: string;
  file: File | null;
  onStatusChange: Props["onStatusChange"];
  onAssign: Props["onAssign"];
  onApproveStaffFile: Props["onApproveStaffFile"];
  onToggleClientChat: Props["onToggleClientChat"];
  onFile: (file: File | null) => void;
  onPrepare: (link: string) => void;
  onConfirm: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [link, setLink] = useState("");
  const ready = Boolean(file) || /^https:\/\//i.test(link.trim());
  const locked = inquiry.status === "Tamamlandı" || inquiry.status === "Ləğv edildi";
  const track = inquiry.trackToken ? `https://www.bilgeyismirzazada.com/track/${inquiry.trackToken}` : "";
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mist">{t("inq.delivery")}</p>
      <label className="mb-1 block text-xs text-mist">{t("inq.status")}</label>
      <select
        value={inquiry.status}
        disabled={locked}
        onChange={(e) => onStatusChange(inquiry.id, e.target.value, inquiry.orderNumber)}
        className={`${adminSelectClass} mb-2.5 w-full py-2`}
      >
        <option value="Yeni">{t("status.new")}</option>
        <option value="İcrada">{t("status.progress")}</option>
        {inquiry.status === "Ödəniş gözlənilir" ? <option value="Ödəniş gözlənilir">{t("status.awaiting")}</option> : null}
        {inquiry.status === "Tamamlandı" ? <option value="Tamamlandı">{t("status.done")}</option> : null}
        <option value="Ləğv edildi">{t("status.cancelled")}</option>
      </select>
      <label className="mb-1 block text-xs text-mist">{t("inq.team")}</label>
      <select
        value={inquiry.assignedStaffUsername || ""}
        onChange={(e) => onAssign(inquiry.id, e.target.value)}
        className={`${adminSelectClass} mb-2.5 w-full py-2`}
      >
        <option value="">{t("inq.assign")}</option>
        {staffList.map((s) => (
          <option key={s.id} value={s.username}>
            {s.username}
          </option>
        ))}
      </select>
      {inquiry.staffFileReady ? (
        <button type="button" onClick={() => onApproveStaffFile(inquiry.id)} className={`${adminBtn} mb-2.5 w-full py-2 text-xs`}>
          {t("inq.approveFile")}
        </button>
      ) : null}
      <label className="mb-2.5 flex items-center gap-2 text-[13px] text-mist">
        <input
          type="checkbox"
          checked={inquiry.clientChatEnabled}
          onChange={() => onToggleClientChat(inquiry.id)}
          className="accent-[#e8c46a]"
        />
        {t("inq.teamChat")}
      </label>
      {inquiry.status === "Yeni" || inquiry.status === "İcrada" ? (
        <div className="mb-2.5">
          <AdminFilePick
            id={`deliver-${inquiry.id}`}
            label={t("inq.readyFile")}
            accept="*/*"
            filename={file?.name}
            onChange={(next) => onFile(next[0] || null)}
          />
          <label className="mb-1 mt-2 block text-xs text-mist">{t("inq.orLink")}</label>
          <input
            type="url"
            value={link}
            placeholder="https://drive.google.com/..."
            onChange={(e) => setLink(e.target.value)}
            className={adminFieldClass}
          />
          <button type="button" disabled={!ready} onClick={() => onPrepare(link.trim())} className={`${adminBtn} mt-2.5 w-full`}>
            {t("inq.prepare")}
          </button>
        </div>
      ) : null}
      {inquiry.status === "Ödəniş gözlənilir" ? (
        <div className="mb-2.5">
          <p className="mb-1 text-xs text-mist">{t("inq.receipt")}</p>
          {inquiry.hasReceipt ? (
            <ReceiptPreview key={inquiry.receiptAt || String(inquiry.id)} id={inquiry.id} token={token} />
          ) : (
            <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-mist">{t("inq.noReceipt")}</p>
          )}
          <button type="button" disabled={!inquiry.hasReceipt} onClick={onConfirm} className={`${adminBtn} mt-2.5 w-full`}>
            {t("inq.confirmPay")}
          </button>
        </div>
      ) : null}
      {inquiry.status === "Tamamlandı" ? (
        <p className="mb-2.5 text-sm text-mist">{t("inq.confirmed")}</p>
      ) : null}
      {track && inquiry.status !== "Yeni" ? (
        <a href={track} target="_blank" rel="noreferrer" className="mb-2.5 block truncate text-xs text-[#e8c46a]">
          {t("inq.track")}
        </a>
      ) : null}
      <button type="button" onClick={onDelete} className={`${adminBtnQuiet} text-red-300`}>
        {t("inq.delete")}
      </button>
    </div>
  );
}

function Reference({ file, onOpen }: { file: string; onOpen: (src: string) => void }) {
  const { t } = useI18n();
  const href = fileHref(file);
  const preview = mediaUrl(file) || href;
  const [broken, setBroken] = useState(false);
  if (!file) {
    return <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-mist">{t("inq.noRef")}</div>;
  }
  if (!isImage(file)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block rounded-xl border border-line px-4 py-4 text-sm text-[#e8c46a]">
        {t("inq.openFile")}
      </a>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => !broken && onOpen(preview)}
        className="relative block w-full overflow-hidden rounded-xl border border-line bg-void"
      >
        {broken ? (
          <span className="block px-4 py-8 text-center text-xs text-mist">{t("inq.imageFail")}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Referans" className="aspect-[16/10] w-full object-cover" onError={() => setBroken(true)} />
        )}
      </button>
      <div className="mt-1.5 text-sm">
        <a href={href} target="_blank" rel="noreferrer" className="text-[#e8c46a]">
          {t("inq.newTab")}
        </a>
        <span className="text-mist"> · </span>
        <a href={href} download className="text-[#e8c46a]">
          {t("inq.download")}
        </a>
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
  token,
  onPrepareDelivery,
  onConfirmPayment,
  onDelete,
  onMessage,
}: Props) {
  const { t, lang } = useI18n();
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [zoom, setZoom] = useState("");

  return (
    <AdminCard title={t("inq.title")} hint={t("inq.hint")}>
      {inquiries.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist">{t("inq.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="hidden grid-cols-[140px_minmax(160px,1.4fr)_150px_80px_210px] items-center gap-3 border-b border-line px-4 text-xs text-mist md:grid">
            <span className="py-2.5">{t("inq.order")}</span>
            <span>{t("inq.customer")}</span>
            <span>{t("inq.status")}</span>
            <span>{t("inq.budget")}</span>
            <span />
          </div>
          {inquiries.map((inquiry) => {
            const brief = parseBrief(inquiry.message || "");
            const open = openId === inquiry.id;
            return (
              <div key={inquiry.id} className={open ? "bg-void/40" : ""}>
                <div className="grid items-center gap-2 border-t border-line px-4 py-3 md:grid-cols-[140px_minmax(160px,1.4fr)_150px_80px_210px] md:gap-3">
                  <div>
                    <div className="text-sm font-semibold text-bone">{inquiry.orderNumber}</div>
                    <div className="text-xs text-mist">{shortDate(inquiry.createdAt)}</div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ClientFace name={inquiry.clientName} src={inquiry.clientAvatarUrl} size={34} />
                    <div className="min-w-0">
                      <b className="block truncate text-sm">{inquiry.clientName}</b>
                      <span className="block truncate text-xs text-mist">{inquiry.selectedProjectTitle || t("inq.general")}</span>
                    </div>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(inquiry.status)}`}>
                    <i className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusText(inquiry.status, t)}
                  </span>
                  <b className="text-sm">{inquiry.budget}</b>
                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    {inquiry.clientId ? (
                      <button
                        type="button"
                        onClick={() => onMessage(inquiry)}
                        className="rounded-lg border border-[#e8c46a] px-3 py-1.5 text-sm text-[#e8c46a]"
                      >
                        {t("inq.write")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : inquiry.id)}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm text-bone"
                    >
                      {t("inq.details")}
                    </button>
                  </div>
                </div>
                {open ? (
                  <div className="grid gap-6 border-t border-line px-4 py-4 lg:grid-cols-[1.4fr_1fr_0.9fr]">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mist">{t("inq.brief")}</p>
                      {brief.rows.length === 0 ? (
                        <p className="text-sm text-mist">{t("inq.noBrief")}</p>
                      ) : (
                        <dl className="grid grid-cols-[92px_1fr] text-sm">
                          {brief.rows.map((row, index) => (
                            <div key={`${row.label}-${index}`} className="col-span-2 grid grid-cols-[92px_1fr] border-b border-line">
                              <dt className="py-1.5 text-mist">{lang === "en" ? ({ Paket: t("brief.package"), Marka: t("brief.brand"), Sloqan: t("brief.tagline"), Sahə: t("brief.industry"), Hədəf: t("brief.audience"), Stil: t("brief.style"), Rəng: t("brief.colors"), Referans: t("brief.references"), Fayl: t("brief.file"), Qeyd: t("brief.notes") } as Record<string, string>)[row.label] || row.label : row.label}</dt>
                              <dd className="py-1.5">
                                {row.label === "Stil"
                                  ? row.value.split(/[|,]/).map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                                      <span key={tag} className="mb-1 mr-1 inline-block rounded-md border border-line px-2 text-[13px]">
                                        {tag}
                                      </span>
                                    ))
                                  : row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <div>
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-line px-3 py-2">
                          <small className="text-xs text-mist">{t("inq.offer")}</small>
                          <strong className="block text-lg text-[#e8c46a]">{brief.offer || inquiry.budget}</strong>
                        </div>
                        <div className="rounded-xl border border-line px-3 py-2">
                          <small className="text-xs text-mist">{t("inq.package")}</small>
                          <strong className="block text-sm">{brief.pkg || "—"}</strong>
                        </div>
                      </div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mist">{t("inq.reference")}</p>
                      <Reference file={brief.file} onOpen={setZoom} />
                      <p className="mt-2 text-xs text-mist">
                        {inquiry.clientEmail}
                        {inquiry.clientId ? ` · ${inquiry.clientId}` : ""}
                      </p>
                    </div>
                    <InquiryControls
                      inquiry={inquiry}
                      staffList={staffList}
                      token={token}
                      file={files[inquiry.id] || null}
                      onStatusChange={onStatusChange}
                      onAssign={onAssign}
                      onApproveStaffFile={onApproveStaffFile}
                      onToggleClientChat={onToggleClientChat}
                      onFile={(file) => setFiles((prev) => ({ ...prev, [inquiry.id]: file }))}
                      onPrepare={(link) => onPrepareDelivery(inquiry, files[inquiry.id] || null, link)}
                      onConfirm={() => onConfirmPayment(inquiry)}
                      onDelete={() => onDelete(inquiry.id, inquiry.orderNumber)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {zoom ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 p-6"
          onClick={() => setZoom("")}
        >
          <button type="button" className="absolute right-4 top-4 rounded-lg border border-line bg-void px-3 py-2 text-sm text-bone" onClick={() => setZoom("")}>
            {t("inq.close")}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Referans şəkil" className="max-h-full max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </AdminCard>
  );
}

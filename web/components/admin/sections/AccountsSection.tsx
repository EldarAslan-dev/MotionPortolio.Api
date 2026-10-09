"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminCard, adminBtn, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
import { ClientFace } from "@/components/ClientFace";
import { api } from "@/lib/api";
import { statusText, useI18n } from "@/lib/i18n";
import type { MemberAccount } from "@/lib/types";

function money(paid: MemberAccount["paid"]) {
  if (!paid.length) return "0";
  return paid
    .map((item) => (item.currency === "AZN" ? `${item.amount} AZN` : `$${item.amount}`))
    .join(" · ");
}

export function AccountsSection({ token }: { token: string }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<MemberAccount[]>([]);
  const [openId, setOpenId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api.members(token).then(setRows).catch(() => setRows([]));
  }

  useEffect(() => {
    load();
  }, [token]);

  const reachable = rows.filter((row) => row.email.includes("@"));

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Send this email to ${reachable.length} accounts?`)) return;
    setBusy(true);
    setNote("");
    const res = await api.broadcast(subject.trim(), message.trim(), token);
    setBusy(false);
    if (!res.ok) {
      setNote("The email could not be sent.");
      return;
    }
    const data = await res.json();
    setNote(`Sent to ${data.sent ?? 0}. Failed: ${data.failed ?? 0}.`);
    setSubject("");
    setMessage("");
  }

  async function onDelete(row: MemberAccount) {
    if (!window.confirm(`Delete ${row.name || row.email}? Their past orders stay in Inquiries.`)) return;
    const res = await api.deleteMember(row.clientId, token);
    if (!res.ok) {
      setNote("Could not delete the account.");
      return;
    }
    if (openId === row.clientId) setOpenId("");
    load();
  }

  return (
    <div className="space-y-4">
      <AdminCard title="Accounts" hint="Registered people, their orders, what they have paid, and a password, discount, or free gift for one of them.">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-mist">No accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article key={row.clientId} className="rounded-2xl border border-line">
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
                  onClick={() => setOpenId(openId === row.clientId ? "" : row.clientId)}
                >
                  <ClientFace name={row.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{row.name || "—"}</b>
                    <span className="block truncate text-xs text-mist">{row.email}</span>
                  </span>
                  <span className="text-xs text-mist">{row.orders} orders</span>
                  <span className="text-xs text-bone">{money(row.paid)} paid</span>
                </button>
                {openId === row.clientId ? (
                  <AccountTools row={row} token={token} status={t} onChanged={load} onDelete={() => onDelete(row)} onNote={setNote} />
                ) : null}
              </article>
            ))}
          </div>
        )}
        {note ? <p className="mt-3 text-sm text-mist">{note}</p> : null}
      </AdminCard>
      <AdminCard title="Announcement" hint="Send one email to every account that has an address.">
        <form onSubmit={onSend} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-mist">Subject</span>
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={adminFieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-mist">Message</span>
            <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={adminFieldClass} />
          </label>
          <button type="submit" disabled={busy || reachable.length === 0} className={adminBtn}>
            {busy ? "Sending…" : "Email everyone"}
          </button>
        </form>
      </AdminCard>
    </div>
  );
}

function AccountTools({
  row,
  token,
  status,
  onChanged,
  onDelete,
  onNote,
}: {
  row: MemberAccount;
  token: string;
  status: (key: string) => string;
  onChanged: () => void;
  onDelete: () => void;
  onNote: (note: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [kind, setKind] = useState("discount");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await api.setMemberPassword(row.clientId, password, token);
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      onNote(data?.message || "Could not change the password.");
      return;
    }
    setPassword("");
    onNote("Password updated.");
    onChanged();
  }

  async function saveGift(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await api.addMemberGift(row.clientId, { kind, title: title.trim(), detail: detail.trim() }, token);
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      onNote(data?.message || "Could not save it.");
      return;
    }
    setTitle("");
    setDetail("");
    onNote(data?.message || "Saved.");
    onChanged();
  }

  return (
    <div className="space-y-4 border-t border-line px-4 py-4">
      <p className="font-mono text-xs text-mist">{row.clientId}</p>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mist">Orders</p>
        {row.ledger.length === 0 ? (
          <p className="text-sm text-mist">No orders yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {row.ledger.map((item) => (
              <li key={item.id} className="flex flex-wrap gap-2">
                <b>{item.orderNumber}</b>
                <span>{item.title || "General"}</span>
                <span className="text-mist">{statusText(item.status, status)}</span>
                <span>{item.budget}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={savePassword} className="flex flex-wrap items-end gap-2">
        <label className="min-w-[180px] flex-1 text-sm">
          <span className="mb-1.5 block text-mist">New password</span>
          <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={adminFieldClass} />
        </label>
        <button type="submit" disabled={busy} className={adminBtn}>Save password</button>
      </form>
      <form onSubmit={saveGift} className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mist">Discount or free gift</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setKind("discount")} className={kind === "discount" ? adminBtn : adminBtnQuiet}>Discount</button>
          <button type="button" onClick={() => setKind("free")} className={kind === "free" ? adminBtn : adminBtnQuiet}>Free gift</button>
        </div>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={adminFieldClass} />
        <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What they should know" className={adminFieldClass} />
        <button type="submit" disabled={busy} className={adminBtn}>Save and email them</button>
      </form>
      {row.gifts.length ? (
        <ul className="space-y-1 text-sm text-mist">
          {row.gifts.map((gift) => (
            <li key={gift.id}>
              <b className="text-bone">{gift.kind === "free" ? "Free gift" : "Discount"}:</b> {gift.title}
              {gift.detail ? ` — ${gift.detail}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={onDelete} className={`${adminBtnQuiet} text-red-300`}>Delete account</button>
    </div>
  );
}

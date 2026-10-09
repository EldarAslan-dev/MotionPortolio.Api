"use client";

import { useEffect, useRef, useState } from "react";
import { ClientFace } from "@/components/ClientFace";
import { useI18n } from "@/lib/i18n";

export type DmMessage = { sender: string; content: string; label?: string };
export type DmClient = {
  name: string;
  avatarUrl?: string | null;
  messages: DmMessage[];
  lastMessage?: string | null;
  lastSender?: string | null;
  lastAt?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  store: Record<string, DmClient>;
  activeClientId: string | null;
  onSelect: (clientId: string) => void;
  onSend: (clientId: string, text: string) => void;
  onDeleteConversation: (clientId: string) => void;
  onClearMessages: (clientId: string) => void;
};

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return "";
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "indi";
  if (diffMin < 60) return `${diffMin}dq`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}s`;
  return `${Math.floor(diffH / 24)}g`;
}

export function AdminChatDock({
  open,
  onClose,
  store,
  activeClientId,
  onSelect,
  onSend,
  onDeleteConversation,
  onClearMessages,
}: Props) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const boxRef = useRef<HTMLDivElement>(null);
  const active = activeClientId ? store[activeClientId] : null;

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [active?.messages.length, activeClientId]);

  useEffect(() => {
    if (open) setMobileView(activeClientId ? "chat" : "list");
  }, [open, activeClientId]);

  const sortedIds = Object.keys(store).sort((a, b) => {
    const ta = store[a].lastAt ? new Date(store[a].lastAt as string).getTime() : 0;
    const tb = store[b].lastAt ? new Date(store[b].lastAt as string).getTime() : 0;
    return tb - ta;
  });

  function selectClient(clientId: string) {
    onSelect(clientId);
    setMobileView("chat");
  }

  function send() {
    const value = text.trim();
    if (!value || !activeClientId) return;
    onSend(activeClientId, value);
    setText("");
  }

  if (!open) return null;

  const clientList = (
    <>
      {sortedIds.length === 0 ? (
        <p className="p-4 text-center text-xs text-mist">Aktiv söhbət yoxdur</p>
      ) : (
        sortedIds.map((clientId) => {
          const c = store[clientId];
          const prefix = c.lastSender === "Admin" ? "Siz: " : "";
          let preview = c.lastMessage ? `${prefix}${c.lastMessage}` : "Hələ mesaj yoxdur";
          if (preview.length > 34) preview = preview.slice(0, 34) + "…";
          return (
            <div
              key={clientId}
              className={`flex cursor-pointer items-center gap-2 border-b border-line px-2.5 py-2.5 hover:bg-bone/5 sm:py-2 ${
                activeClientId === clientId ? "bg-bone/10" : ""
              }`}
              onClick={() => selectClient(clientId)}
            >
              <ClientFace name={c.name} src={c.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-bone">{c.name}</div>
                <div className="truncate font-mono text-[10px] text-mist">{clientId}</div>
                <div className="truncate text-[11px] text-mist">{preview}</div>
              </div>
              <div className="shrink-0 text-[10px] text-mist">{timeAgo(c.lastAt)}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(clientId);
                }}
                className="shrink-0 px-1 text-sm text-mist hover:text-bone"
                title="Söhbəti sil"
              >
                ×
              </button>
            </div>
          );
        })
      )}
    </>
  );

  const conversation = (
    <>
      <div className="mb-1 flex items-center justify-between gap-1 border-b border-line pb-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="shrink-0 px-1 text-lg text-mist sm:hidden"
            title="Siyahıya qayıt"
          >
            ‹
          </button>
          <div className="flex min-w-0 items-center gap-2">
            {active ? <ClientFace name={active.name} src={active.avatarUrl} size={28} /> : null}
            <div className="truncate text-xs font-semibold text-bone">
              {active ? (
                <>
                  {active.name}{" "}
                  <span className="font-normal text-mist">({activeClientId})</span>
                </>
              ) : (
                "Söhbət seçilməyib"
              )}
            </div>
          </div>
        </div>
        {active ? (
          <button
            type="button"
            onClick={() => activeClientId && onClearMessages(activeClientId)}
            className="shrink-0 whitespace-nowrap rounded-lg border border-line px-2 py-0.5 text-[10px] text-mist hover:text-bone"
            title="Bu müştərinin bütün mesajlarını sil"
          >
            Mesajları təmizlə
          </button>
        ) : null}
      </div>
      <div ref={boxRef} className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {!active || active.messages.length === 0 ? (
          <p className="mt-16 text-center text-xs text-mist">
            {active ? "Hələ mesaj yoxdur." : "Soldan müştəri seçin..."}
          </p>
        ) : (
          active.messages.map((m, i) => {
            const isAdmin = m.sender === "Admin";
            return (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs sm:max-w-[80%] ${
                  isAdmin ? "admin-gold-btn self-end" : "self-start border border-line bg-void text-bone"
                }`}
              >
                <strong>{isAdmin ? m.label || "Siz" : m.label || "Müştəri"}:</strong> {m.content}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Mesaj yaz..."
          className="flex-1 rounded-xl border border-line bg-void px-3 py-2 text-xs text-bone outline-none placeholder:text-mist"
        />
        <button
          type="button"
          onClick={send}
          className="admin-gold-btn rounded-xl px-3 text-xs font-semibold"
        >
          Göndər
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-chat-panel flex h-full flex-col bg-surface p-3 sm:h-auto sm:rounded-2xl sm:border sm:border-line sm:p-4 sm:shadow-2xl">
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-line pb-2">
        <h3 className="font-hero text-sm font-semibold text-bone">Canlı dəstək</h3>
        <button type="button" onClick={onClose} className="text-2xl leading-none text-mist hover:text-bone">
          ×
        </button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-void sm:h-[300px] sm:flex-none sm:flex-row">
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } w-full flex-col overflow-y-auto border-line sm:flex sm:w-[38%] sm:border-r`}
        >
          {clientList}
        </div>
        <div
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } w-full flex-col justify-between p-2 sm:flex sm:w-[62%]`}
        >
          {conversation}
        </div>
      </div>
    </div>
  );
}

export function AdminChatTrigger({
  onClick,
  hasBadge,
}: {
  onClick: () => void;
  hasBadge: boolean;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="admin-gold-btn admin-chat-fab flex h-14 w-14 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.14em]"
      title={t("chat.live")}
    >
      DM
      {hasBadge ? (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-[#08090c] bg-[#f3e5ab]" />
      ) : null}
    </button>
  );
}

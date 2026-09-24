"use client";

import { useEffect, useRef, useState } from "react";

export type DmMessage = { sender: string; content: string; label?: string };
export type DmClient = {
  name: string;
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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
  const [text, setText] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const boxRef = useRef<HTMLDivElement>(null);
  const active = activeClientId ? store[activeClientId] : null;

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [active?.messages.length, activeClientId]);

  useEffect(() => {
    if (open) setMobileView(activeClientId ? "chat" : "list");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bone text-[10px] font-bold text-void">
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-bone">{c.name}</div>
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
                  isAdmin ? "self-end bg-bone text-void" : "self-start border border-line bg-void text-bone"
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
          className="rounded-xl bg-bone px-3 text-xs font-semibold text-void"
        >
          Göndər
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-surface p-3 sm:inset-auto sm:bottom-24 sm:left-auto sm:right-6 sm:mx-auto sm:h-auto sm:max-w-[560px] sm:rounded-2xl sm:border sm:border-line sm:p-4 sm:shadow-2xl">
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-line pb-2">
        <h3 className="font-display text-sm font-semibold text-bone">Canlı dəstək</h3>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[140] flex h-14 w-14 items-center justify-center rounded-full bg-bone text-[11px] font-semibold tracking-[0.14em] text-void shadow-xl"
      title="Canlı dəstək"
    >
      DM
      {hasBadge ? (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-surface bg-bone" />
      ) : null}
    </button>
  );
}

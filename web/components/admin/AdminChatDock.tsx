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
  const boxRef = useRef<HTMLDivElement>(null);
  const active = activeClientId ? store[activeClientId] : null;

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [active?.messages.length, activeClientId]);

  const sortedIds = Object.keys(store).sort((a, b) => {
    const ta = store[a].lastAt ? new Date(store[a].lastAt as string).getTime() : 0;
    const tb = store[b].lastAt ? new Date(store[b].lastAt as string).getTime() : 0;
    return tb - ta;
  });

  function send() {
    const value = text.trim();
    if (!value || !activeClientId) return;
    onSend(activeClientId, value);
    setText("");
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-4 left-4 z-[150] mx-auto max-w-[560px] rounded-2xl border-2 border-indigo-400 bg-neutral-900 p-4 shadow-2xl sm:right-6 sm:left-auto">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-sm font-bold text-indigo-300">💬 Canlı Dəstək DM Mərkəzi</h3>
        <button type="button" onClick={onClose} className="text-xl leading-none text-red-400">
          ×
        </button>
      </div>
      <div className="flex h-[300px] overflow-hidden rounded-xl border border-white/10 bg-neutral-950">
        <div className="w-[38%] overflow-y-auto border-r border-white/10">
          {sortedIds.length === 0 ? (
            <p className="p-3 text-center text-xs text-neutral-500">Aktiv söhbət yoxdur</p>
          ) : (
            sortedIds.map((clientId) => {
              const c = store[clientId];
              const prefix = c.lastSender === "Admin" ? "Siz: " : "";
              let preview = c.lastMessage ? `${prefix}${c.lastMessage}` : "Hələ mesaj yoxdur";
              if (preview.length > 34) preview = preview.slice(0, 34) + "…";
              return (
                <div
                  key={clientId}
                  className={`flex cursor-pointer items-center gap-2 border-b border-white/10 px-2 py-2 hover:bg-white/5 ${
                    activeClientId === clientId ? "bg-indigo-500/15" : ""
                  }`}
                  onClick={() => onSelect(clientId)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">{c.name}</div>
                    <div className="truncate text-[11px] text-neutral-500">{preview}</div>
                  </div>
                  <div className="shrink-0 text-[10px] text-neutral-500">{timeAgo(c.lastAt)}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(clientId);
                    }}
                    className="shrink-0 px-1 text-sm text-red-400 opacity-60 hover:opacity-100"
                    title="Söhbəti sil"
                  >
                    🗑
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex w-[62%] flex-col justify-between p-2">
          <div className="mb-1 flex items-center justify-between gap-1 border-b border-white/10 pb-1">
            <div className="truncate text-xs font-bold text-emerald-400">
              {active ? (
                <>
                  {active.name}{" "}
                  <span className="font-normal text-neutral-500">({activeClientId})</span>
                </>
              ) : (
                "Söhbət seçilməyib"
              )}
            </div>
            {active ? (
              <button
                type="button"
                onClick={() => activeClientId && onClearMessages(activeClientId)}
                className="shrink-0 whitespace-nowrap rounded-md border border-red-500 bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400"
                title="Bu müştərinin bütün mesajlarını sil"
              >
                🗑 Mesajları təmizlə
              </button>
            ) : null}
          </div>
          <div ref={boxRef} className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {!active || active.messages.length === 0 ? (
              <p className="mt-16 text-center text-xs text-neutral-500">
                {active ? "Hələ mesaj yoxdur." : "Soldan müştəri seçin..."}
              </p>
            ) : (
              active.messages.map((m, i) => {
                const isAdmin = m.sender === "Admin";
                return (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs text-white ${
                      isAdmin ? "self-end bg-indigo-500" : "self-start bg-emerald-600"
                    }`}
                  >
                    <strong>{isAdmin ? m.label || "Siz" : m.label || "Müştəri"}:</strong>{" "}
                    {m.content}
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
              className="flex-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={send}
              className="rounded-lg bg-indigo-500 px-3 text-xs font-semibold text-white"
            >
              Göndər
            </button>
          </div>
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
      className="fixed bottom-6 right-6 z-[140] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-xl text-white shadow-xl"
      title="Canlı Dəstək"
    >
      💬
      {hasBadge ? (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-neutral-950 bg-red-500" />
      ) : null}
    </button>
  );
}

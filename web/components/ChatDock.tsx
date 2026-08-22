"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import type { ChatMessage } from "@/lib/types";

type Props = {
  clientId: string | null;
  clientName: string;
  onNeedRegister: () => void;
};

function keyOf(m: Pick<ChatMessage, "sender" | "content" | "id">) {
  return m.id ? `id:${m.id}` : `${m.sender}|${m.content}`;
}

export function ChatDock({ clientId, clientName, onNeedRegister }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [badge, setBadge] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const connRef = useRef<HubConnection | null>(null);
  const seen = useRef(new Set<string>());

  const push = useCallback((incoming: ChatMessage) => {
    const k = keyOf(incoming);
    if (seen.current.has(k)) return;
    seen.current.add(k);
    setMessages((prev) => [...prev, incoming]);
  }, []);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const history = await api.messages(id);
      seen.current = new Set(history.map(keyOf));
      setMessages(history);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  const join = useCallback(async (id: string) => {
    const conn = connRef.current;
    if (conn?.state === "Connected") {
      await conn.invoke("JoinClientGroup", id);
    }
  }, []);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/notificationHub`)
      .withAutomaticReconnect()
      .build();

    conn.on(
      "ReceiveGeneralMessage",
      (
        sender: string,
        content: string,
        msgClientId?: string,
        _name?: string,
        _isAuto?: boolean,
        payload?: { id?: number; sentAt?: string },
      ) => {
        if (msgClientId && clientId && msgClientId !== clientId) return;
        if (sender === "Client") return;
        push({
          id: payload?.id ?? Date.now(),
          clientId: msgClientId || clientId || "",
          clientName: clientName,
          sender,
          content,
          sentAt: payload?.sentAt ?? new Date().toISOString(),
        });
        setBadge(true);
      },
    );

    conn
      .start()
      .then(() => {
        if (clientId) return conn.invoke("JoinClientGroup", clientId);
      })
      .catch(() => {});

    conn.onreconnected(() => {
      if (clientId) {
        conn.invoke("JoinClientGroup", clientId).catch(() => {});
        loadHistory(clientId).catch(() => {});
      }
    });

    connRef.current = conn;
    return () => {
      conn.stop().catch(() => {});
      connRef.current = null;
    };
  }, [clientId, clientName, loadHistory, push]);

  useEffect(() => {
    if (!clientId) return;
    loadHistory(clientId);
    join(clientId);
  }, [clientId, join, loadHistory]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, open]);

  function toggle() {
    if (!clientId) {
      onNeedRegister();
      return;
    }
    setOpen((v) => !v);
    setBadge(false);
  }

  async function send() {
    const value = text.trim();
    if (!value || !clientId) return;
    const optimistic: ChatMessage = {
      id: Date.now(),
      clientId,
      clientName,
      sender: "Client",
      content: value,
      sentAt: new Date().toISOString(),
    };
    push(optimistic);
    setText("");
    try {
      await connRef.current?.invoke(
        "SendGeneralMessage",
        clientId,
        clientName || clientId,
        "Client",
        value,
      );
    } catch {
      /* mesaj lokal qalır; tarixçə növbəti yükləmədə sinxron olur */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg"
        aria-label="Canlı dəstək"
      >
        <span className="text-lg">✉</span>
        {badge && !open ? (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[420px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-paper shadow-2xl">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Studio desk
              </p>
              <p className="font-display text-xl">Canlı dəstək</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-2xl leading-none">
              ×
            </button>
          </div>
          <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {!loaded ? (
              <p className="pt-16 text-center text-sm text-muted">Mesajlar yüklənir…</p>
            ) : messages.length === 0 ? (
              <p className="pt-16 text-center text-sm text-muted">
                Mesajınızı yazın — cavab burada qalacaq.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender === "Client";
                return (
                  <div
                    key={keyOf(m) + m.sentAt}
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto bg-ink text-paper"
                        : "bg-white text-ink shadow-sm"
                    }`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-wider opacity-60">
                      {mine ? "Siz" : "Studio"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2 border-t border-black/10 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Mesaj yazın…"
              className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={send}
              className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white"
            >
              Göndər
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

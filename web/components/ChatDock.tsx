"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClientFace } from "@/components/ClientFace";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ChatMessage } from "@/lib/types";

type Props = {
  clientId: string | null;
  clientName: string;
  clientAvatar?: string;
  onNeedRegister: () => void;
};

function keyOf(m: Pick<ChatMessage, "sender" | "content" | "id">) {
  return m.id ? `id:${m.id}` : `${m.sender}|${m.content}`;
}

export function ChatDock({ clientId, clientName, clientAvatar, onNeedRegister }: Props) {
  const { t } = useI18n();
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
      .withUrl(`${getApiUrl()}/notificationHub`)
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
        data-cursor="link"
        onClick={toggle}
        className="chat-gold fixed bottom-6 right-6 z-[95] flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
        aria-label="Open Live Chat"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
        </svg>
        {badge && !open ? (
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-[var(--sf)] bg-[#22c55e]" />
        ) : null}
      </button>

      {open ? (
        <div className="pub-chat rounded-[20px] border border-[var(--bd)] bg-[var(--sf)] text-[rgb(var(--bone))] shadow-[var(--sh)]">
          <div className="flex items-center justify-between border-b border-[var(--bd)] bg-[var(--s2)] px-4 py-4">
            <div className="min-w-0">
              <b className="block text-sm">Bilgeyis Mirzazada</b>
              <small className="text-[11px] text-[#22c55e]">{t("chat.online")}</small>
              {clientId ? (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[rgb(var(--mist))]">
                  <ClientFace name={clientName} src={clientAvatar} size={16} />
                  <span className="truncate">{clientName}</span>
                  <span className="truncate font-mono">{clientId}</span>
                </span>
              ) : null}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-lg text-[rgb(var(--mist))]">
              ✕
            </button>
          </div>
          <div ref={boxRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {!loaded ? (
              <p className="pt-16 text-center text-sm text-[rgb(var(--mist))]">{t("chat.loading")}</p>
            ) : messages.length === 0 ? (
              <div className="max-w-[80%] self-start rounded-[14px] rounded-bl bg-[var(--s2)] px-3.5 py-2.5 text-[13.5px]">
                {t("chat.hello")}
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender === "Client";
                return (
                  <div
                    key={keyOf(m) + m.sentAt}
                    className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[13.5px] ${
                      mine ? "chat-gold self-end rounded-br" : "self-start rounded-bl bg-[var(--s2)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              })
            )}
          </div>
          <div className="pub-chat-form border-t border-[var(--bd)] bg-[var(--sf)] p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("chat.placeholder")}
              className="rounded-full border border-[var(--bd)] bg-[rgb(var(--void))] px-3.5 py-2.5 text-[13.5px] text-[rgb(var(--bone))] outline-none placeholder:text-[rgb(var(--mist))] focus:border-[var(--g2)]"
            />
            <button type="button" data-cursor="link" onClick={send} className="gold-btn">
              {t("chat.send")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

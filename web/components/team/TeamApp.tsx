"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import { TeamLogin } from "@/components/team/TeamLogin";
import { Toasts } from "@/components/Toasts";
import { useToasts } from "@/hooks/useToasts";
import { api } from "@/lib/api";
import { staffAuth } from "@/lib/auth";
import { getApiUrl } from "@/lib/config";
import type { StaffJob } from "@/lib/types";

type OrderChatMsg = { content: string; mine: boolean };

function statusBadge(status: string) {
  if (status === "Tamamlandı")
    return <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">Tamamlandı</span>;
  if (status === "İcrada")
    return <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400">İcrada</span>;
  return <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300">Yeni</span>;
}

export function TeamApp() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(!!staffAuth.getToken());
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return <TeamLogin onSuccess={() => setAuthed(true)} />;
  return <TeamDashboard onLogout={() => setAuthed(false)} />;
}

function TeamDashboard({ onLogout }: { onLogout: () => void }) {
  const token = staffAuth.getToken() || "";
  const username = staffAuth.getUsername();
  const { toasts, push: toast } = useToasts();

  const [jobs, setJobs] = useState<StaffJob[]>([]);
  const [chats, setChats] = useState<Record<string, OrderChatMsg[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const connRef = useRef<HubConnection | null>(null);
  const joinedGroups = useRef(new Set<string>());

  function logout() {
    staffAuth.clear();
    onLogout();
  }

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.myAssignments(token);
      setJobs(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const joinOrderChat = useCallback(
    async (orderNumber: string) => {
      if (joinedGroups.current.has(orderNumber)) return;
      joinedGroups.current.add(orderNumber);
      if (connRef.current?.state === "Connected") {
        connRef.current.invoke("JoinOrderGroup", orderNumber).catch(() => {});
      }
      try {
        const messages = await api.orderMessages(orderNumber);
        setChats((prev) => ({
          ...prev,
          [orderNumber]: messages.map((m) => ({
            content: m.content,
            mine: m.sender !== "Client",
          })),
        }));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    jobs.forEach((j) => {
      if (j.clientChatEnabled) joinOrderChat(j.orderNumber);
    });
  }, [jobs, joinOrderChat]);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl(`${getApiUrl()}/notificationHub`)
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveNewAssignment", () => {
      toast("📥 Sizə yeni iş təyin olundu!");
      loadJobs();
    });

    conn.on("ReceiveMessage", (msg: { orderNumber: string; sender: string; content: string }) => {
      if (msg.sender !== "Client") return;
      setChats((prev) => ({
        ...prev,
        [msg.orderNumber]: [...(prev[msg.orderNumber] || []), { content: msg.content, mine: false }],
      }));
    });

    conn
      .start()
      .then(() => {
        conn.invoke("JoinStaffGroup", username).catch(() => {});
        joinedGroups.current.forEach((orderNumber) =>
          conn.invoke("JoinOrderGroup", orderNumber).catch(() => {}),
        );
      })
      .catch(() => {});

    connRef.current = conn;
    return () => {
      conn.stop().catch(() => {});
      connRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadStaffFile(id: number, file: File) {
    const res = await api.staffDeliverFile(id, file, token);
    if (res.ok) {
      toast("Fayl admin təsdiqinə göndərildi!");
      loadJobs();
    } else {
      alert("Fayl yüklənərkən xəta baş verdi.");
    }
  }

  function sendOrderChat(orderNumber: string) {
    const text = (inputs[orderNumber] || "").trim();
    if (!text || !connRef.current) return;
    setChats((prev) => ({
      ...prev,
      [orderNumber]: [...(prev[orderNumber] || []), { content: text, mine: true }],
    }));
    connRef.current
      .invoke("SendMessageToGroup", orderNumber, text, username)
      .then(() => setInputs((prev) => ({ ...prev, [orderNumber]: "" })))
      .catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[#080a11] p-4 text-[#e2e8f0]">
      <Toasts toasts={toasts} />
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-bold">
            👥 Komanda Paneli — <span className="text-indigo-300">{username}</span>
          </h1>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Çıxış
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-[#111422] p-4 text-sm text-neutral-400">
          Burada yalnız sizə təyin olunan işlər görünür. Müştərinin adı və əlaqə məlumatları
          paylaşılmır — hazır faylı yükləyin, admin yoxlayıb müştəriyə çatdıracaq.
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111422] p-8 text-center text-neutral-500">
            Hələ sizə təyin olunan iş yoxdur.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-white/10 bg-[#111422] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <strong className="text-emerald-400">{j.orderNumber}</strong>
                  {statusBadge(j.status)}
                </div>
                <p className="mb-1 text-sm">
                  <strong>Stil:</strong> {j.selectedProjectTitle || "Ümumi"}
                </p>
                <p className="mb-1 text-sm">
                  <strong>Büdcə:</strong> {j.budget}
                </p>
                <p className="mb-3 text-sm text-neutral-400">
                  <strong>Brief:</strong> {j.message}
                </p>

                {j.staffFileUrl && j.staffFileReady ? (
                  <p className="text-sm text-amber-400">⏳ Fayl göndərildi, admin təsdiqini gözləyir.</p>
                ) : j.staffFileUrl && !j.staffFileReady ? (
                  <p className="text-sm text-emerald-400">✅ Təsdiqləndi və müştəriyə çatdırıldı.</p>
                ) : (
                  <JobUploadRow onUpload={(file) => uploadStaffFile(j.id, file)} />
                )}

                {j.clientChatEnabled ? (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs text-neutral-400">
                      💬 Müştəri ilə birbaşa danışa bilərsiniz:
                    </p>
                    <div className="mb-2 flex max-h-52 flex-col gap-1.5 overflow-y-auto rounded-lg border border-white/10 bg-[#080a11] p-2.5">
                      {(chats[j.orderNumber] || []).map((m, i) => (
                        <div
                          key={i}
                          className={`max-w-[80%] rounded-md px-2.5 py-1.5 text-xs ${
                            m.mine ? "self-end bg-indigo-500" : "self-start bg-emerald-600"
                          }`}
                        >
                          {m.content}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={inputs[j.orderNumber] || ""}
                        onChange={(e) =>
                          setInputs((prev) => ({ ...prev, [j.orderNumber]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && sendOrderChat(j.orderNumber)}
                        placeholder="Mesaj yazın..."
                        className="flex-1 rounded-lg border border-white/10 bg-[#0d1019] px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => sendOrderChat(j.orderNumber)}
                        className="rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white"
                      >
                        Göndər
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobUploadRow({ onUpload }: { onUpload: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="flex-1 rounded-lg border border-white/10 bg-[#0d1019] px-3 py-2 text-sm text-neutral-300"
      />
      <button
        type="button"
        onClick={() => file && onUpload(file)}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
      >
        📤 Hazır faylı göndər
      </button>
    </div>
  );
}

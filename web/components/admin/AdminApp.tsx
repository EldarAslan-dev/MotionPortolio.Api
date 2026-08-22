"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AdminChatDock, AdminChatTrigger, type DmClient } from "@/components/admin/AdminChatDock";
import { FilePreview } from "@/components/admin/FilePreview";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AnnouncementSection } from "@/components/admin/sections/AnnouncementSection";
import { InquiriesSection } from "@/components/admin/sections/InquiriesSection";
import { NotesSection } from "@/components/admin/sections/NotesSection";
import { PasswordSection } from "@/components/admin/sections/PasswordSection";
import { PortfolioSection } from "@/components/admin/sections/PortfolioSection";
import { TeamSection } from "@/components/admin/sections/TeamSection";
import { TestimonialsSection } from "@/components/admin/sections/TestimonialsSection";
import { UploadSection } from "@/components/admin/sections/UploadSection";
import { Toasts } from "@/components/Toasts";
import { playNotificationSound, useToasts } from "@/hooks/useToasts";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import { API_URL, mediaUrl } from "@/lib/config";
import type { Inquiry, Project, StaffUser, StudioProfile, Testimonial } from "@/lib/types";

const SECTIONS = [
  { id: "inquiries", label: "📥 Müraciətlər" },
  { id: "upload", label: "🎬 Animasiya Paylaş" },
  { id: "portfolio", label: "📦 Portfel İdarəsi" },
  { id: "testimonials", label: "💬 Gələn Rəylər" },
  { id: "announcement", label: "📢 Vitrin Elanı" },
  { id: "notes", label: "📝 Qeydlər" },
  { id: "password", label: "🔒 Şifrə Dəyiş" },
  { id: "team", label: "👥 Komanda" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(!!adminAuth.getToken());
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const token = adminAuth.getToken() || "";
  const { toasts, push: toast } = useToasts();

  const [section, setSection] = useState<SectionId>("inquiries");
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  const [chatStore, setChatStore] = useState<Record<string, DmClient>>({});
  const [activeDmClient, setActiveDmClient] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBadge, setChatBadge] = useState(false);

  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<{ id: string; name: string } | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editAvatarOpen, setEditAvatarOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);

  const connRef = useRef<HubConnection | null>(null);

  const loadProfile = useCallback(async () => {
    const p = await api.profile();
    setProfile(p);
    try {
      setNotes(JSON.parse(p.notesJson || "[]"));
    } catch {
      setNotes([]);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setProjects(await api.projects());
  }, []);

  const loadTestimonials = useCallback(async () => {
    try {
      setTestimonials(await api.testimonials());
    } catch {
      /* ignore */
    }
  }, []);

  const loadStaffList = useCallback(async () => {
    try {
      setStaffList(await api.staffList(token));
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadInquiries = useCallback(async () => {
    try {
      setInquiries(await api.inquiries(token));
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadClientsForDm = useCallback(async () => {
    try {
      const conversations = await api.conversations(token);
      setChatStore((prev) => {
        const next = { ...prev };
        conversations.forEach((c) => {
          next[c.clientId] = {
            name: c.clientName || c.clientId,
            messages: next[c.clientId]?.messages || [],
            lastMessage: c.lastMessage,
            lastSender: c.lastSender,
            lastAt: c.lastAt,
          };
        });
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
    loadProjects();
    loadTestimonials();
    loadStaffList().then(loadInquiries);
    loadClientsForDm();
  }, [loadProfile, loadProjects, loadTestimonials, loadStaffList, loadInquiries, loadClientsForDm]);

  const addMessageToStore = useCallback(
    (clientId: string, sender: string, content: string, label?: string) => {
      setChatStore((prev) => {
        const existing = prev[clientId] || { name: clientId, messages: [] };
        return {
          ...prev,
          [clientId]: {
            ...existing,
            messages: [...existing.messages, { sender, content, label }],
            lastMessage: content,
            lastSender: sender,
            lastAt: new Date().toISOString(),
          },
        };
      });
    },
    [],
  );

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/notificationHub`)
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveInquiryNotification", (inquiry: Inquiry) => {
      playNotificationSound();
      toast(`⚡ Yeni Sifariş: ${inquiry.clientName}`);
      loadInquiries();
      const cId = inquiry.clientId || inquiry.clientEmail;
      if (cId) {
        setChatStore((prev) => ({
          ...prev,
          [cId]: prev[cId] || { name: inquiry.clientName || cId, messages: [] },
        }));
      }
    });

    conn.on("ReceiveStaffFileReady", (data: { orderNumber: string }) => {
      playNotificationSound();
      toast(`📦 Komanda faylı hazırdır: ${data.orderNumber}`);
      loadInquiries();
    });

    conn.on(
      "ReceiveGeneralMessage",
      (
        sender: string,
        content: string,
        msgClientId?: string,
        msgClientName?: string,
        isAuto?: boolean,
      ) => {
        if (!msgClientId) return;
        setChatStore((prev) => ({
          ...prev,
          [msgClientId]:
            prev[msgClientId] && msgClientName && msgClientName !== msgClientId
              ? { ...prev[msgClientId], name: msgClientName }
              : prev[msgClientId] || { name: msgClientName || msgClientId, messages: [] },
        }));

        if (sender === "Client") {
          playNotificationSound();
          toast("💬 Yeni müştəri mesajı gəldi!");
          setChatOpen((open) => {
            if (!open) setChatBadge(true);
            return open;
          });
          addMessageToStore(msgClientId, "Client", content);
        } else if (isAuto) {
          addMessageToStore(msgClientId, "Admin", content, "Siz (Auto)");
        }
      },
    );

    conn
      .start()
      .then(() => conn.invoke("JoinGeneralSupport"))
      .catch(() => {});

    connRef.current = conn;
    return () => {
      conn.stop().catch(() => {});
      connRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectDmClient(clientId: string) {
    setActiveDmClient(clientId);
    try {
      const messages = await api.adminClientMessages(clientId, token);
      setChatStore((prev) => {
        const existing = prev[clientId] || { name: clientId, messages: [] };
        return {
          ...prev,
          [clientId]: {
            ...existing,
            messages: messages.map((m) => ({
              sender: m.sender,
              content: m.content,
              label: m.sender === "Admin" ? "Siz" : existing.name,
            })),
          },
        };
      });
    } catch {
      /* ignore */
    }
  }

  function sendDm(clientId: string, text: string) {
    const target = chatStore[clientId]?.name || clientId;
    connRef.current
      ?.invoke("SendGeneralMessage", clientId, target, "Admin", text)
      .then(() => addMessageToStore(clientId, "Admin", text, "Siz"))
      .catch(() => {});
  }

  async function deleteConversation(clientId: string) {
    const name = chatStore[clientId]?.name || clientId;
    if (!confirm(`"${name}" ilə söhbəti tamamilə silmək istəyirsiniz?`)) return;
    const res = await api.deleteConversation(clientId, token);
    if (res.ok) {
      setChatStore((prev) => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });
      if (activeDmClient === clientId) setActiveDmClient(null);
      toast("Söhbət silindi.");
    }
  }

  async function clearMessages(clientId: string) {
    if (!confirm("Bu müştərinin bütün mesaj tarixçəsini silmək istəyirsiniz?")) return;
    const res = await api.clearClientMessages(clientId, token);
    if (res.ok) {
      setChatStore((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], messages: [] },
      }));
      toast("Mesajlar silindi. Müştəri saxlanıldı.");
    }
  }

  async function saveProfile(patch: Partial<StudioProfile>) {
    if (!profile) return;
    const updated = { ...profile, ...patch, notesJson: JSON.stringify(notes) };
    setProfile(updated);
    await api.updateProfile(updated);
  }

  useEffect(() => {
    if (!profile) return;
    api.updateProfile({ ...profile, notesJson: JSON.stringify(notes) }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  async function onStatusChange(id: number, status: string, orderNumber: string) {
    const res = await api.updateInquiryStatus(id, status, token);
    if (res.ok) {
      toast("Status yeniləndi!");
      connRef.current?.invoke("UpdateStatus", orderNumber, status).catch(() => {});
      loadInquiries();
    }
  }

  async function onAssign(id: number, username: string) {
    const res = await api.assignStaff(id, username, token);
    if (res.ok) {
      toast(username ? `Təyin edildi: ${username}` : "Təyinat ləğv edildi");
      loadInquiries();
    }
  }

  async function onApproveStaffFile(id: number) {
    if (!confirm("Komanda üzvünün göndərdiyi fayl müştəriyə təhvil veriləcək. Davam edilsin?"))
      return;
    const res = await api.approveStaffFile(id, token);
    if (res.ok) {
      toast("Fayl müştəriyə göndərildi!");
      loadInquiries();
    }
  }

  async function onToggleClientChat(id: number) {
    const res = await api.toggleClientChat(id, token);
    if (res.ok) {
      const data = await res.json();
      toast(
        data.clientChatEnabled
          ? "Çat körpüsü açıldı — komanda üzvü müştəri ilə birbaşa danışa bilər"
          : "Çat körpüsü bağlandı",
      );
    }
    loadInquiries();
  }

  async function onDeliverFile(id: number, file: File, orderNumber: string) {
    const res = await api.deliverFile(id, file, token);
    if (res.ok) {
      toast("🎉 Fayl müştəriyə uğurla təhvil verildi!");
      connRef.current?.invoke("UpdateStatus", orderNumber, "Tamamlandı").catch(() => {});
      loadInquiries();
    } else {
      alert("Faylın göndərilməsində xəta baş verdi.");
    }
  }

  async function onDeleteInquiry(id: number, orderNumber: string) {
    if (!confirm("Bu müraciəti silmək istəyirsiniz?")) return;
    const res = await api.deleteInquiry(id, token);
    if (res.ok) {
      toast("İş silindi.");
      connRef.current?.invoke("NotifyOrderDeleted", orderNumber).catch(() => {});
      loadInquiries();
    }
  }

  async function onSaveProfileInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await saveProfile({
      designerName: String(form.get("name") || ""),
      bio: String(form.get("bio") || ""),
      instagramUrl: String(form.get("instagram") || ""),
    });
    setEditProfileOpen(false);
    toast("Profil məlumatları yeniləndi!");
  }

  async function onSaveAvatar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!avatarFile) return;
    const uploadRes = await api.upload(avatarFile);
    if (uploadRes.ok) {
      const data = await uploadRes.json();
      await saveProfile({ avatarUrl: data.url });
      setEditAvatarOpen(false);
      setAvatarFile(null);
      toast("Profil şəkli yeniləndi!");
    }
  }

  async function onPublishStory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!storyFile) return;
    const form = new FormData(e.currentTarget);
    const uploadRes = await api.upload(storyFile);
    if (!uploadRes.ok) return;
    const uploaded = await uploadRes.json();
    const res = await api.createStory({
      title: String(form.get("title") || ""),
      mediaUrl: uploaded.url,
      mediaType: storyFile.type.startsWith("video") ? "video" : "image",
    });
    if (res.ok) {
      toast("✨ Story uğurla paylaşıldı!");
      setStoryModalOpen(false);
      setStoryFile(null);
    }
  }

  const uniqueClients = Array.from(
    new Map(
      inquiries
        .filter((i) => i.clientId || i.clientEmail)
        .map((i) => [
          i.clientId || i.clientEmail,
          { clientId: i.clientId || "—", clientName: i.clientName || "Naməlum", clientEmail: i.clientEmail || "—" },
        ]),
    ).values(),
  );

  const historyInquiries = historyClient
    ? inquiries.filter(
        (i) => i.clientId === historyClient.id || i.clientName === historyClient.name,
      )
    : [];

  if (!profile) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 pb-24 text-white">
      <Toasts toasts={toasts} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950 to-fuchsia-950 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 shrink-0 cursor-pointer"
              onClick={() => setStoryModalOpen(true)}
              title="Story paylaş"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(profile.avatarUrl)}
                  alt=""
                  className="h-full w-full rounded-full border-2 border-fuchsia-400 object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-fuchsia-500/30 text-xl">
                  🎬
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditAvatarOpen(true);
                }}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500 text-[10px]"
              >
                🖼️
              </button>
            </div>
            <div>
              <span className="mono font-mono text-[11px] uppercase text-neutral-400">
                Admin Panel
              </span>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{profile.designerName}</h1>
                <button type="button" onClick={() => setEditProfileOpen(true)} title="Redaktə et">
                  ✏️
                </button>
              </div>
              <p className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-sm font-semibold text-transparent">
                {profile.bio}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setClientsModalOpen(true)}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
            >
              👥 Müştərilər
            </button>
            <button
              type="button"
              onClick={() => {
                adminAuth.clear();
                onLogout();
              }}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Çıxış
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 p-2 lg:sticky lg:top-4 lg:h-fit lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  section === s.id
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div>
            {section === "inquiries" ? (
              <InquiriesSection
                inquiries={inquiries}
                staffList={staffList}
                onStatusChange={onStatusChange}
                onAssign={onAssign}
                onApproveStaffFile={onApproveStaffFile}
                onToggleClientChat={onToggleClientChat}
                onDeliverFile={onDeliverFile}
                onDelete={onDeleteInquiry}
              />
            ) : null}
            {section === "upload" ? (
              <UploadSection token={token} onUploaded={loadProjects} onToast={toast} />
            ) : null}
            {section === "portfolio" ? (
              <PortfolioSection
                projects={projects}
                token={token}
                onChanged={loadProjects}
                onToast={toast}
              />
            ) : null}
            {section === "testimonials" ? (
              <TestimonialsSection
                testimonials={testimonials}
                token={token}
                onChanged={loadTestimonials}
                onToast={toast}
              />
            ) : null}
            {section === "announcement" ? (
              <AnnouncementSection profile={profile} onSave={saveProfile} />
            ) : null}
            {section === "notes" ? <NotesSection notes={notes} onChange={setNotes} /> : null}
            {section === "password" ? <PasswordSection token={token} /> : null}
            {section === "team" ? (
              <TeamSection
                staffList={staffList}
                token={token}
                onChanged={loadStaffList}
                onToast={toast}
              />
            ) : null}
          </div>
        </div>
      </div>

      <AdminChatTrigger
        onClick={() => {
          setChatOpen((v) => !v);
          setChatBadge(false);
        }}
        hasBadge={chatBadge}
      />
      <AdminChatDock
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        store={chatStore}
        activeClientId={activeDmClient}
        onSelect={selectDmClient}
        onSend={sendDm}
        onDeleteConversation={deleteConversation}
        onClearMessages={clearMessages}
      />

      {clientsModalOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setClientsModalOpen(false)}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-indigo-300">👥 Qeydiyyatlı Müştərilər</h2>
              <button type="button" onClick={() => setClientsModalOpen(false)} className="text-2xl">
                ×
              </button>
            </div>
            <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-neutral-500">
                    <th className="border-b border-white/10 px-2 py-2">Müştəri ID</th>
                    <th className="border-b border-white/10 px-2 py-2">Ad</th>
                    <th className="border-b border-white/10 px-2 py-2">Email</th>
                    <th className="border-b border-white/10 px-2 py-2">Tarixçə</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-500">
                        Qeydiyyatlı müştəri tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    uniqueClients.map((c) => (
                      <tr key={c.clientId} className="border-b border-white/5 text-white">
                        <td className="px-2 py-2 font-semibold text-emerald-400">{c.clientId}</td>
                        <td className="px-2 py-2">{c.clientName}</td>
                        <td className="px-2 py-2 text-neutral-400">{c.clientEmail}</td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryClient({ id: c.clientId, name: c.clientName });
                              setClientsModalOpen(false);
                            }}
                            className="rounded-md bg-white/10 px-2 py-1 text-xs"
                          >
                            Tarixçəyə bax
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {historyClient ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setHistoryClient(null)}
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-emerald-400">
                📦 {historyClient.name} ({historyClient.id}) — Tarixçə
              </h2>
              <button type="button" onClick={() => setHistoryClient(null)} className="text-2xl">
                ×
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {historyInquiries.length === 0 ? (
                <p className="text-center text-sm text-neutral-500">
                  Bu müştərinin hələ heç bir sifarişi yoxdur.
                </p>
              ) : (
                historyInquiries.map((i) => (
                  <div key={i.id} className="rounded-xl border border-white/10 bg-neutral-950 p-3">
                    <div className="mb-1.5 flex justify-between">
                      <strong className="text-emerald-400">{i.orderNumber}</strong>
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                        {i.status}
                      </span>
                    </div>
                    <p className="text-sm">
                      <strong>Stil:</strong> {i.selectedProjectTitle || "Ümumi"}
                    </p>
                    <p className="text-sm">
                      <strong>Büdcə:</strong> {i.budget}
                    </p>
                    <p className="text-sm text-neutral-400">
                      <strong>Mesaj:</strong> {i.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editProfileOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditProfileOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-bold">✏️ Profil Məlumatları</h2>
            <form onSubmit={onSaveProfileInfo} className="space-y-3">
              <input
                name="name"
                defaultValue={profile.designerName}
                required
                placeholder="Ad və Soyad"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <input
                name="bio"
                defaultValue={profile.bio}
                required
                placeholder="Peşə / Təsvir"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <input
                name="instagram"
                defaultValue={profile.instagramUrl}
                placeholder="Instagram Linki"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white"
              >
                Yadda Saxla
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {editAvatarOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditAvatarOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-bold">🖼️ Profil Şəklini Yenilə</h2>
            <form onSubmit={onSaveAvatar} className="space-y-3">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-neutral-300"
              />
              <FilePreview file={avatarFile} square />
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white"
              >
                Yüklə
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {storyModalOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setStoryModalOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h3 className="mb-4 text-lg font-bold text-pink-400">📸 Story Paylaş</h3>
            <form onSubmit={onPublishStory} className="space-y-3">
              <input
                name="title"
                required
                placeholder="Məs: 🎉 Yeni layihə!"
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
              <input
                type="file"
                accept="image/*,video/*"
                required
                onChange={(e) => setStoryFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-neutral-300"
              />
              <FilePreview file={storyFile} />
              <button
                type="submit"
                className="w-full rounded-lg bg-pink-500 py-2.5 text-sm font-semibold text-white"
              >
                Paylaş
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

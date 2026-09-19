"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AdminChatDock, AdminChatTrigger, type DmClient } from "@/components/admin/AdminChatDock";
import { FilePreview } from "@/components/admin/FilePreview";
import { AdminFilePick, adminBtn, adminBtnGhost, adminFieldClass } from "@/components/admin/ui";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AboutSection } from "@/components/admin/sections/AboutSection";
import { AnnouncementSection } from "@/components/admin/sections/AnnouncementSection";
import { InquiriesSection } from "@/components/admin/sections/InquiriesSection";
import { NotesSection } from "@/components/admin/sections/NotesSection";
import { PasswordSection } from "@/components/admin/sections/PasswordSection";
import { PortfolioSection } from "@/components/admin/sections/PortfolioSection";
import { SiteImagesSection } from "@/components/admin/sections/SiteImagesSection";
import { TeamSection } from "@/components/admin/sections/TeamSection";
import { TestimonialsSection } from "@/components/admin/sections/TestimonialsSection";
import { UploadSection } from "@/components/admin/sections/UploadSection";
import { Toasts } from "@/components/Toasts";
import { playNotificationSound, useToasts } from "@/hooks/useToasts";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import { getApiUrl, mediaUrl, normalizeProject } from "@/lib/config";
import type { ClientLogo, Inquiry, Project, StaffUser, StudioProfile, Testimonial } from "@/lib/types";

const NAV = [
  { id: "inquiries", label: "Müraciətlər", group: "İş axını" },
  { id: "testimonials", label: "Rəylər", group: "İş axını" },
  { id: "site", label: "Sayt məzmunu", group: "Sayt" },
  { id: "work", label: "Portfel", group: "Sayt" },
  { id: "studio", label: "Parametrlər", group: "Studiya" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = adminAuth.getToken();
    if (!token) {
      setAuthed(false);
      setChecked(true);
      return;
    }
    api
      .me(token)
      .then(() => setAuthed(true))
      .catch(() => {
        adminAuth.clear();
        setAuthed(false);
      })
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    const onLost = () => {
      adminAuth.clear();
      setAuthed(false);
    };
    window.addEventListener("admin-auth-lost", onLost);
    return () => window.removeEventListener("admin-auth-lost", onLost);
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void text-sm text-mist">
        Yüklənir…
      </div>
    );
  }
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
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
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
    setProfile({
      ...p,
      heroVideoUrl: p.heroVideoUrl || (p as { HeroVideoUrl?: string }).HeroVideoUrl || "",
      aboutPhotoUrl: p.aboutPhotoUrl || (p as { AboutPhotoUrl?: string }).AboutPhotoUrl || "",
      aboutTeaser: p.aboutTeaser || (p as { AboutTeaser?: string }).AboutTeaser || "",
      aboutBody: p.aboutBody || (p as { AboutBody?: string }).AboutBody || "",
      toolsJson: p.toolsJson || (p as { ToolsJson?: string }).ToolsJson || "[]",
      heroGalleryJson: p.heroGalleryJson || (p as { HeroGalleryJson?: string }).HeroGalleryJson || "[]",
    });
    try {
      setNotes(JSON.parse(p.notesJson || "[]"));
    } catch {
      setNotes([]);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    const list = await api.projects();
    setProjects(
      list.map((p) => normalizeProject(p)),
    );
  }, []);

  const loadTestimonials = useCallback(async () => {
    try {
      setTestimonials(await api.testimonials());
    } catch {
      /* ignore */
    }
  }, []);

  const loadClientLogos = useCallback(async () => {
    try {
    const logos = await api.clientLogos();
      setClientLogos(
        logos.map((l) => ({
          id: l.id || (l as { Id?: number }).Id || 0,
          name: l.name || (l as { Name?: string }).Name || "",
          logoUrl: l.logoUrl || (l as { LogoUrl?: string }).LogoUrl || "",
          sortOrder: l.sortOrder ?? (l as { SortOrder?: number }).SortOrder ?? 0,
        })),
      );
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
    loadClientLogos();
    loadStaffList().then(loadInquiries);
    loadClientsForDm();
  }, [loadProfile, loadProjects, loadTestimonials, loadClientLogos, loadStaffList, loadInquiries, loadClientsForDm]);

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
      .withUrl(`${getApiUrl()}/notificationHub`)
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
    const updated = {
      ...profile,
      ...patch,
      notesJson: JSON.stringify(notes),
      heroVideoUrl: patch.heroVideoUrl !== undefined ? patch.heroVideoUrl : profile.heroVideoUrl || "",
      aboutPhotoUrl: patch.aboutPhotoUrl !== undefined ? patch.aboutPhotoUrl : profile.aboutPhotoUrl || "",
      aboutTeaser: patch.aboutTeaser !== undefined ? patch.aboutTeaser : profile.aboutTeaser || "",
      aboutBody: patch.aboutBody !== undefined ? patch.aboutBody : profile.aboutBody || "",
      toolsJson: patch.toolsJson !== undefined ? patch.toolsJson : profile.toolsJson || "[]",
      heroGalleryJson:
        patch.heroGalleryJson !== undefined ? patch.heroGalleryJson : profile.heroGalleryJson || "[]",
    };
    const res = await api.updateProfile(updated, token);
    if (!res.ok) {
      toast("Yadda saxlamaq olmadı.");
      return;
    }
    try {
      const p = await api.profile();
      setProfile({
        ...p,
        heroVideoUrl: p.heroVideoUrl || updated.heroVideoUrl || "",
        aboutPhotoUrl: p.aboutPhotoUrl || updated.aboutPhotoUrl || "",
        aboutTeaser:
          p.aboutTeaser || (p as { AboutTeaser?: string }).AboutTeaser || updated.aboutTeaser || "",
        aboutBody: p.aboutBody || (p as { AboutBody?: string }).AboutBody || updated.aboutBody || "",
        toolsJson: p.toolsJson || (p as { ToolsJson?: string }).ToolsJson || updated.toolsJson || "[]",
        heroGalleryJson: p.heroGalleryJson || updated.heroGalleryJson || "[]",
      });
    } catch {
      setProfile(updated);
    }
  }

  useEffect(() => {
    if (!profile) return;
    api
      .updateProfile({
        ...profile,
        notesJson: JSON.stringify(notes),
        heroVideoUrl: profile.heroVideoUrl || "",
        aboutPhotoUrl: profile.aboutPhotoUrl || "",
        aboutTeaser: profile.aboutTeaser || "",
        aboutBody: profile.aboutBody || "",
        toolsJson: profile.toolsJson || "[]",
        heroGalleryJson: profile.heroGalleryJson || "[]",
      }, token)
      .catch(() => {});
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
      toast("Faylın göndərilməsində xəta baş verdi.");
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
    }, token);
    if (res.ok) {
      toast("Story paylaşıldı.");
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-void text-sm text-mist">
        Yüklənir…
      </div>
    );
  }

  return (
    <div className="admin-app p-4 pb-28 text-bone sm:p-6">
      <Toasts toasts={toasts} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-5 rounded-2xl border border-line bg-surface/80 px-5 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line"
              onClick={() => setStoryModalOpen(true)}
              title="Story paylaş"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(profile.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-void text-xs uppercase tracking-wider text-mist">
                  BM
                </span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-mist">Studiya paneli</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.03em] text-bone">
                  {profile.designerName}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(true)}
                  className="text-xs text-mist underline-offset-4 hover:text-bone hover:underline"
                >
                  Profil
                </button>
                <button
                  type="button"
                  onClick={() => setEditAvatarOpen(true)}
                  className="text-xs text-mist underline-offset-4 hover:text-bone hover:underline"
                >
                  Şəkil
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setClientsModalOpen(true)}
              className="rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-bone"
            >
              Müştərilər
            </button>
            <button
              type="button"
              onClick={() => {
                adminAuth.clear();
                onLogout();
              }}
              className="rounded-xl bg-bone px-3.5 py-2 text-xs font-semibold text-void"
            >
              Çıxış
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-2 lg:sticky lg:top-5 lg:h-fit lg:flex-col lg:overflow-visible">
            {NAV.map((s, i) => {
              const prev = NAV[i - 1];
              const showGroup = s.group !== prev?.group;
              const newCount =
                s.id === "inquiries" ? inquiries.filter((item) => item.status === "Yeni").length : 0;
              return (
                <div key={s.id} className={showGroup ? "lg:mt-3 lg:first:mt-0" : ""}>
                  {showGroup ? (
                    <p className="mb-1 hidden px-2 pt-1 text-[10px] uppercase tracking-[0.2em] text-mist lg:block">
                      {s.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`flex w-full items-center justify-between whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      section === s.id
                        ? "bg-bone font-semibold text-void"
                        : "text-mist hover:bg-bone/5 hover:text-bone"
                    }`}
                  >
                    {s.label}
                    {newCount > 0 ? (
                      <span
                        className={`ml-2 min-w-5 rounded-full px-1.5 text-center text-[10px] font-semibold ${
                          section === s.id ? "bg-void/15 text-void" : "bg-bone/10 text-bone"
                        }`}
                      >
                        {newCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="min-w-0 space-y-5">
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
            {section === "testimonials" ? (
              <TestimonialsSection
                testimonials={testimonials}
                token={token}
                onChanged={loadTestimonials}
                onToast={toast}
              />
            ) : null}
            {section === "site" ? (
              <>
                <AnnouncementSection profile={profile} onSave={saveProfile} onToast={toast} />
                <AboutSection
                  profile={profile}
                  token={token}
                  onSave={saveProfile}
                  onToast={toast}
                />
                <SiteImagesSection
                  profile={profile}
                  logos={clientLogos}
                  token={token}
                  onSaveProfile={saveProfile}
                  onLogosChanged={loadClientLogos}
                  onToast={toast}
                />
              </>
            ) : null}
            {section === "work" ? (
              <>
                <UploadSection token={token} onUploaded={loadProjects} onToast={toast} />
                <PortfolioSection
                  projects={projects}
                  token={token}
                  onChanged={loadProjects}
                  onToast={toast}
                />
              </>
            ) : null}
            {section === "studio" ? (
              <>
                <NotesSection notes={notes} onChange={setNotes} />
                <TeamSection
                  staffList={staffList}
                  token={token}
                  onChanged={loadStaffList}
                  onToast={toast}
                />
                <PasswordSection token={token} onToast={toast} />
              </>
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
          className="fixed inset-0 z-[170] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setClientsModalOpen(false)}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-bone">Müştərilər</h2>
              <button
                type="button"
                onClick={() => setClientsModalOpen(false)}
                className="text-2xl leading-none text-mist hover:text-bone"
              >
                ×
              </button>
            </div>
            <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-mist">
                    <th className="border-b border-line px-2 py-2">Müştəri ID</th>
                    <th className="border-b border-line px-2 py-2">Ad</th>
                    <th className="border-b border-line px-2 py-2">Email</th>
                    <th className="border-b border-line px-2 py-2">Tarixçə</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-mist">
                        Qeydiyyatlı müştəri tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    uniqueClients.map((c) => (
                      <tr key={c.clientId} className="border-b border-line text-bone">
                        <td className="px-2 py-2 font-mono text-sm font-semibold">{c.clientId}</td>
                        <td className="px-2 py-2">{c.clientName}</td>
                        <td className="px-2 py-2 text-mist">{c.clientEmail}</td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryClient({ id: c.clientId, name: c.clientName });
                              setClientsModalOpen(false);
                            }}
                            className={adminBtnGhost}
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
          className="fixed inset-0 z-[170] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setHistoryClient(null)}
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-bone">
                {historyClient.name} — tarixçə
              </h2>
              <button
                type="button"
                onClick={() => setHistoryClient(null)}
                className="text-2xl leading-none text-mist hover:text-bone"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {historyInquiries.length === 0 ? (
                <p className="text-center text-sm text-mist">Bu müştərinin hələ heç bir sifarişi yoxdur.</p>
              ) : (
                historyInquiries.map((i) => (
                  <div key={i.id} className="rounded-xl border border-line bg-void p-3">
                    <div className="mb-1.5 flex justify-between">
                      <strong className="font-mono text-sm text-bone">{i.orderNumber}</strong>
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs text-mist">
                        {i.status}
                      </span>
                    </div>
                    <p className="text-sm text-bone">
                      <span className="text-mist">Stil:</span> {i.selectedProjectTitle || "Ümumi"}
                    </p>
                    <p className="text-sm text-bone">
                      <span className="text-mist">Büdcə:</span> {i.budget}
                    </p>
                    <p className="text-sm text-mist">{i.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editProfileOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditProfileOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-bone">Profil</h2>
            <form onSubmit={onSaveProfileInfo} className="space-y-3">
              <input
                name="name"
                defaultValue={profile.designerName}
                required
                placeholder="Ad və soyad"
                className={adminFieldClass}
              />
              <input
                name="bio"
                defaultValue={profile.bio}
                required
                placeholder="Peşə / təsvir"
                className={adminFieldClass}
              />
              <input
                name="instagram"
                defaultValue={profile.instagramUrl}
                placeholder="Instagram linki"
                className={adminFieldClass}
              />
              <button type="submit" className={`${adminBtn} w-full`}>
                Yadda saxla
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {editAvatarOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditAvatarOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-bone">Profil şəkli</h2>
            <form onSubmit={onSaveAvatar} className="space-y-3">
              <AdminFilePick
                id="admin-avatar"
                label="Şəkil seç"
                accept="image/*"
                filename={avatarFile?.name}
                onChange={(files) => setAvatarFile(files[0] || null)}
              />
              <FilePreview file={avatarFile} square />
              <button type="submit" className={`${adminBtn} w-full`}>
                Yüklə
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {storyModalOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-void/80 p-4"
          onClick={(e) => e.target === e.currentTarget && setStoryModalOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-bone">Story paylaş</h3>
            <form onSubmit={onPublishStory} className="space-y-3">
              <input
                name="title"
                required
                placeholder="Məs: Yeni layihə"
                className={adminFieldClass}
              />
              <AdminFilePick
                id="admin-story"
                label="Fayl seç"
                accept="image/*,video/*"
                filename={storyFile?.name}
                onChange={(files) => setStoryFile(files[0] || null)}
              />
              <FilePreview file={storyFile} />
              <button type="submit" className={`${adminBtn} w-full`}>
                Paylaş
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

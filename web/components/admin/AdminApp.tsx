"use client";

import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AdminChatDock, AdminChatTrigger, type DmClient } from "@/components/admin/AdminChatDock";
import { ClientFace } from "@/components/ClientFace";
import { FilePreview } from "@/components/admin/FilePreview";
import { AdminFilePick, adminBtn, adminBtnGhost, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AboutSection } from "@/components/admin/sections/AboutSection";
import { AppearanceSection } from "@/components/admin/sections/AppearanceSection";
import { OffersSection } from "@/components/admin/sections/OffersSection";
import { AnnouncementSection } from "@/components/admin/sections/AnnouncementSection";
import { HeroGallerySection } from "@/components/admin/sections/HeroGallerySection";
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
import { AccountsSection } from "@/components/admin/sections/AccountsSection";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import { getApiUrl, mediaUrl, normalizeProject } from "@/lib/config";
import type { ClientLogo, Inquiry, Project, StaffUser, StudioProfile, Testimonial } from "@/lib/types";

const NAV = [
  { id: "inquiries", key: "nav.inquiries", group: "group.workflow" },
  { id: "accounts", key: "nav.accounts", group: "group.workflow" },
  { id: "testimonials", key: "nav.testimonials", group: "group.workflow" },
  { id: "appearance", key: "nav.appearance", group: "group.site" },
  { id: "brief", key: "nav.brief", group: "group.site" },
  { id: "announce", key: "nav.announce", group: "group.site" },
  { id: "about", key: "nav.about", group: "group.site" },
  { id: "logos", key: "nav.logos", group: "group.site" },
  { id: "hero", key: "nav.hero", group: "group.site" },
  { id: "work", key: "nav.workAdmin", group: "group.site" },
  { id: "studio", key: "nav.studio", group: "group.studio" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

export function AdminApp() {
  const { t } = useI18n();
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
      <div className="admin-app flex min-h-screen items-center justify-center text-sm text-mist">
        {t("admin.loading")}
      </div>
    );
  }
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const token = adminAuth.getToken() || "";
  const { toasts, push: toast } = useToasts();

  const [section, setSection] = useState<SectionId>("inquiries");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState<"dark" | "light">("dark");
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

  useEffect(() => {
    setAdminTheme(document.documentElement.getAttribute("data-theme") === "admin-light" ? "light" : "dark");
  }, []);

  function toggleAdminTheme() {
    const next = adminTheme === "dark" ? "light" : "dark";
    setAdminTheme(next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "admin-light" : "obsidian");
    try {
      localStorage.setItem("adm-theme", next);
    } catch {
      /* ignore */
    }
  }

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
            avatarUrl: c.avatarUrl,
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
          [cId]: prev[cId] || {
            name: inquiry.clientName || cId,
            avatarUrl: inquiry.clientAvatarUrl,
            messages: [],
          },
        }));
      }
    });

    conn.on("ReceiveStaffFileReady", (data: { orderNumber: string }) => {
      playNotificationSound();
      toast(`📦 Komanda faylı hazırdır: ${data.orderNumber}`);
      loadInquiries();
    });

    conn.on("ReceiveReceiptUploaded", (data: { orderNumber: string }) => {
      playNotificationSound();
      toast(`Çek yükləndi: ${data.orderNumber}`);
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

  async function selectDmClient(clientId: string, profile?: { name?: string; avatarUrl?: string | null }) {
    setActiveDmClient(clientId);
    setChatOpen(true);
    let messages: { sender: string; content: string }[] = [];
    try {
      messages = await api.adminClientMessages(clientId, token);
    } catch {
      messages = [];
    }
    setChatStore((prev) => {
      const existing = prev[clientId] || {
        name: profile?.name || clientId,
        avatarUrl: profile?.avatarUrl,
        messages: [],
      };
      return {
        ...prev,
        [clientId]: {
          ...existing,
          name: existing.name && existing.name !== clientId ? existing.name : profile?.name || existing.name,
          avatarUrl: existing.avatarUrl || profile?.avatarUrl,
          messages: messages.map((m) => ({
            sender: m.sender,
            content: m.content,
            label: m.sender === "Admin" ? "Siz" : existing.name,
          })),
        },
      };
    });
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
    if (!confirm("Komanda faylı hazır sayılacaq və müştəriyə ödəniş bildirişi gedəcək. Fayl hələ göndərilməyəcək."))
      return;
    const res = await api.approveStaffFile(id, token);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      toast(data?.message || "Ödəniş bildirişi göndərildi.");
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

  async function onPrepareDelivery(inquiry: Inquiry, file: File | null, link: string) {
    if (!confirm(`Ödəniş bildirişi ${inquiry.clientEmail} ünvanına göndərilsin?`)) return;
    const res = await api.prepareDelivery(inquiry.id, file, link, token);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      toast(data?.message || "Ödəniş bildirişi göndərildi.");
      connRef.current?.invoke("UpdateStatus", inquiry.orderNumber, "Ödəniş gözlənilir").catch(() => {});
      loadInquiries();
    } else {
      toast(data?.message || "Təhvil hazırlanmadı.");
    }
  }

  async function onConfirmPayment(inquiry: Inquiry) {
    if (!confirm("Ödəniş təsdiqlənsin və fayl müştəriyə göndərilsin?")) return;
    const res = await api.confirmPayment(inquiry.id, token);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      toast(data?.message || "Fayllar göndərildi.");
      connRef.current?.invoke("UpdateStatus", inquiry.orderNumber, "Tamamlandı").catch(() => {});
      loadInquiries();
    } else {
      toast(data?.message || "Ödəniş təsdiqlənmədi.");
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
          {
            clientId: i.clientId || "—",
            clientName: i.clientName || "Naməlum",
            clientEmail: i.clientEmail || "—",
            avatarUrl: i.clientAvatarUrl || "",
          },
        ]),
    ).values(),
  );

  const historyInquiries = historyClient
    ? inquiries.filter((i) => {
        const email = uniqueClients.find((c) => c.clientId === historyClient.id)?.clientEmail;
        return (
          i.clientId === historyClient.id ||
          i.clientName === historyClient.name ||
          (!!email && email !== "—" && i.clientEmail === email)
        );
      })
    : [];

  if (!profile) {
    return (
      <div className="admin-app flex min-h-screen items-center justify-center text-sm text-mist">
        {t("admin.loading")}
      </div>
    );
  }

  const title = t(NAV.find((item) => item.id === section)?.key ?? "");
  let navGroup = "";

  return (
    <div className="admin-app text-bone">
      <Toasts toasts={toasts} />
      <div className="admin-shell">
        <aside className={`admin-side ${menuOpen ? "is-open" : ""}`}>
          <div className="flex items-center gap-3 px-5 pb-3.5 pt-5">
            <span className="admin-mark">BM</span>
            <div className="min-w-0">
              <div className="truncate text-base font-bold tracking-[-0.01em]">
                {profile.designerName || "Bilgeyis Mirzazada"}
              </div>
              <small className="block text-xs font-normal text-[#8f8672]">{t("admin.studio")}</small>
            </div>
          </div>
          <nav className="flex-1 px-2.5 pb-4">
            {NAV.map((s) => {
              const newCount =
                s.id === "inquiries" ? inquiries.filter((item) => item.status === "Yeni").length : 0;
              const heading = s.group !== navGroup ? ((navGroup = s.group), t(s.group)) : "";
              return (
                <div key={s.id}>
                  {heading ? (
                    <h6 className="px-2.5 pb-1.5 pt-3.5 text-xs font-semibold text-[#8f8672]">{heading}</h6>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSection(s.id);
                      setMenuOpen(false);
                    }}
                    className={`admin-nav-link ${section === s.id ? "is-on" : ""}`}
                    aria-current={section === s.id ? "page" : undefined}
                  >
                    {t(s.key)}
                    {newCount > 0 ? <span className="admin-count">{newCount}</span> : null}
                  </button>
                </div>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 border-t border-[#2a241b] px-4 py-3">
            <button type="button" onClick={() => { setClientsModalOpen(true); setMenuOpen(false); }} className={adminBtnQuiet}>
              {t("admin.clients")}
            </button>
            <button type="button" onClick={() => { setEditProfileOpen(true); setMenuOpen(false); }} className={adminBtnQuiet}>
              {t("admin.profile")}
            </button>
            <button type="button" onClick={() => { setStoryModalOpen(true); setMenuOpen(false); }} className={adminBtnQuiet}>
              Story
            </button>
            <div className="flex gap-2">
            <button type="button" onClick={toggleAdminTheme} className={`${adminBtnQuiet} grow flex-1`}>
              {adminTheme === "dark" ? t("admin.light") : t("admin.dark")}
            </button>
            <button
              type="button"
              onClick={() => {
                adminAuth.clear();
                onLogout();
              }}
              className={adminBtnQuiet}
            >
              {t("admin.logout")}
            </button>
            </div>
          </div>
        </aside>
        <main className="flex min-w-0 flex-col overflow-hidden">
          <header className="admin-top">
            <button type="button" className={`${adminBtnQuiet} admin-menu-btn`} onClick={() => setMenuOpen((v) => !v)}>
              {t("admin.menu")}
            </button>
            <h2 className="admin-title">{title}</h2>
            <Link href="/" target="_blank" rel="noopener" className={adminBtnQuiet}>
              {t("admin.openSite")}
            </Link>
            <button
              type="button"
              className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#f5d98f] to-[#b07a1c] p-px"
              onClick={() => setEditAvatarOpen(true)}
              title={t("admin.photo")}
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(profile.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#14120f] text-[10px] text-[#f5d98f]">
                  BM
                </span>
              )}
            </button>
          </header>
          <div className="admin-view">
            <div className="mx-auto w-full max-w-[1180px] space-y-4">
            {section === "accounts" ? <AccountsSection token={token} /> : null}
            {section === "inquiries" ? (
              <InquiriesSection
                inquiries={inquiries}
                staffList={staffList}
                onStatusChange={onStatusChange}
                onAssign={onAssign}
                onApproveStaffFile={onApproveStaffFile}
                onToggleClientChat={onToggleClientChat}
                token={token}
                onPrepareDelivery={onPrepareDelivery}
                onConfirmPayment={onConfirmPayment}
                onDelete={onDeleteInquiry}
                onMessage={(inquiry) => {
                  if (!inquiry.clientId) return;
                  void selectDmClient(inquiry.clientId, {
                    name: inquiry.clientName,
                    avatarUrl: inquiry.clientAvatarUrl,
                  });
                }}
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
            {section === "hero" ? (
              <HeroGallerySection
                profile={profile}
                token={token}
                onSaveProfile={saveProfile}
                onToast={toast}
              />
            ) : null}
            {section === "appearance" ? (
              <AppearanceSection profile={profile} onSave={saveProfile} onToast={toast} />
            ) : null}
            {section === "brief" ? (
              <OffersSection profile={profile} onSave={saveProfile} onToast={toast} />
            ) : null}
            {section === "announce" ? (
              <AnnouncementSection profile={profile} onSave={saveProfile} onToast={toast} />
            ) : null}
            {section === "about" ? (
              <AboutSection profile={profile} token={token} onSave={saveProfile} onToast={toast} />
            ) : null}
            {section === "logos" ? (
              <SiteImagesSection
                logos={clientLogos}
                token={token}
                onLogosChanged={loadClientLogos}
                onToast={toast}
              />
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
        </main>
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
              <h2 className="font-hero text-lg font-semibold text-bone">{t("admin.clients")}</h2>
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
                    <th className="border-b border-line px-2 py-2">{t("admin.id")}</th>
                    <th className="border-b border-line px-2 py-2">{t("admin.name")}</th>
                    <th className="border-b border-line px-2 py-2">{t("admin.email")}</th>
                    <th className="border-b border-line px-2 py-2">{t("admin.history")}</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-mist">
                        {t("admin.noClients")}
                      </td>
                    </tr>
                  ) : (
                    uniqueClients.map((c) => (
                      <tr key={c.clientId} className="border-b border-line text-bone">
                        <td className="px-2 py-2 font-mono text-sm font-semibold">{c.clientId}</td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center gap-2">
                            <ClientFace name={c.clientName} src={c.avatarUrl} size={28} />
                            {c.clientName}
                          </span>
                        </td>
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
                            {t("admin.viewHistory")}
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
              <h2 className="font-hero text-base font-semibold text-bone">
                {historyClient.name} — {historyClient.id}
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
            <h2 className="mb-4 font-hero text-lg font-semibold text-bone">Profil</h2>
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
            <h2 className="mb-4 font-hero text-lg font-semibold text-bone">Profil şəkli</h2>
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
            <h3 className="mb-4 font-hero text-lg font-semibold text-bone">Story paylaş</h3>
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

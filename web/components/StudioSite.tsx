"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChatDock } from "@/components/ChatDock";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/config";
import type { Project, Story, StudioProfile, Testimonial } from "@/lib/types";

const SERVICES = [
  {
    n: "01",
    title: "Logo motion",
    body: "Brend imzası üçün qısa, yadda qalan logo animasiyaları.",
  },
  {
    n: "02",
    title: "Explainer",
    body: "Məhsulu və ideyanı 2D motion ilə aydın izah edən videolar.",
  },
  {
    n: "03",
    title: "Sosial reels",
    body: "Instagram və TikTok üçün ritmik, diqqət çəkən kadrlar.",
  },
  {
    n: "04",
    title: "Promo",
    body: "Kampaniya üçün montaj, səs dizaynı və rəng korreksiyası.",
  },
  {
    n: "05",
    title: "Montaj",
    body: "Tam video editing — kəsim, tipografiya və temp.",
  },
];

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function StudioSite() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState("Ümumi əməkdaşlıq");
  const [budget, setBudget] = useState("300");
  const [inquiryMsg, setInquiryMsg] = useState("");

  useEffect(() => {
    setClientId(localStorage.getItem("clientId"));
    setClientName(localStorage.getItem("clientName") || "");
    setClientEmail(localStorage.getItem("clientEmail") || "");

    Promise.allSettled([
      api.profile(),
      api.projects(),
      api.stories(),
      api.testimonials(),
    ]).then((results) => {
      if (results[0].status === "fulfilled") setProfile(results[0].value);
      if (results[1].status === "fulfilled") setProjects(results[1].value);
      if (results[2].status === "fulfilled") {
        const now = Date.now();
        setStories(
          results[2].value.filter(
            (s) =>
              !s.createdAt ||
              now - new Date(s.createdAt).getTime() <= 24 * 60 * 60 * 1000,
          ),
        );
      }
      if (results[3].status === "fulfilled") setTestimonials(results[3].value);
      setReady(true);
    });
  }, []);

  const name = profile?.designerName || "Motion Studio";
  const bio = profile?.bio || "Motion design & animation";
  const avatar = mediaUrl(profile?.avatarUrl);
  const liveStories = stories.filter((s) => mediaUrl(s.mediaUrl));
  const doubled = useMemo(
    () => [...testimonials, ...testimonials],
    [testimonials],
  );

  function needClient(): boolean {
    if (clientId) return true;
    setRegisterOpen(true);
    return false;
  }

  function openInquiry(title: string) {
    if (!needClient()) return;
    setInquiryTitle(title);
    setInquiryOpen(true);
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api.register(
      String(form.get("name") || ""),
      String(form.get("email") || ""),
    );
    if (!res.ok) return;
    const data = await res.json();
    setClientId(data.clientId);
    setClientName(data.clientName);
    setClientEmail(data.clientEmail);
    localStorage.setItem("clientId", data.clientId);
    localStorage.setItem("clientName", data.clientName);
    localStorage.setItem("clientEmail", data.clientEmail);
    setRegisterOpen(false);
  }

  async function onInquiry(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    const res = await api.inquiry({
      clientId,
      clientName,
      clientEmail,
      selectedProjectTitle: inquiryTitle,
      budget: `$${budget}`,
      message: inquiryMsg,
    });
    if (res.ok) {
      setInquiryOpen(false);
      setInquiryMsg("");
    }
  }

  async function onReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await api.createTestimonial({
      clientName: String(form.get("name") || ""),
      company: String(form.get("company") || ""),
      comment: String(form.get("comment") || ""),
      rating: Number(form.get("rating") || 5),
    });
    setReviewOpen(false);
    const list = await api.testimonials().catch(() => null);
    if (list) setTestimonials(list);
  }

  const currentStory =
    storyIndex !== null ? liveStories[storyIndex] : undefined;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="font-display text-2xl">
            {ready ? name : <span className="inline-block h-7 w-40 animate-pulse rounded bg-black/10" />}
          </a>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#work">İşlər</a>
            <a href="#services">Xidmətlər</a>
            <a href="#notes">Rəylər</a>
            <a href="#contact">Əlaqə</a>
          </nav>
          <div className="flex items-center gap-3">
            {clientId ? (
              <span className="hidden rounded-full border border-black/10 px-3 py-1 font-mono text-[11px] sm:inline">
                {clientId}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => openInquiry("Ümumi əməkdaşlıq")}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
            >
              Layihə başlat
            </button>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-muted">
            Aperture reel
          </p>
          {ready ? (
            <>
              <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">
                {name}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                {bio}
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="h-16 w-3/4 animate-pulse rounded bg-black/10" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-black/10" />
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#work" className="rounded-full border border-ink px-5 py-2 text-sm">
              Portfelə bax
            </a>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="rounded-full px-5 py-2 text-sm text-muted underline decoration-amber/60 underline-offset-4"
            >
              Rəy yaz
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="perforation absolute -left-3 top-0 hidden h-full w-6 md:block" />
          <div className="film-frame overflow-hidden rounded-sm bg-panel aspect-[3/4]">
            {!ready ? (
              <div className="h-full w-full animate-pulse bg-[#2a2420]" />
            ) : avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-6 text-paper">
                <p className="font-display text-4xl italic">No stills. Just motion.</p>
              </div>
            )}
          </div>
          {ready && liveStories.length > 0 ? (
            <button
              type="button"
              onClick={() => setStoryIndex(0)}
              className="mt-4 w-full rounded-full border border-black/10 bg-white px-4 py-2 text-left text-sm"
            >
              {liveStories.length} aktiv story — bax
            </button>
          ) : null}
        </div>
      </section>

      <div className="overflow-hidden border-y border-black/10 py-4">
        <div className="marquee-run flex w-max gap-8 px-8 text-xs uppercase tracking-[0.3em] text-muted">
          {["After Effects", "Cinema 4D", "Blender", "Redshift", "Premiere", "Octane", "DaVinci", "Figma"].map(
            (t) => (
              <span key={t}>{t}</span>
            ),
          )}
          {["After Effects", "Cinema 4D", "Blender", "Redshift", "Premiere", "Octane", "DaVinci", "Figma"].map(
            (t) => (
              <span key={`${t}-2`}>{t}</span>
            ),
          )}
        </div>
      </div>

      <section id="services" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-4xl md:text-5xl">Xidmətlər</h2>
        <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
          {SERVICES.map((s) => (
            <div key={s.n} className="grid gap-4 py-8 md:grid-cols-[80px_1fr_1.4fr]">
              <p className="font-mono text-sm text-amber">{s.n}</p>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="work" className="bg-panel py-20 text-paper">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-4xl md:text-5xl">Seçilmiş kadrlar</h2>
          <p className="mt-3 max-w-lg text-white/50">
            Hər iş öz nisbətində göstərilir — kəsilmədən, şişirdilmədən.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {!ready ? (
              [0, 1].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded bg-white/10" />
              ))
            ) : projects.length === 0 ? (
              <p className="text-white/40">Hələ layihə yayımlanmayıb.</p>
            ) : (
              projects.map((p, i) => (
                <article key={p.id} className="group">
                  <div className="film-frame overflow-hidden rounded-sm bg-black">
                    <video
                      src={mediaUrl(p.videoUrl)}
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                      className="w-full"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-[#e8b089]">
                        {String(i + 1).padStart(2, "0")} · {p.category}
                      </p>
                      <h3 className="mt-1 font-display text-2xl">{p.title}</h3>
                      <p className="mt-2 text-sm text-white/55">{p.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openInquiry(p.title)}
                      className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wider"
                    >
                      Sifariş
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section id="notes" className="overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-4xl">Müştəri qeydləri</h2>
        </div>
        {ready && doubled.length > 0 ? (
          <div className="mt-10 overflow-hidden">
            <div className="marquee-run flex w-max gap-6 px-5">
              {doubled.map((t, i) => (
                <figure
                  key={`${t.id}-${i}`}
                  className="w-80 shrink-0 rounded-2xl border border-black/10 bg-white p-5"
                >
                  <p className="text-amber">{"★".repeat(t.rating || 5)}</p>
                  <blockquote className="mt-3 text-sm leading-relaxed">“{t.comment}”</blockquote>
                  <figcaption className="mt-4 text-xs text-muted">
                    {t.clientName}
                    {t.company ? ` · ${t.company}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 px-5 text-sm text-muted">Rəylər yüklənəndə burada görünəcək.</p>
        )}
      </section>

      <section id="contact" className="border-t border-black/10 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-5xl md:text-6xl">Bir kadrdan başlayaq.</h2>
          <p className="mt-4 max-w-lg text-muted">
            Büdcəni və ehtiyacı yazın — studio desk-dən cavab gələcək.
          </p>
          <button
            type="button"
            onClick={() => openInquiry("Ümumi əməkdaşlıq")}
            className="mt-8 rounded-full bg-amber px-6 py-3 font-medium text-white"
          >
            Əlaqə saxla
          </button>
        </div>
      </section>

      <footer className="border-t border-black/10 px-5 py-8 text-xs text-muted">
        <div className="mx-auto flex max-w-6xl justify-between">
          <span>© {new Date().getFullYear()} {ready ? name : "Studio"}</span>
          {profile?.instagramUrl ? (
            <a href={profile.instagramUrl} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : (
            <span>Motion · Edit · Promo</span>
          )}
        </div>
      </footer>

      <ChatDock
        clientId={clientId}
        clientName={clientName}
        onNeedRegister={() => setRegisterOpen(true)}
      />

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        <h3 className="font-display text-3xl">Qeydiyyat</h3>
        <p className="mt-2 text-sm text-muted">
          Çat və sifariş üçün ad və e-poçt kifayətdir.
        </p>
        <form onSubmit={onRegister} className="mt-5 space-y-3">
          <input name="name" required placeholder="Adınız" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <input name="email" type="email" required placeholder="E-poçt" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <button type="submit" className="w-full rounded-xl bg-ink py-2 text-paper">
            Davam et
          </button>
        </form>
      </Modal>

      <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)}>
        <h3 className="font-display text-3xl">Sifariş</h3>
        <p className="mt-1 text-sm text-muted">{inquiryTitle}</p>
        <form onSubmit={onInquiry} className="mt-5 space-y-3">
          <label className="block text-sm">
            Paket
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            >
              <option value="150">Qısa logo — $150</option>
              <option value="300">Standart — $300</option>
              <option value="600">Kampaniya — $600</option>
            </select>
          </label>
          <textarea
            required
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
            placeholder="Nə lazımdır?"
            rows={4}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
          <button type="submit" className="w-full rounded-xl bg-amber py-2 text-white">
            Göndər
          </button>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <h3 className="font-display text-3xl">Rəy</h3>
        <form onSubmit={onReview} className="mt-5 space-y-3">
          <input name="name" required placeholder="Ad" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <input name="company" placeholder="Şirkət (opsional)" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <select name="rating" defaultValue="5" className="w-full rounded-xl border border-black/10 px-3 py-2">
            <option value="5">5 ulduz</option>
            <option value="4">4 ulduz</option>
            <option value="3">3 ulduz</option>
            <option value="2">2 ulduz</option>
            <option value="1">1 ulduz</option>
          </select>
          <textarea name="comment" required rows={3} className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <button type="submit" className="w-full rounded-xl bg-ink py-2 text-paper">
            Göndər
          </button>
        </form>
      </Modal>

      {currentStory ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setStoryIndex(null)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {currentStory.mediaType === "video" || currentStory.mediaUrl.endsWith(".mp4") ? (
              <video src={mediaUrl(currentStory.mediaUrl)} autoPlay muted controls className="w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(currentStory.mediaUrl)} alt="" className="w-full rounded-xl" />
            )}
            <div className="mt-3 flex justify-between text-sm text-paper">
              <button type="button" onClick={() => setStoryIndex((i) => (i && i > 0 ? i - 1 : 0))}>
                Əvvəl
              </button>
              <button
                type="button"
                onClick={() =>
                  setStoryIndex((i) =>
                    i === null || i >= liveStories.length - 1 ? null : i + 1,
                  )
                }
              >
                Növbəti
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChatDock } from "@/components/ChatDock";
import { ProjectStack } from "@/components/ProjectStack";
import { RevealText } from "@/components/RevealText";
import { SectionTitle } from "@/components/SectionTitle";
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

const TOOLS = [
  "After Effects",
  "Cinema 4D",
  "Blender",
  "Redshift",
  "Premiere",
  "Octane",
  "DaVinci",
  "Figma",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl border border-paper/10 bg-panel p-6 text-paper shadow-2xl shadow-black/50">
        {children}
      </div>
    </div>
  );
}

const STORY_DURATION_MS = 6000;

export function StudioSite() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState("Ümumi əməkdaşlıq");
  const [pkg, setPkg] = useState("300");
  const [budget, setBudget] = useState("$300");
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
  const bio =
    profile?.bio ||
    "Motion Designer və Video Editor — logo animasiyaları, izahedici videolar və sosial media montajı ilə brend hekayələrini canlandırıram.";
  const avatar = mediaUrl(profile?.avatarUrl);
  const liveStories = stories.filter((s) => mediaUrl(s.mediaUrl));
  const doubled = useMemo(
    () => (testimonials.length ? [...testimonials, ...testimonials] : []),
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
    setPkg("300");
    setBudget("$300");
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
      budget,
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

  // ----- Story autoplay (progress bar + auto-advance) -----
  const storyTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (storyTimer.current) clearInterval(storyTimer.current);
    if (storyIndex === null) return;
    setStoryProgress(0);
    const start = Date.now();
    storyTimer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / STORY_DURATION_MS);
      setStoryProgress(p);
      if (p >= 1) {
        setStoryIndex((i) =>
          i === null || i >= liveStories.length - 1 ? null : i + 1,
        );
      }
    }, 60);
    return () => {
      if (storyTimer.current) clearInterval(storyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex]);

  const currentStory =
    storyIndex !== null ? liveStories[storyIndex] : undefined;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="font-display text-2xl text-paper">
            {ready ? (
              name
            ) : (
              <span className="inline-block h-7 w-40 animate-pulse rounded bg-paper/10" />
            )}
          </a>
          <nav className="hidden items-center gap-6 text-sm text-paper/70 md:flex">
            <a href="#about" className="transition hover:text-paper">Haqqında</a>
            <a href="#services" className="transition hover:text-paper">Xidmətlər</a>
            <a href="#work" className="transition hover:text-paper">İşlər</a>
            <a href="#notes" className="transition hover:text-paper">Rəylər</a>
            <a href="#contact" className="transition hover:text-paper">Əlaqə</a>
          </nav>
          <div className="flex items-center gap-3">
            {clientId ? (
              <span className="hidden rounded-full border border-paper/15 px-3 py-1 font-mono text-[11px] text-paper/60 sm:inline">
                {clientId}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => openInquiry("Ümumi əməkdaşlıq")}
              className="rounded-full bg-amber px-4 py-2 text-sm font-medium text-white shadow-md shadow-amber/20 transition hover:bg-amber-soft"
            >
              Layihə başlat
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section
        id="top"
        className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden px-5 py-16 text-paper md:grid-cols-[1.2fr_0.8fr] md:py-24"
      >
        <div
          className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full opacity-25 blur-[100px]"
          style={{ background: "#5B61E6" }}
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full opacity-20 blur-[100px]"
          style={{ background: "#8B90F2" }}
        />
        <div className="relative">
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
              <div className="h-16 w-3/4 animate-pulse rounded bg-paper/10" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-paper/10" />
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#work"
              className="rounded-full border border-paper/25 px-5 py-2 text-sm transition hover:border-paper hover:bg-paper hover:text-ink"
            >
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

        <div className="relative flex flex-col items-center">
          <div className="perforation absolute -left-3 top-0 hidden h-full w-6 md:block" />
          <div
            className={`story-ring ${
              ready && liveStories.length > 0 ? "has-stories" : "no-stories"
            }`}
            role="button"
            tabIndex={0}
            onClick={() => liveStories.length > 0 && setStoryIndex(0)}
            style={{ width: "min(220px, 42vw)", aspectRatio: "1/1" }}
          >
            <div className="film-frame h-full w-full overflow-hidden rounded-full bg-panel">
              {!ready ? (
                <div className="h-full w-full animate-pulse bg-[#1c1d22]" />
              ) : avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-paper">
                  <p className="font-display text-sm italic leading-tight">
                    No stills.
                    <br />
                    Just motion.
                  </p>
                </div>
              )}
            </div>
          </div>
          {ready && liveStories.length > 0 ? (
            <button
              type="button"
              onClick={() => setStoryIndex(0)}
              className="mt-4 w-full max-w-[260px] rounded-full border border-paper/15 bg-panel px-4 py-2 text-center text-sm text-paper"
            >
              {liveStories.length} aktiv story — bax
            </button>
          ) : null}
          <a
            href="#contact"
            className="mt-6 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber/30 transition hover:scale-105 hover:bg-amber-soft"
          >
            Əlaqə saxla
          </a>
        </div>
      </section>

      {/* ===== Tools marquee ===== */}
      <div className="overflow-hidden border-y border-paper/10 py-4">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Tools &amp; software
        </p>
        <div className="marquee-run flex w-max gap-8 px-8 text-xs uppercase tracking-[0.3em] text-muted">
          {[...TOOLS, ...TOOLS].map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="rounded-full border border-paper/10 px-4 py-2"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ===== About ===== */}
      <section id="about" className="relative mx-auto max-w-3xl px-5 py-24 text-paper">
        <span className="float-icon icon-wiggle-a text-4xl" style={{ top: "4%", left: "0%" }}>
          🎬
        </span>
        <span className="float-icon icon-wiggle-b text-4xl" style={{ top: "70%", left: "2%" }}>
          🚀
        </span>
        <span className="float-icon icon-wiggle-c text-4xl" style={{ top: "55%", right: "0%" }}>
          ✨
        </span>
        <span className="float-icon icon-wiggle-d text-4xl" style={{ top: "2%", right: "2%" }}>
          🎨
        </span>
        <div className="relative z-10 text-center">
          <SectionTitle className="mb-8 text-5xl md:text-6xl">
            Haqqında
          </SectionTitle>
          <RevealText
            text={bio}
            className="mx-auto max-w-xl text-lg leading-relaxed text-muted"
          />
          <div className="mt-8 flex items-center justify-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={name}
                className="h-14 w-14 rounded-full border-2 border-paper/15 object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full border-2 border-paper/15 bg-panel" />
            )}
            <div className="text-left">
              <h3 className="text-base font-semibold">{name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wider text-amber-soft">
                Motion Design &amp; Animation
              </p>
            </div>
          </div>
          {liveStories.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setStoryIndex(0)}
                aria-label="Story-lərə bax"
                className="play-pulse mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-amber text-white shadow-lg shadow-amber/30"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                Story-lərə bax
              </p>
            </>
          ) : null}
        </div>
      </section>

      {/* ===== Services ===== */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-20 text-paper">
        <SectionTitle className="text-4xl md:text-5xl">Xidmətlər</SectionTitle>
        <div className="mt-10 divide-y divide-paper/10 border-y border-paper/10">
          {SERVICES.map((s) => (
            <div
              key={s.n}
              className="grid gap-4 py-8 md:grid-cols-[80px_1fr_1.4fr]"
            >
              <p className="font-mono text-sm text-amber-soft">{s.n}</p>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <RevealText text={s.body} className="text-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* ===== Projects ===== */}
      <section id="work" className="bg-panel py-20 text-paper">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle light={false} className="text-4xl md:text-5xl">
            Seçilmiş kadrlar
          </SectionTitle>
          <p className="mt-3 max-w-lg text-paper/50">
            Hər iş öz nisbətində göstərilir — kəsilmədən, şişirdilmədən.
          </p>
          <div className="mt-12">
            {!ready ? (
              <div className="mx-auto max-w-3xl space-y-8">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="aspect-video animate-pulse rounded-2xl bg-paper/10"
                  />
                ))}
              </div>
            ) : (
              <ProjectStack projects={projects} onOrder={openInquiry} />
            )}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="notes" className="overflow-hidden bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <SectionTitle light={false} className="text-4xl md:text-5xl">
            Müştəri qeydləri
          </SectionTitle>
        </div>
        {ready && doubled.length > 0 ? (
          <div className="orbit-mask mt-10 overflow-hidden">
            <div className="marquee-run flex w-max gap-6 px-5">
              {doubled.map((t, i) => (
                <figure
                  key={`${t.id}-${i}`}
                  className="w-80 shrink-0 rounded-2xl border border-paper/10 bg-panel p-5 shadow-lg shadow-black/20"
                >
                  <p className="text-amber-soft">{"★".repeat(t.rating || 5)}</p>
                  <blockquote className="mt-3 text-sm leading-relaxed text-paper/90">
                    &ldquo;{t.comment}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-muted">
                    {t.clientName}
                    {t.company ? ` · ${t.company}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-8 px-5 text-center text-sm text-muted">
            Rəylər yüklənəndə burada görünəcək.
          </p>
        )}
      </section>

      {/* ===== Contact ===== */}
      <section
        id="contact"
        className="relative overflow-hidden border-t border-paper/10 bg-panel px-5 py-24 text-paper"
      >
        <span className="float-icon icon-wiggle-a text-4xl" style={{ top: "8%", right: "8%" }}>
          💌
        </span>
        <span className="float-icon icon-wiggle-c text-4xl" style={{ bottom: "10%", left: "6%" }}>
          🖱️
        </span>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl md:text-6xl">
            Bir kadrdan başlayaq.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-paper/55">
            Büdcəni və ehtiyacı yazın — studio desk-dən cavab gələcək.
          </p>
          <button
            type="button"
            onClick={() => openInquiry("Ümumi əməkdaşlıq")}
            className="mt-8 rounded-full bg-amber px-8 py-3 font-medium text-white shadow-lg shadow-amber/30 transition hover:scale-105 hover:bg-amber-soft"
          >
            Əlaqə saxla
          </button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-paper/10 bg-ink px-5 pb-8 pt-16 text-paper">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              {ready ? name : "Motion"}
              <br />
              Studio
            </h2>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-paper/40">
                Studio
              </p>
              <p className="mt-3 text-sm text-paper/70">
                Motion Design &amp; Video Editing
              </p>
              <p className="mt-1 text-sm text-paper/70">
                Logo · Explainer · Sosial · Promo
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-paper/10 pt-6">
            <span className="h-10 w-10 rotate-45 rounded-[30%]" style={{ background: "#8B90F2" }} />
            <span className="h-10 w-10 rounded-r-full" style={{ background: "#F5F2EA" }} />
            <span className="h-10 w-10 rounded-full" style={{ background: "#5B61E6" }} />
            <span
              className="h-10 w-10"
              style={{
                background: "#141519",
                border: "1px solid rgba(245,242,234,0.15)",
                clipPath:
                  "polygon(0 0, 100% 0, 50% 50%, 100% 100%, 0 100%, 50% 50%)",
              }}
            />
            <span
              className="h-10 w-10 rounded-full"
              style={{ border: "8px solid #5B61E6" }}
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-paper/40">
            <span>
              © {new Date().getFullYear()} {ready ? name : "Motion Studio"}
            </span>
            {profile?.instagramUrl ? (
              <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="transition hover:text-amber-soft">
                Instagram
              </a>
            ) : (
              <span>Built with care.</span>
            )}
          </div>
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
          <input
            name="name"
            required
            placeholder="Adınız"
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper placeholder:text-paper/40 outline-none transition focus:border-amber"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="E-poçt"
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper placeholder:text-paper/40 outline-none transition focus:border-amber"
          />
          <button type="submit" className="w-full rounded-xl bg-amber py-2 font-medium text-white transition hover:bg-amber-soft">
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
              value={pkg}
              onChange={(e) => {
                setPkg(e.target.value);
                setBudget(`$${e.target.value}`);
              }}
              className="mt-1 w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper outline-none transition focus:border-amber"
            >
              <option value="150">Qısa logo — $150</option>
              <option value="300">Standart — $300</option>
              <option value="600">Kampaniya — $600</option>
            </select>
          </label>
          <label className="block text-sm">
            Təklif etdiyiniz büdcə
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper outline-none transition focus:border-amber"
            />
          </label>
          <textarea
            required
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
            placeholder="Nə lazımdır?"
            rows={4}
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper placeholder:text-paper/40 outline-none transition focus:border-amber"
          />
          <button type="submit" className="w-full rounded-xl bg-amber py-2 font-medium text-white transition hover:bg-amber-soft">
            Göndər
          </button>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <h3 className="font-display text-3xl">Rəy</h3>
        <form onSubmit={onReview} className="mt-5 space-y-3">
          <input
            name="name"
            required
            placeholder="Ad"
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper placeholder:text-paper/40 outline-none transition focus:border-amber"
          />
          <input
            name="company"
            placeholder="Şirkət (opsional)"
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper placeholder:text-paper/40 outline-none transition focus:border-amber"
          />
          <select
            name="rating"
            defaultValue="5"
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper outline-none transition focus:border-amber"
          >
            <option value="5">5 ulduz</option>
            <option value="4">4 ulduz</option>
            <option value="3">3 ulduz</option>
            <option value="2">2 ulduz</option>
            <option value="1">1 ulduz</option>
          </select>
          <textarea
            name="comment"
            required
            rows={3}
            className="w-full rounded-xl border border-paper/15 bg-ink px-3 py-2 text-paper outline-none transition focus:border-amber"
          />
          <button type="submit" className="w-full rounded-xl bg-amber py-2 font-medium text-white transition hover:bg-amber-soft">
            Göndər
          </button>
        </form>
      </Modal>

      {currentStory ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setStoryIndex(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-paper/10 bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex gap-1">
              {liveStories.map((_, i) => (
                <div key={i} className="story-bar">
                  <div
                    className="story-bar-fill"
                    style={{
                      width:
                        i < (storyIndex ?? 0)
                          ? "100%"
                          : i === storyIndex
                            ? `${storyProgress * 100}%`
                            : "0%",
                      transition: i === storyIndex ? "none" : "width 0.2s",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mb-3 flex items-center gap-2">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : null}
              <span className="font-mono text-sm text-white">{name}</span>
            </div>
            {currentStory.mediaType === "video" ||
            currentStory.mediaUrl.endsWith(".mp4") ? (
              <video
                src={mediaUrl(currentStory.mediaUrl)}
                autoPlay
                muted
                controls
                className="w-full rounded-xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(currentStory.mediaUrl)}
                alt=""
                className="w-full rounded-xl"
              />
            )}
            <div className="mt-3 flex justify-between text-sm text-paper">
              <button
                type="button"
                onClick={() => setStoryIndex((i) => (i && i > 0 ? i - 1 : 0))}
              >
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

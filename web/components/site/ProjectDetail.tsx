"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { api } from "@/lib/api";
import { mediaUrl, parseGallery, projectCover } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { GalleryItem, Project } from "@/lib/types";

function GalleryMedia({
  item,
  className,
  hoverToPlay = false,
  controls = false,
}: {
  item: GalleryItem;
  className?: string;
  hoverToPlay?: boolean;
  controls?: boolean;
}) {
  const src = mediaUrl(item.url);
  if (item.type === "video") {
    if (controls) {
      return (
        <video
          src={src}
          controls
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className={className}
        />
      );
    }
    return <LazyVideo src={src} hoverToPlay={hoverToPlay} className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={className} />;
}

export function ProjectDetail({ id }: { id: number }) {
  const { projects, openInquiry } = useStudio();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api
      .projectById(id)
      .then((p) => {
        if (!cancelled) setProject(p);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const idx = projects.findIndex((p) => p.id === id);
  const next =
    projects.length > 0
      ? idx >= 0
        ? projects[(idx + 1) % projects.length]
        : projects[0]
      : null;

  const fullGallery = project ? parseGallery(project.galleryJson) : [];
  const hasVideo = !!project?.videoUrl;
  const heroItem: GalleryItem | null = hasVideo
    ? { url: project!.videoUrl, type: "video" }
    : fullGallery[0] ?? null;
  const galleryItems = hasVideo ? fullGallery : fullGallery.slice(1);

  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (galleryItems.length === 0) return;
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryItems.length));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? i : (i - 1 + galleryItems.length) % galleryItems.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, galleryItems.length]);

  if (loading) {
    return (
      <div className="min-h-[80vh] px-5 pt-32 md:px-10">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="h-4 w-32 animate-pulse bg-bone/10" />
          <div className="h-24 w-2/3 animate-pulse bg-bone/10" />
          <div className="aspect-video w-full animate-pulse bg-surface" />
        </div>
      </div>
    );
  }

  if (failed || !project) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-5 pt-24 text-center">
        <p className="font-display text-4xl italic text-bone">Layihə tapılmadı.</p>
        <Link
          href="/#work"
          data-cursor="link"
          className="font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition hover:text-bone"
        >
          ← İşlərə qayıt
        </Link>
      </div>
    );
  }

  const lightboxItem =
    lightboxIndex !== null ? galleryItems[lightboxIndex] ?? null : null;
  const nextCover = next ? projectCover(next) : null;

  return (
    <article>
      <div className="mx-auto max-w-[1600px] px-5 pt-32 md:px-10">
        <Link
          href="/#work"
          data-cursor="link"
          className="font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition hover:text-bone"
        >
          ← İşlər
        </Link>

        <MaskReveal
          as="h1"
          trigger="mount"
          delay={80}
          className="mt-6"
          innerClassName="font-display text-[clamp(2.5rem,13vw,7.5rem)] italic leading-[0.95] text-bone [word-break:break-word]"
        >
          {project.title}
        </MaskReveal>

        <div className="mt-6 flex flex-wrap gap-6 font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
          <span>{project.category}</span>
          {project.year ? <span>{project.year}</span> : null}
        </div>
      </div>

      {heroItem ? (
        <div className="mt-14 flex w-full items-center justify-center bg-surface">
          <GalleryMedia
            item={heroItem}
            controls={heroItem.type === "video"}
            className="max-h-[90vh] w-full object-contain"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-5 py-20 md:px-10">
        <MaskReveal as="p" innerClassName="text-lg leading-relaxed text-mist md:text-xl">
          {project.description}
        </MaskReveal>
      </div>

      {project.processNotes ? (
        <div className="border-t border-line px-5 py-20 md:px-10">
          <div className="mx-auto grid max-w-[1600px] gap-8 md:grid-cols-[240px_1fr]">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
              Proses
            </span>
            <MaskReveal
              as="p"
              className="max-w-3xl"
              innerClassName="font-display text-2xl italic leading-snug text-bone md:text-3xl"
            >
              {project.processNotes}
            </MaskReveal>
          </div>
        </div>
      ) : null}

      {galleryItems.length > 0 ? (
        <div className="border-t border-line px-5 py-20 md:px-10">
          <div className="mx-auto max-w-[1600px]">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
              Qalereya
            </span>
            <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
              {galleryItems.map((item, i) => (
                <button
                  key={`${item.url}-${i}`}
                  type="button"
                  data-cursor="view"
                  data-cursor-label="BAX"
                  onClick={() => setLightboxIndex(i)}
                  className="w-[85vw] shrink-0 snap-center overflow-hidden bg-surface text-left transition duration-500 hover:-translate-y-0.5 md:w-auto"
                >
                  <GalleryMedia
                    item={item}
                    hoverToPlay
                    className="h-auto max-h-[70vh] w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-t border-line px-5 py-24 text-center md:px-10">
        <MaskReveal
          as="h2"
          className="mx-auto flex justify-center"
          innerClassName="font-display text-4xl italic text-bone md:text-6xl"
        >
          Bir kadrdan başlayaq.
        </MaskReveal>
        <button
          type="button"
          data-cursor="link"
          onClick={() => openInquiry(project.title)}
          className="btn-glow mt-8 inline-flex items-center gap-3 rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
        >
          Sifariş et
        </button>
      </div>

      {next && next.id !== project.id ? (
        <Link
          href={`/work/${next.id}`}
          data-cursor="view"
          data-cursor-label="NÖVBƏTİ"
          className="group relative block h-[60vh] w-full overflow-hidden border-t border-line bg-surface"
        >
          {nextCover?.type === "video" ? (
            <LazyVideo
              src={mediaUrl(nextCover.url)}
              className="h-full w-full object-cover opacity-40 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : nextCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(nextCover.url)}
              alt=""
              className="h-full w-full object-cover opacity-40 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="absolute inset-0 bg-void/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
              Növbəti iş
            </span>
            <h3 className="mt-3 font-display text-4xl italic text-bone md:text-6xl">
              {next.title}
            </h3>
          </div>
        </Link>
      ) : null}

      {lightboxItem ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-void/92 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Bağla"
            className="absolute right-5 top-5 font-mono-tech text-xs uppercase tracking-[0.15em] text-mist hover:text-bone"
            onClick={() => setLightboxIndex(null)}
          >
            Bağla
          </button>
          {galleryItems.length > 1 ? (
            <button
              type="button"
              aria-label="Əvvəlki"
              className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tech text-sm text-mist hover:text-bone md:left-8"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i === null ? i : (i - 1 + galleryItems.length) % galleryItems.length,
                );
              }}
            >
              ←
            </button>
          ) : null}
          <div className="max-h-[90vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <GalleryMedia
              item={lightboxItem}
              controls={lightboxItem.type === "video"}
              className="max-h-[90vh] max-w-[92vw] object-contain"
            />
          </div>
          {galleryItems.length > 1 ? (
            <button
              type="button"
              aria-label="Növbəti"
              className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-tech text-sm text-mist hover:text-bone md:right-8"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryItems.length));
              }}
            >
              →
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

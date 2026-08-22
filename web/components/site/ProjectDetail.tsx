"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { api } from "@/lib/api";
import { mediaUrl, parseGallery } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { Project } from "@/lib/types";

export function ProjectDetail({ id }: { id: number }) {
  const { projects, openInquiry } = useStudio();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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

  const gallery = parseGallery(project.galleryJson);

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

      <div className="mt-14 w-full bg-surface">
        <video
          src={mediaUrl(project.videoUrl)}
          controls
          muted
          loop
          playsInline
          preload="metadata"
          className="max-h-[90vh] w-full object-contain"
        />
      </div>

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

      {gallery.length > 0 ? (
        <div className="border-t border-line px-5 py-20 md:px-10">
          <div className="mx-auto max-w-[1600px]">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
              Qalereya
            </span>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {gallery.map((url, i) => (
                <div key={`${url}-${i}`} className="aspect-video overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(url)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
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
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
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
          <LazyVideo
            src={mediaUrl(next.videoUrl)}
            className="h-full w-full object-cover opacity-40 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
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
    </article>
  );
}

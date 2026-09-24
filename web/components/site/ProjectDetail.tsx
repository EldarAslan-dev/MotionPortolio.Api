"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PostStats } from "@/components/site/PostStats";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { api } from "@/lib/api";
import { mediaUrl, normalizeProject, parseGallery, projectCover, projectPoster } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { GalleryItem, Project, ProjectComment } from "@/lib/types";

function WatchMedia({ item, className }: { item: GalleryItem; className?: string }) {
  const src = mediaUrl(item.url);
  const poster = mediaUrl(item.posterUrl);
  if (item.type === "video") {
    return (
      <video
        key={src}
        src={src}
        poster={poster || undefined}
        controls
        playsInline
        preload="metadata"
        className={className}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />;
}

function ThumbMedia({ item }: { item: GalleryItem }) {
  const still = mediaUrl(item.posterUrl || (item.type === "image" ? item.url : ""));
  if (still) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={still} alt="" />;
  }
  if (item.type === "video") {
    return <video src={`${mediaUrl(item.url)}#t=0.15`} muted playsInline preload="metadata" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaUrl(item.url)} alt="" />;
}

function projectMedia(project: Project): GalleryItem[] {
  const gallery = parseGallery(project.galleryJson);
  const fallbackPoster = project.cardImageUrl || project.thumbnailUrl || "";
  const withPoster = (item: GalleryItem): GalleryItem =>
    item.type === "video" && !item.posterUrl && fallbackPoster
      ? { ...item, posterUrl: fallbackPoster }
      : item;
  const items: GalleryItem[] = [];
  if (project.videoUrl && !gallery.some((item) => item.url === project.videoUrl)) {
    items.push(withPoster({ url: project.videoUrl, type: "video" }));
  }
  items.push(...gallery.map(withPoster));
  return items;
}

export function ProjectDetail({ id }: { id: number }) {
  const { projects, openInquiry } = useStudio();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [full, setFull] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setActive(0);
    setFull(false);
    api
      .projectById(id)
      .then((p) => {
        if (cancelled) return;
        const next = normalizeProject(p);
        setProject(next);
        setLikes(next.likesCount || 0);
        setComments(next.comments || []);
        setLiked(window.localStorage.getItem(`bm-like-${id}`) === "1");
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

  const media = project ? projectMedia(project) : [];
  const current = media[active] ?? media[0] ?? null;
  const idx = projects.findIndex((p) => p.id === id);
  const next =
    projects.length > 0
      ? idx >= 0
        ? projects[(idx + 1) % projects.length]
        : projects[0]
      : null;
  const nextCover = next ? projectCover(next) : null;
  const nextPoster = next ? projectPoster(next) : "";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape" && full) setFull(false);
      if (media.length < 2) return;
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % media.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + media.length) % media.length);
    }
    window.addEventListener("keydown", onKey);
    if (full) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [full, media.length]);

  async function onLike() {
    if (liked) return;
    const res = await api.likeProject(id);
    if (!res.ok) return;
    const data = await res.json();
    setLikes(data.likesCount ?? data.LikesCount ?? likes + 1);
    setLiked(true);
    window.localStorage.setItem(`bm-like-${id}`, "1");
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
    const content = commentText.trim();
    const name = author.trim();
    if (!content || !name) return;
    setSending(true);
    try {
      const res = await api.commentProject(id, { authorName: name, content });
      if (!res.ok) return;
      const data = await res.json();
      const created = data.data || data;
      setComments((prev) => [
        ...prev,
        {
          id: created.id || created.Id || Date.now(),
          authorName: created.authorName || created.AuthorName || name,
          content: created.content || created.Content || content,
          createdAt: created.createdAt || created.CreatedAt || new Date().toISOString(),
        },
      ]);
      setCommentText("");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 pt-28 md:px-10 md:pt-32">
        <div className="h-3 w-24 animate-pulse bg-bone/10" />
        <div className="mt-6 h-12 w-2/3 animate-pulse bg-bone/10" />
        <div className="piece-frame mt-10">
          <div className="piece-stage animate-pulse" />
        </div>
      </div>
    );
  }

  if (failed || !project) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-5 pt-24 text-center">
        <p className="font-display text-4xl text-bone">Layihə tapılmadı.</p>
        <Link
          href="/#work"
          data-cursor="link"
          className="font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition hover:text-bone"
        >
          ← Work
        </Link>
      </div>
    );
  }

  return (
    <article>
      <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-28 md:px-10 md:pb-28 md:pt-32">
        <Link
          href="/#work"
          data-cursor="link"
          className="font-mono-tech text-xs uppercase tracking-[0.15em] text-mist transition hover:text-bone"
        >
          ← Work
        </Link>

        <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display max-w-3xl text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.95] text-bone">
            {project.title}
          </h1>
          <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 font-mono-tech text-[11px] uppercase tracking-[0.18em] text-mist">
            {project.category ? <span>{project.category}</span> : null}
            {project.year ? <span>{project.year}</span> : null}
          </div>
        </header>

        {current ? (
          <div className="mt-10">
            <div className="piece-frame">
              <div className="piece-stage relative">
                <WatchMedia item={current} />
                {media.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="piece-nav prev"
                      aria-label="Previous"
                      onClick={() => setActive((i) => (i - 1 + media.length) % media.length)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="piece-nav next"
                      aria-label="Next"
                      onClick={() => setActive((i) => (i + 1) % media.length)}
                    >
                      ›
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFull(true)}
                  className="absolute right-3 top-3 rounded-full border border-line bg-void/80 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-mist backdrop-blur-sm hover:text-bone"
                >
                  Full
                </button>
              </div>
              <PostStats
                likes={likes}
                comments={comments.length}
                liked={liked}
                onLike={onLike}
                onComments={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
              />
            </div>
            {media.length > 1 ? (
              <div className="piece-thumbs mt-4">
                {media.map((item, i) => (
                  <button
                    key={`${item.url}-${i}`}
                    type="button"
                    data-cursor="view"
                    data-cursor-label="VIEW"
                    onClick={() => setActive(i)}
                    className={`piece-thumb ${i === active ? "is-on" : ""}`}
                    aria-label={`Media ${i + 1}`}
                    aria-current={i === active}
                  >
                    <ThumbMedia item={item} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {project.description ? (
          <MaskReveal as="p" className="mt-12 max-w-2xl" innerClassName="text-base leading-relaxed text-mist md:text-lg">
            {project.description}
          </MaskReveal>
        ) : null}

        {project.processNotes ? (
          <div className="mt-12 grid gap-4 border-t border-line pt-10 md:grid-cols-[160px_1fr]">
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-mist">
              Process
            </span>
            <MaskReveal as="p" innerClassName="text-lg leading-snug text-bone md:text-xl">
              {project.processNotes}
            </MaskReveal>
          </div>
        ) : null}

        <div id="comments" className="mt-14 border-t border-line pt-10">
          <div className="space-y-5">
              {comments.length === 0 ? (
                <p className="text-sm text-mist">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="border-b border-line pb-4">
                    <p className="font-semibold text-bone">{c.authorName}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mist">{c.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={onComment} className="mt-8 max-w-lg space-y-3">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                placeholder="Name"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-bone outline-none placeholder:text-mist"
              />
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                rows={3}
                placeholder="Write a comment"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-bone outline-none placeholder:text-mist"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-full border border-bone/30 px-5 py-2.5 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone disabled:opacity-50"
              >
                {sending ? "Sending…" : "Post comment"}
              </button>
            </form>
        </div>

        <div className="mt-14">
          <button
            type="button"
            data-cursor="link"
            onClick={() => openInquiry(project.title)}
            className="rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
          >
            Get in touch
          </button>
        </div>
      </div>

      {next && next.id !== project.id ? (
        <Link
          href={`/work/${next.id}`}
          data-cursor="view"
          data-cursor-label="NEXT"
          className="group relative block h-[42vh] w-full overflow-hidden border-t border-line bg-surface"
        >
          {nextPoster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(nextPoster)}
              alt=""
              className="h-full w-full object-cover opacity-35 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : nextCover?.type === "video" ? (
            <LazyVideo
              src={mediaUrl(nextCover.url)}
              className="h-full w-full object-cover opacity-35 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : nextCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(nextCover.url)}
              alt=""
              className="h-full w-full object-cover opacity-35 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="absolute inset-0 bg-void/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-mist">
              Next
            </span>
            <h3 className="mt-2 font-display text-3xl uppercase text-bone md:text-5xl">{next.title}</h3>
          </div>
        </Link>
      ) : null}

      {full && current ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-void/94 p-4"
          onClick={() => setFull(false)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 font-mono-tech text-xs uppercase tracking-[0.15em] text-mist hover:text-bone"
            onClick={() => setFull(false)}
          >
            Close
          </button>
          {media.length > 1 ? (
            <button
              type="button"
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tech text-sm text-mist hover:text-bone md:left-8"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i - 1 + media.length) % media.length);
              }}
            >
              ←
            </button>
          ) : null}
          <div className="max-h-[90vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <WatchMedia item={current} className="max-h-[90vh] max-w-[92vw] object-contain" />
          </div>
          {media.length > 1 ? (
            <button
              type="button"
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-tech text-sm text-mist hover:text-bone md:right-8"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i + 1) % media.length);
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

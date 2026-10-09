"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PostStats } from "@/components/site/PostStats";
import { api } from "@/lib/api";
import { mediaUrl, normalizeProject, parseGallery } from "@/lib/config";
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
  const { projects, openInquiry, clientId, clientName } = useStudio();
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
  const washSrc = mediaUrl(
    current?.posterUrl ||
      (current?.type === "image" ? current.url : "") ||
      project?.cardImageUrl ||
      project?.thumbnailUrl ||
      "",
  );
  const [tone, setTone] = useState("#16130f");

  useEffect(() => {
    if (clientName) setAuthor(clientName);
  }, [clientName]);

  useEffect(() => {
    document.documentElement.classList.add("reel-on");
    return () => {
      document.documentElement.classList.remove("reel-on");
      document.documentElement.style.removeProperty("--reel-bg");
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--reel-bg", tone);
  }, [tone]);

  useEffect(() => {
    if (!washSrc) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 12, 12);
        const data = ctx.getImageData(0, 0, 12, 12).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 24) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
        if (!n) return;
        const rr = r / n;
        const gg = g / n;
        const bb = b / n;
        const y = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
        const scale = y > 0.78 ? 0.86 : y < 0.16 ? 0.5 : 0.7;
        const br = Math.round(rr * scale);
        const bgc = Math.round(gg * scale);
        const bl = Math.round(bb * scale);
        const by = (0.2126 * br + 0.7152 * bgc + 0.0722 * bl) / 255;
        setTone(`rgb(${br}, ${bgc}, ${bl})`);
        document.documentElement.style.setProperty("--reel-ink", by > 0.62 ? "#1c1814" : "#f7f3ea");
      } catch {
        /* poster oxunmasa fon qalır */
      }
    };
    img.src = washSrc;
    return () => {
      cancelled = true;
    };
  }, [washSrc]);

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
    if (clientId) api.saveLike(clientId, id).catch(() => {});
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
    const content = commentText.trim();
    const name = author.trim() || clientName.trim();
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
      <div className="reel-post">
        <Link href="/#work" data-cursor="link" className="reel-back">
          ← Work
        </Link>

        {current ? (
          <div className="reel-stage">
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
              className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] text-white"
            >
              Full
            </button>
          </div>
        ) : null}

        <div className="reel-cap">
          <h1>{project.title}</h1>
          <span>{[project.category, project.year].filter(Boolean).join(" · ")}</span>
        </div>

        <div className="reel-actions">
          <PostStats likes={likes} comments={comments.length} liked={liked} onLike={onLike} />
          <button type="button" className="reel-touch" onClick={() => openInquiry(project.title)}>
            Get in touch
          </button>
        </div>

        {project.description ? (
          <p className="reel-copy">
            <b>{project.title}</b>
            {project.description}
          </p>
        ) : null}
        {project.processNotes ? <p className="reel-copy">{project.processNotes}</p> : null}

        {media.length > 1 ? (
          <div className="piece-thumbs mt-4">
            {media.map((item, i) => (
              <button
                key={`${item.url}-${i}`}
                type="button"
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

        <div id="comments" className="reel-thread">
          {comments.map((c) => (
            <p key={c.id}>
              <b>{c.authorName}</b>
              {c.content}
            </p>
          ))}
          <form onSubmit={onComment} className="reel-compose">
            {clientName ? null : (
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                placeholder="Ad"
                className="reel-name"
              />
            )}
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
              placeholder="Şərh yaz…"
            />
            <button type="submit" disabled={sending || !commentText.trim()}>
              {sending ? "…" : "Paylaş"}
            </button>
          </form>
        </div>

        {next && next.id !== project.id ? (
          <Link href={`/work/${next.id}`} data-cursor="link" className="reel-next">
            <small>Next</small>
            <b>{next.title}</b>
          </Link>
        ) : null}
      </div>

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

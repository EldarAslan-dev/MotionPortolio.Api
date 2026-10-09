"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PostStats } from "@/components/site/PostStats";
import { mediaUrl, projectPoster } from "@/lib/config";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";
import type { Project } from "@/lib/types";

function goToWork(router: ReturnType<typeof useRouter>, id: number, e: React.MouseEvent) {
  e.preventDefault();
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };
  if (doc.startViewTransition) {
    doc.startViewTransition(() => router.push(`/work/${id}`));
  } else {
    router.push(`/work/${id}`);
  }
}

function WorkCard({ project }: { project: Project }) {
  const router = useRouter();
  const poster = mediaUrl(projectPoster(project));
  const video = mediaUrl(project.videoUrl);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "800px", threshold: 0.2 },
    );
    io.observe(frame);
    return () => io.disconnect();
  }, [video]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !active) return;
    vid.play().catch(() => {});
  }, [active]);

  return (
    <a
      href={`/work/${project.id}`}
      onClick={(e) => goToWork(router, project.id, e)}
      className="wc rise"
    >
      <div className="th" ref={frameRef}>
        {video && active ? (
          <video
            ref={videoRef}
            src={video}
            poster={poster || undefined}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" decoding="async" />
        ) : null}
        <div className="wc-bar">
          <b>{project.title}</b>
          <span>{project.category || "Motion"}</span>
          <PostStats likes={project.likesCount || 0} comments={project.comments?.length || 0} />
        </div>
      </div>
    </a>
  );
}

export function Work() {
  const { ready, projects, profile } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const router = useRouter();
  const [mode, setMode] = useState<"g" | "l">("g");
  const groups = design.groups.filter((group) => group.title.trim());
  const blocks = (() => {
    if (!groups.length) return [{ title: "", items: projects }];
    const matched = new Set<number>();
    const named = groups
      .filter((group) => group.category.trim())
      .map((group) => {
        const items = projects.filter(
          (project) => (project.category || "").toLowerCase() === group.category.trim().toLowerCase(),
        );
        items.forEach((project) => matched.add(project.id));
        return { title: group.title, items };
      })
      .filter((block) => block.items.length > 0);
    const rest = projects.filter((project) => !matched.has(project.id));
    const open = groups.find((group) => !group.category.trim());
    if (rest.length) named.push({ title: open?.title || "", items: rest });
    return named.length ? named : [{ title: "", items: projects }];
  })();

  return (
    <section id="work" className="pub-sec relative z-[1]">
      <div className="pub-wrap">
        <div className="rise mb-9 flex flex-wrap items-end justify-between gap-4">
          <span className="pub-lab" style={{ fontSize: `clamp(22px, 6vw, ${design.worksSize}px)` }}>
            {design.worksLabel}
          </span>
          <div className="seg">
            <button type="button" className={mode === "g" ? "on" : ""} onClick={() => setMode("g")}>
              Grid
            </button>
            <button type="button" className={mode === "l" ? "on" : ""} onClick={() => setMode("l")}>
              List
            </button>
          </div>
        </div>
        {!ready ? (
          <div className="work-grid">
            {[0, 1].map((i) => (
              <div key={i} className="wc">
                <div className="th animate-pulse bg-[var(--s2)]" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-[rgb(var(--mist))]">No work published yet.</p>
        ) : (
          blocks.map((block, index) => (
            <div key={`${block.title}-${index}`} className="mb-12">
              {block.title ? (
                <h3 className="mb-5 font-semibold" style={{ fontSize: Math.max(16, design.worksSize - 4) }}>
                  {block.title}
                </h3>
              ) : null}
              {mode === "g" ? (
                <div className="work-grid">
                  {block.items.map((p) => (
                    <WorkCard key={p.id} project={p} />
                  ))}
                </div>
              ) : (
                <div className="border-t border-[var(--bd)]">
                  {block.items.map((p) => (
                    <a
                      key={p.id}
                      href={`/work/${p.id}`}
                      onClick={(e) => goToWork(router, p.id, e)}
                      className="work-row rise"
                    >
                      <div>
                        <h3>{p.title}</h3>
                        <small className="text-[rgb(var(--mist))]">
                          {p.category}
                          {p.year ? ` · ${p.year}` : ""}
                        </small>
                      </div>
                      <PostStats likes={p.likesCount || 0} comments={p.comments?.length || 0} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

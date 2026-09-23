"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PostStats } from "@/components/site/PostStats";
import { mediaUrl, projectPoster } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { Project } from "@/lib/types";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

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

/**
 * Poster-first, lazy-loaded preview: the still poster renders immediately
 * (fast, no network cost for the video), and only on hover does the muted
 * video's `src` attach and start playing, crossfading over the poster. If
 * there's no poster the video's own first frame (via `#t=` seek + metadata
 * preload) stands in for one, still without eagerly downloading the file.
 */
function WorkPreview({ project, eager }: { project: Project; eager: boolean }) {
  const poster = mediaUrl(projectPoster(project));
  const video = mediaUrl(project.videoUrl);
  const [hovering, setHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!video) return;
    if (hovering) {
      setVideoLoaded(true);
      videoRef.current?.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovering, video]);

  if (!poster && !video) return <div className="h-full w-full bg-void" />;

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${
            video && hovering ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}
      {video ? (
        <video
          ref={videoRef}
          src={videoLoaded ? video : poster ? undefined : `${video}#t=0.15`}
          muted
          loop
          playsInline
          preload={poster ? "none" : "metadata"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
            poster ? (hovering ? "opacity-100" : "opacity-0") : "opacity-100"
          }`}
        />
      ) : null}
      {project.category ? (
        <span
          className={`pointer-events-none absolute left-3 top-3 rounded-full border border-bone/15 bg-void/70 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-bone backdrop-blur-sm transition-opacity duration-300 ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
        >
          {project.category}
        </span>
      ) : null}
    </div>
  );
}

function WorkCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const router = useRouter();

  return (
    <motion.article
      className="work-card"
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ ...SPRING, delay: Math.min(index, 4) * 0.06 }}
    >
      <motion.a
        href={`/work/${project.id}`}
        onClick={(e) => goToWork(router, project.id, e)}
        data-cursor="view"
        data-cursor-label="VIEW"
        className="block"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING}
      >
        <div className="work-card-frame">
          <div className="work-card-media">
            <WorkPreview project={project} eager={index < 2} />
          </div>
          <PostStats likes={project.likesCount || 0} comments={project.comments?.length || 0} />
          <div className="work-card-meta flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display truncate text-2xl uppercase text-bone md:text-3xl">{project.title}</h3>
              {project.category ? (
                <p className="mt-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-mist">
                  {project.category}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 font-mono-tech text-[11px] tracking-[0.16em] text-mist">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>
      </motion.a>
    </motion.article>
  );
}

export function Work() {
  const { ready, projects } = useStudio();

  return (
    <section id="work" className="scroll-mt-28 overflow-visible border-t border-line py-28 md:py-36">
      <div className="mx-auto max-w-[1600px] overflow-visible px-5 md:px-10">
        <motion.div
          className="flex items-end justify-between gap-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
        >
          <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">03 — Work</p>
          <p className="hidden max-w-xs text-right text-sm text-mist md:block">
            Each piece in its own frame. Full ratio. Nothing cropped.
          </p>
        </motion.div>

        <div className="mt-16 overflow-visible">
          {!ready ? (
            <div className="work-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="work-card-frame">
                  <div className="work-card-media animate-pulse bg-void" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-mist">No work published yet.</p>
          ) : (
            <div className="work-list mx-auto max-w-5xl lg:max-w-none">
              {projects.map((p, i) => (
                <WorkCard key={p.id} project={p} index={i} total={projects.length} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

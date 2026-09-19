"use client";

import { useRouter } from "next/navigation";
import { PostStats } from "@/components/site/PostStats";
import { mediaUrl, projectPoster } from "@/lib/config";
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

function WorkPreview({ project, eager }: { project: Project; eager: boolean }) {
  const poster = mediaUrl(projectPoster(project));
  const video = mediaUrl(project.videoUrl);
  if (poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }
  if (video) {
    return (
      <video
        src={`${video}#t=0.15`}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }
  return <div className="h-full w-full bg-void" />;
}

function WorkCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const router = useRouter();

  return (
    <article className="work-card">
      <a
        href={`/work/${project.id}`}
        onClick={(e) => goToWork(router, project.id, e)}
        data-cursor="view"
        data-cursor-label="VIEW"
        className="block"
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
      </a>
    </article>
  );
}

export function Work() {
  const { ready, projects } = useStudio();

  return (
    <section id="work" className="scroll-mt-28 overflow-visible border-t border-line py-28 md:py-36">
      <div className="mx-auto max-w-[1600px] overflow-visible px-5 md:px-10">
        <div className="flex items-end justify-between gap-6">
          <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">03 — Work</p>
          <p className="hidden max-w-xs text-right text-sm text-mist md:block">
            Each piece in its own frame. Full ratio. Nothing cropped.
          </p>
        </div>

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

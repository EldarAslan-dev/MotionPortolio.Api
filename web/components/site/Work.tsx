"use client";

import { useRouter } from "next/navigation";
import { LazyVideo } from "@/components/motion/LazyVideo";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { mediaUrl, projectCover } from "@/lib/config";
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

function WorkCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const router = useRouter();
  const cover = projectCover(project);
  const src = cover ? mediaUrl(cover.url) : "";

  return (
    <article>
      <a
        href={`/work/${project.id}`}
        onClick={(e) => goToWork(router, project.id, e)}
        data-cursor="view"
        data-cursor-label="BAX"
        className="group block"
      >
        <div className="relative overflow-hidden bg-surface transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="aspect-[4/5] md:aspect-[4/3]">
            {cover?.type === "video" ? (
              <LazyVideo
                src={src}
                poster={mediaUrl(project.thumbnailUrl) || undefined}
                hoverToPlay
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
          </div>
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-2xl italic text-bone md:text-3xl">{project.title}</h3>
            <p className="mt-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-mist">
              {project.category}
            </p>
          </div>
          <span className="shrink-0 font-mono-tech text-[11px] tracking-[0.16em] text-mist">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </a>
    </article>
  );
}

export function Work() {
  const { ready, projects } = useStudio();

  return (
    <section id="work" className="border-t border-line py-28 md:py-36">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex items-end justify-between gap-6">
          <MaskReveal innerClassName="block font-mono-tech text-xs uppercase tracking-[0.2em] text-mist">
            03 — İşlər
          </MaskReveal>
          <MaskReveal
            as="p"
            className="hidden max-w-xs text-right md:block"
            innerClassName="text-sm text-mist"
          >
            Hər iş öz nisbətində göstərilir — kəsilmədən, şişirdilmədən.
          </MaskReveal>
        </div>

        <div className="mt-16">
          {!ready ? (
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[4/5] animate-pulse bg-surface md:aspect-[4/3]" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-mist">Hələ layihə yayımlanmayıb.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
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

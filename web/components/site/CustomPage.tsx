"use client";

import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";

export function CustomPage({ slug }: { slug: string }) {
  const { profile, ready } = useStudio();
  const page = parseDesign(profile?.siteDesignJson).pages.find((item) => item.slug === slug);

  if (!ready) return <div className="pt-32" />;
  if (!page) {
    return <p className="px-6 pt-32 text-center text-[rgb(var(--mist))]">Səhifə tapılmadı.</p>;
  }

  return (
    <article className="pub-wrap pb-24 pt-28">
      <h1 className="pub-h2">{page.title}</h1>
      <p className="mt-6 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-[rgb(var(--mist))]">
        {page.body}
      </p>
    </article>
  );
}

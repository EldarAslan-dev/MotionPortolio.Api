"use client";

import { useStudio } from "@/lib/site/StudioContext";

export function Footer() {
  const { ready, name } = useStudio();

  return (
    <footer className="border-t border-line px-5 py-10 pb-28 md:px-10 md:pb-10">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist">
        <span>
          © {new Date().getFullYear()} {ready ? name.trim() : "Motion Studio"}
        </span>
        <span>Motion Design &amp; Video Editing</span>
      </div>
    </footer>
  );
}

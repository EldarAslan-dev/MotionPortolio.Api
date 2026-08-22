"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { useStudio } from "@/lib/site/StudioContext";

const LINKS = [
  { href: "/#about", label: "Haqqında" },
  { href: "/#services", label: "Xidmətlər" },
  { href: "/#work", label: "İşlər" },
  { href: "/#notes", label: "Rəylər" },
  { href: "/#contact", label: "Əlaqə" },
];

export function Nav() {
  const { ready, name, liveStories, setStoryIndex, openInquiry } = useStudio();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "border-b border-line bg-void/75 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1600px] items-center justify-between px-5 transition-[padding] duration-500 md:px-10 ${
            scrolled ? "py-3" : "py-6"
          }`}
        >
          <Link
            href="/#top"
            data-cursor="link"
            className="max-w-[45vw] truncate font-mono-tech text-[11px] uppercase tracking-[0.2em] text-bone"
          >
            {ready ? (
              name
            ) : (
              <span className="inline-block h-3 w-28 animate-pulse bg-bone/10" />
            )}
          </Link>

          <nav className="hidden items-center gap-8 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="link"
                className="relative py-1 transition hover:text-bone"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {liveStories.length > 0 ? (
              <button
                type="button"
                data-cursor="link"
                onClick={() => setStoryIndex(0)}
                className="hidden items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.15em] text-mist transition hover:text-bone sm:flex"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cue opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cue" />
                </span>
                Canlı yeniləmə
              </button>
            ) : null}

            <button
              type="button"
              data-cursor="link"
              onClick={() => openInquiry("Ümumi əməkdaşlıq")}
              className="hidden rounded-full border border-bone/30 px-5 py-2 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue sm:inline-block"
            >
              Layihə başlat
            </button>

            <button
              type="button"
              aria-label="Menyu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span
                className={`h-px w-5 bg-bone transition-transform duration-300 ${
                  menuOpen ? "translate-y-[3px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-px w-5 bg-bone transition-transform duration-300 ${
                  menuOpen ? "-translate-y-[3px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-void px-8 transition-opacity duration-500 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav key={menuOpen ? "open" : "closed"} className="flex flex-col gap-1">
          {LINKS.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              <MaskReveal
                as="span"
                className="block py-2"
                innerClassName="font-display text-4xl italic text-bone"
                trigger="mount"
                delay={i * 60}
              >
                {l.label}
              </MaskReveal>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            openInquiry("Ümumi əməkdaşlıq");
          }}
          className="mt-10 self-start rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone"
        >
          Layihə başlat
        </button>
      </div>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnnouncementTicker } from "@/components/site/AnnouncementTicker";
import { INQUIRY_GENERAL } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";
import { useTheme } from "@/lib/site/ThemeProvider";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

const LINKS = [
  { href: "/#top", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const { ready, name, avatar, liveStories, openInquiry } = useStudio();
  const { theme, toggle } = useTheme();
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
    document.body.style.touchAction = menuOpen ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "border-b border-line bg-void/75 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        }`}
      >
        <AnnouncementTicker />
        <div
          className={`mx-auto flex max-w-[1600px] items-center justify-between px-5 transition-[padding] duration-500 md:px-10 ${
            scrolled ? "py-3" : "py-6"
          }`}
        >
          <Link
            href="/#top"
            data-cursor="link"
            className="flex min-w-0 max-w-[58vw] items-center gap-2.5 md:max-w-none"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className={`h-8 w-8 shrink-0 rounded-full object-cover md:h-9 md:w-9 ${
                  liveStories.length > 0 ? "ring-1 ring-cue ring-offset-2 ring-offset-void" : "border border-line"
                }`}
              />
            ) : (
              <span className="h-8 w-8 shrink-0 rounded-full border border-line bg-surface md:h-9 md:w-9" />
            )}
            <span className="truncate font-mono-tech text-[11px] uppercase tracking-[0.2em] text-bone">
              {ready ? name : <span className="inline-block h-3 w-28 animate-pulse bg-bone/10" />}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="link"
                className="group relative py-1 transition hover:text-bone"
              >
                {l.label}
                <span className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-cue transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              data-cursor="link"
              onClick={toggle}
              className="theme-toggle"
              aria-label={theme === "day" ? "Switch to night mode" : "Switch to day mode"}
            >
              <span className="theme-toggle-knob" />
            </button>

            <motion.button
              type="button"
              data-cursor="link"
              onClick={() => openInquiry(INQUIRY_GENERAL)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING}
              className="btn-glow hidden rounded-full border border-bone/30 px-5 py-2 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue sm:inline-block"
            >
              Start a project
            </motion.button>

            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="relative z-10 flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span
                className={`h-0.5 w-5 bg-bone transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-bone transition-all duration-300 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-bone transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center overflow-y-auto bg-void px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(6rem,env(safe-area-inset-top))] transition-opacity duration-500 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`font-display block py-2 text-4xl text-bone transition-all duration-500 ease-out ${
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: menuOpen ? `${80 + i * 60}ms` : "0ms" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <motion.button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            openInquiry(INQUIRY_GENERAL);
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING}
          className="btn-glow mt-10 self-start rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
        >
          Start a project
        </motion.button>
      </div>
    </>
  );
}

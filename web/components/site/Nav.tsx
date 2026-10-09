"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientFace } from "@/components/ClientFace";
import { AnnouncementTicker } from "@/components/site/AnnouncementTicker";
import { useI18n } from "@/lib/i18n";
import { parseDesign } from "@/lib/site/design";
import { useStudio } from "@/lib/site/StudioContext";
import { useTheme } from "@/lib/site/ThemeProvider";

export function Nav() {
  const { t } = useI18n();
  const { ready, name, avatar, liveStories, setStoryIndex, clientId, clientName, clientAvatar, openAuth, profile } = useStudio();
  const design = parseDesign(profile?.siteDesignJson);
  const links = [
    { href: "/#hero", label: t("nav.showcase") },
    { href: "/#work", label: t("nav.work") },
    { href: "/#clients", label: t("nav.clients") },
    { href: "/#about", label: t("nav.about") },
    { href: "/#contact", label: t("nav.contact") },
    ...design.pages
      .filter((page) => page.slug && page.title)
      .map((page) => ({ href: `/p/${page.slug}`, label: page.title })),
  ];
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <header className="pub-hd">
        <AnnouncementTicker />
        <div className="pub-wrap flex items-center justify-between gap-3">
          <Link href="/#hero" data-cursor="link" className="pub-logo">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                onClick={(e) => {
                  if (liveStories.length === 0) return;
                  e.preventDefault();
                  setStoryIndex(0);
                }}
              />
            ) : (
              <span className="pub-logo-fallback" />
            )}
            <div className="min-w-0 text-left">
              <b className="truncate">{ready ? name : "Bilgeyis Mirzazada"}</b>
              <small>{design.logoRole}</small>
            </div>
          </Link>

          <nav className="pub-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} data-cursor="link">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="pub-ib"
              onClick={toggle}
              aria-label={theme === "day" ? t("nav.night") : t("nav.day")}
            >
              ◐
            </button>
            {clientId ? (
              <Link href="/account" className="ghost-btn pub-chip">
                <ClientFace name={clientName} src={clientAvatar} size={22} />
                <span className="pub-who">{clientName || t("admin.profile")}</span>
              </Link>
            ) : (
              <button type="button" className="ghost-btn pub-chip" onClick={() => openAuth("login")}>
                {t("nav.signIn")}
              </button>
            )}
            <button
              type="button"
              aria-label={t("nav.menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="pub-ib min-[861px]:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center overflow-y-auto bg-void px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(6rem,env(safe-area-inset-top))] transition-opacity duration-500 min-[861px]:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1">
          {links.map((l, i) => (
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
        <Link
          href={clientId ? "/account" : "#"}
          onClick={(e) => {
            setMenuOpen(false);
            if (!clientId) {
              e.preventDefault();
              openAuth("login");
            }
          }}
          className="btn-glow mt-8 self-start rounded-full border border-bone/30 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue"
        >
          {clientId ? t("admin.profile") : t("nav.signIn")}
        </Link>
      </div>
    </>
  );
}

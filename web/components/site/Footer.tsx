"use client";

import Link from "next/link";
import { BehanceIcon, InstagramIcon, LinkedInIcon } from "@/components/site/BrandIcons";
import { SOCIALS } from "@/lib/site/copy";
import { useStudio } from "@/lib/site/StudioContext";

const LINKS = [
  { href: "/#top", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#contact", label: "Contact" },
];

export function Footer() {
  const { ready, name, profile } = useStudio();
  const instagram = profile?.instagramUrl || SOCIALS.instagramFallback;

  return (
    <footer className="border-t border-line px-5 py-12 pb-28 md:px-10 md:pb-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/#top"
            data-cursor="link"
            className="font-display text-2xl uppercase tracking-[-0.02em] text-bone"
          >
            {ready ? name.trim() || "Motion Studio" : "Motion Studio"}
          </Link>
          <p className="mt-2 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist">
            Motion Design &amp; Video Editing
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} data-cursor="link" className="transition hover:text-bone">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            aria-label="Instagram"
            className="text-mist transition hover:text-bone"
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href={SOCIALS.linkedin}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            aria-label="LinkedIn"
            className="text-mist transition hover:text-bone"
          >
            <LinkedInIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href={SOCIALS.behance}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            aria-label="Behance"
            className="text-mist transition hover:text-bone"
          >
            <BehanceIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1600px] border-t border-line pt-6">
        <p className="font-mono-tech text-[11px] uppercase tracking-[0.15em] text-mist">
          © {new Date().getFullYear()} {ready ? name.trim() || "Motion Studio" : "Motion Studio"}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { mediaUrl, parseHeroGallery, projectPoster } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { ClientLogo, Project, StudioProfile } from "@/lib/types";

const FILL_MS = 1200;
const HOLD_MS = 160;
const LIFT_MS = 700;

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function preload(urls: string[]) {
  const list = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    list.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const done = () => resolve();
          img.onload = done;
          img.onerror = done;
          img.src = src;
          if (img.complete) done();
        }),
    ),
  );
}

function visibleUrls(profile: StudioProfile | null, projects: Project[], logos: ClientLogo[]) {
  const hero = parseHeroGallery(profile?.heroGalleryJson).map((item) =>
    mediaUrl(item.type === "video" ? item.posterUrl || "" : item.url),
  );
  const marks = logos.map((logo) => mediaUrl(logo.logoUrl));
  const posters = projects.slice(0, 6).map((project) => mediaUrl(projectPoster(project)));
  return [...hero, ...marks, ...posters, mediaUrl(profile?.aboutPhotoUrl), mediaUrl(profile?.avatarUrl)];
}

export function Intro() {
  const { ready, profile, projects, clientLogos } = useStudio();
  const reduced = useReducedMotion();
  const readyRef = useRef(ready);
  const profileRef = useRef(profile);
  const projectsRef = useRef(projects);
  const logosRef = useRef(clientLogos);
  readyRef.current = ready;
  profileRef.current = profile;
  projectsRef.current = projects;
  logosRef.current = clientLogos;

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro-pending")) return;

    const started = Number(html.getAttribute("data-intro-at") || Date.now());
    const fillWait = reduced ? 0 : Math.max(0, FILL_MS - (Date.now() - started));
    let revealed = false;
    let poll = 0;
    let holdTimer = 0;
    let liftTimer = 0;
    let cancelled = false;

    const finish = () => {
      html.classList.remove("intro-pending");
      html.removeAttribute("data-intro-at");
    };

    const reveal = () => {
      if (revealed || cancelled) return;
      revealed = true;
      window.clearInterval(poll);
      const screen = document.getElementById("site-intro");
      if (reduced) {
        finish();
        return;
      }
      holdTimer = window.setTimeout(() => {
        screen?.classList.add("is-open");
        liftTimer = window.setTimeout(finish, LIFT_MS);
      }, HOLD_MS);
    };

    const openWhenReady = async () => {
      const filled = wait(fillWait);
      const loaded = new Promise<void>((resolve) => {
        if (readyRef.current) {
          resolve();
          return;
        }
        poll = window.setInterval(() => {
          if (readyRef.current) {
            window.clearInterval(poll);
            resolve();
          }
        }, 40);
      });
      await Promise.all([filled, loaded]);
      if (cancelled) return;
      await Promise.race([
        preload(visibleUrls(profileRef.current, projectsRef.current, logosRef.current)),
        wait(6000),
      ]);
      reveal();
    };

    openWhenReady();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearTimeout(holdTimer);
      window.clearTimeout(liftTimer);
    };
  }, [reduced]);

  return null;
}

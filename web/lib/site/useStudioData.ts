"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl, normalizeProject } from "@/lib/config";
import type { ClientLogo, Project, Story, StudioProfile, Testimonial } from "@/lib/types";

function normalizeLogo(
  l: ClientLogo & { Id?: number; Name?: string; LogoUrl?: string; SortOrder?: number },
): ClientLogo {
  return {
    id: l.id || l.Id || 0,
    name: l.name || l.Name || "",
    logoUrl: l.logoUrl || l.LogoUrl || "",
    sortOrder: l.sortOrder ?? l.SortOrder ?? 0,
  };
}

const STORY_DURATION_MS = 6000;

/**
 * Owns every read-only piece of studio data (profile/projects/stories/
 * testimonials) plus the story-viewer autoplay timer. Lifted out of the old
 * monolithic StudioSite so both the homepage and /work/[id] can share one
 * fetch + one story-viewer state via StudioContext, without refetching on
 * navigation between them.
 */
export function useStudioData() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.allSettled([
        api.profile(),
        api.projects(),
        api.stories(),
        api.testimonials(),
        api.clientLogos(),
      ]).then((results) => {
        if (cancelled) return;
        if (results[0].status === "fulfilled") {
          const p = results[0].value as StudioProfile & {
            HeroVideoUrl?: string;
            AboutPhotoUrl?: string;
            AboutTeaser?: string;
            AboutBody?: string;
            ToolsJson?: string;
            HeroGalleryJson?: string;
          };
          setProfile({
            ...p,
            heroVideoUrl: p.heroVideoUrl || p.HeroVideoUrl || "",
            aboutPhotoUrl: p.aboutPhotoUrl || p.AboutPhotoUrl || "",
            aboutTeaser: p.aboutTeaser || p.AboutTeaser || "",
            aboutBody: p.aboutBody || p.AboutBody || "",
            toolsJson: p.toolsJson || p.ToolsJson || "[]",
            heroGalleryJson: p.heroGalleryJson || p.HeroGalleryJson || "[]",
          });
        }
        if (results[1].status === "fulfilled") {
          setProjects(results[1].value.map((p) => normalizeProject(p)));
        }
        if (results[2].status === "fulfilled") {
          const now = Date.now();
          setStories(
            results[2].value.filter(
              (s) =>
                !s.createdAt ||
                now - new Date(s.createdAt).getTime() <= 24 * 60 * 60 * 1000,
            ),
          );
        }
        if (results[3].status === "fulfilled") setTestimonials(results[3].value);
        if (results[4].status === "fulfilled") {
          setClientLogos(results[4].value.map((l) => normalizeLogo(l)));
        }
        setReady(true);
      });
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, []);

  const name = profile?.designerName?.trim() || "Motion Studio";
  const bio =
    profile?.bio ||
    "Motion designer. Logo films, explainers, reels — brands that move.";
  const avatar = mediaUrl(profile?.avatarUrl);
  const aboutPhoto = mediaUrl(profile?.aboutPhotoUrl);
  const liveStories = stories.filter((s) => mediaUrl(s.mediaUrl));
  const doubled = useMemo(
    () => (testimonials.length ? [...testimonials, ...testimonials] : []),
    [testimonials],
  );

  // ----- Story autoplay (progress bar + auto-advance) -----
  const storyTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (storyTimer.current) clearInterval(storyTimer.current);
    if (storyIndex === null) return;
    setStoryProgress(0);
    const start = Date.now();
    storyTimer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / STORY_DURATION_MS);
      setStoryProgress(p);
      if (p >= 1) {
        setStoryIndex((i) =>
          i === null || i >= liveStories.length - 1 ? null : i + 1,
        );
      }
    }, 60);
    return () => {
      if (storyTimer.current) clearInterval(storyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex]);

  const currentStory =
    storyIndex !== null ? liveStories[storyIndex] : undefined;

  return {
    ready,
    profile,
    projects,
    stories,
    testimonials,
    setTestimonials,
    name,
    bio,
    avatar,
    aboutPhoto,
    clientLogos,
    liveStories,
    doubled,
    storyIndex,
    setStoryIndex,
    storyProgress,
    currentStory,
  };
}

export type StudioData = ReturnType<typeof useStudioData>;

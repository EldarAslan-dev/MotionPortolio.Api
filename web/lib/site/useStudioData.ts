"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/config";
import type { Project, Story, StudioProfile, Testimonial } from "@/lib/types";

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
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      api.profile(),
      api.projects(),
      api.stories(),
      api.testimonials(),
    ]).then((results) => {
      if (results[0].status === "fulfilled") {
        const p = results[0].value as StudioProfile & { HeroVideoUrl?: string };
        setProfile({
          ...p,
          heroVideoUrl: p.heroVideoUrl || p.HeroVideoUrl || "",
        });
      }
      if (results[1].status === "fulfilled") setProjects(results[1].value);
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
      setReady(true);
    });
  }, []);

  const name = profile?.designerName || "Motion Studio";
  const bio =
    profile?.bio ||
    "Motion Designer və Video Editor — logo animasiyaları, izahedici videolar və sosial media montajı ilə brend hekayələrini canlandırıram.";
  const avatar = mediaUrl(profile?.avatarUrl);
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
    liveStories,
    doubled,
    storyIndex,
    setStoryIndex,
    storyProgress,
    currentStory,
  };
}

export type StudioData = ReturnType<typeof useStudioData>;

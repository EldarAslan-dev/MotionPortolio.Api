import type { GalleryItem, Project, ProjectComment, ToolItem } from "./types";
import { DEFAULT_TOOLS } from "./site/copy";

export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") return "";
  }
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env === "") return "";
  return env ?? "http://localhost:5118";
}

export const API_URL = getApiUrl();

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = getApiUrl().replace(/\/$/, "");
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];

function inferGalleryType(url: string): "image" | "video" {
  const lower = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext)) ? "video" : "image";
}

/**
 * Parses a project's `galleryJson` column into a typed media list, tolerant of
 * empty/invalid input. Accepts both the current `{url, type}[]` shape and the
 * legacy plain `string[]` shape (type inferred from file extension in that case).
 */
export function parseGallery(json: string | null | undefined): GalleryItem[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const items: GalleryItem[] = [];
    for (const entry of parsed) {
      if (typeof entry === "string" && entry) {
        items.push({ url: entry, type: inferGalleryType(entry) });
      } else if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { url?: unknown }).url === "string" &&
        (entry as { url: string }).url
      ) {
        const url = (entry as { url: string }).url;
        const rawType = (entry as { type?: unknown }).type;
        const type: GalleryItem["type"] =
          rawType === "video" ? "video" : rawType === "image" ? "image" : inferGalleryType(url);
        const rawPoster =
          (entry as { posterUrl?: unknown }).posterUrl || (entry as { PosterUrl?: unknown }).PosterUrl;
        const posterUrl = typeof rawPoster === "string" && rawPoster ? rawPoster : undefined;
        items.push(posterUrl ? { url, type, posterUrl } : { url, type });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export function normalizeProject(
  p: Project & {
    CardImageUrl?: string;
    LikesCount?: number;
    Comments?: Array<{
      id?: number;
      Id?: number;
      authorName?: string;
      AuthorName?: string;
      content?: string;
      Content?: string;
      createdAt?: string;
      CreatedAt?: string;
    }>;
  },
): Project {
  const raw = (p.Comments ?? p.comments ?? []) as Array<{
    id?: number;
    Id?: number;
    authorName?: string;
    AuthorName?: string;
    content?: string;
    Content?: string;
    createdAt?: string;
    CreatedAt?: string;
  }>;
  const comments: ProjectComment[] = raw.map((c) => ({
    id: c.id || c.Id || 0,
    authorName: c.authorName || c.AuthorName || "",
    content: c.content || c.Content || "",
    createdAt: c.createdAt || c.CreatedAt || "",
  }));
  return {
    ...p,
    cardImageUrl: p.cardImageUrl || p.CardImageUrl || "",
    likesCount: p.likesCount ?? p.LikesCount ?? 0,
    comments,
  };
}

/** Dedicated hero-gallery media from the profile field — never mixed with project covers. */
export function parseHeroGallery(json: string | null | undefined): GalleryItem[] {
  return parseGallery(json);
}

export function isVideoMedia(item: Pick<GalleryItem, "url" | "type">): boolean {
  return item.type === "video" || inferGalleryType(item.url) === "video";
}

export function parseTools(json: string | null | undefined): ToolItem[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const items: ToolItem[] = [];
    for (const entry of parsed) {
      if (typeof entry === "string" && entry.trim()) {
        items.push({ id: `tool-${items.length}`, name: entry.trim(), logoUrl: "" });
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      const raw = entry as { id?: unknown; name?: unknown; logoUrl?: unknown };
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      const logoUrl = typeof raw.logoUrl === "string" ? raw.logoUrl : "";
      if (!name && !logoUrl) continue;
      items.push({
        id: typeof raw.id === "string" && raw.id ? raw.id : `tool-${items.length}`,
        name,
        logoUrl,
      });
    }
    return items;
  } catch {
    return [];
  }
}

export function resolveTools(json: string | null | undefined): ToolItem[] {
  const items = parseTools(json);
  return items.length > 0 ? items : DEFAULT_TOOLS;
}

function isImagePath(path: string) {
  return inferGalleryType(path) === "image";
}

/** Still image shown on cards / thumbs so videos never render empty. */
export function projectPoster(
  project: Pick<Project, "cardImageUrl" | "thumbnailUrl" | "galleryJson" | "videoUrl">,
): string {
  const card = project.cardImageUrl || "";
  if (card && isImagePath(card)) return card;
  const thumb = project.thumbnailUrl || "";
  if (thumb && isImagePath(thumb)) return thumb;
  const gallery = parseGallery(project.galleryJson);
  const image = gallery.find((item) => item.type === "image");
  if (image?.url) return image.url;
  const posted = gallery.find((item) => item.posterUrl);
  if (posted?.posterUrl) return posted.posterUrl;
  return card || thumb;
}

/** Cover media for work-grid cards: poster still, else primary video, else first gallery item. */
export function projectCover(
  project: Pick<Project, "videoUrl" | "thumbnailUrl" | "galleryJson" | "cardImageUrl">,
): GalleryItem | null {
  const poster = projectPoster(project);
  if (poster) return { url: poster, type: "image" };
  if (project.videoUrl) return { url: project.videoUrl, type: "video" };
  const gallery = parseGallery(project.galleryJson);
  if (gallery[0]) return gallery[0];
  return null;
}

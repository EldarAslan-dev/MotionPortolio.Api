import type { GalleryItem, Project } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5118";

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = API_URL.replace(/\/$/, "");
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
        items.push({ url, type });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/** Dedicated hero-gallery images from the profile field — never mixed with project covers. */
export function parseHeroGallery(json: string | null | undefined): GalleryItem[] {
  return parseGallery(json).filter((item) => item.type === "image");
}

/** Cover media for work-grid cards: primary video, else first gallery item, else thumbnail. */
export function projectCover(
  project: Pick<Project, "videoUrl" | "thumbnailUrl" | "galleryJson">,
): GalleryItem | null {
  if (project.videoUrl) return { url: project.videoUrl, type: "video" };
  const gallery = parseGallery(project.galleryJson);
  if (gallery[0]) return gallery[0];
  if (project.thumbnailUrl) return { url: project.thumbnailUrl, type: "image" };
  return null;
}

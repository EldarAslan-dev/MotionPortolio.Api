export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5118";

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = API_URL.replace(/\/$/, "");
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

import { API_URL } from "./config";
import type {
  ChatMessage,
  Project,
  Story,
  StudioProfile,
  Testimonial,
} from "./types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  profile: () => getJson<StudioProfile>("/api/profile"),
  projects: () => getJson<Project[]>("/api/projects"),
  stories: () => getJson<Story[]>("/api/stories"),
  testimonials: () => getJson<Testimonial[]>("/api/testimonials"),
  messages: (clientId: string) =>
    getJson<ChatMessage[]>(
      `/api/messages/client/${encodeURIComponent(clientId)}`,
    ),

  register: (clientName: string, clientEmail: string) =>
    fetch(`${API_URL}/api/inquiries/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, clientEmail }),
    }),

  inquiry: (payload: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    selectedProjectTitle: string;
    budget: string;
    message: string;
  }) =>
    fetch(`${API_URL}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  testimonial: (payload: {
    clientName: string;
    company: string;
    comment: string;
    rating: number;
  }) =>
    fetch(`${API_URL}/api/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

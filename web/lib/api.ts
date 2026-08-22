import { authHeader } from "./auth";
import { API_URL } from "./config";
import type {
  ChatMessage,
  Conversation,
  Inquiry,
  OrderMessage,
  Project,
  StaffJob,
  StaffUser,
  Story,
  StudioProfile,
  Testimonial,
} from "./types";

async function getJson<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: { ...authHeader(token ?? null) },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

function json(path: string, method: string, body: unknown, token?: string | null) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token ?? null),
    },
    body: JSON.stringify(body),
  });
}

function del(path: string, token?: string | null) {
  return fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { ...authHeader(token ?? null) },
  });
}

export const api = {
  profile: () => getJson<StudioProfile>("/api/profile"),
  updateProfile: (profile: StudioProfile) => json("/api/profile", "PUT", profile),

  projects: () => getJson<Project[]>("/api/projects"),
  projectById: (id: number) => getJson<Project>(`/api/projects/${id}`),
  createProject: (payload: Partial<Project>, token: string) =>
    json("/api/projects", "POST", payload, token),
  updateProject: (id: number, payload: Partial<Project>, token: string) =>
    json(`/api/projects/${id}`, "PUT", payload, token),
  deleteProject: (id: number, token: string) => del(`/api/projects/${id}`, token),

  stories: () => getJson<Story[]>("/api/stories"),
  createStory: (payload: { title: string; mediaUrl: string; mediaType: string }) =>
    json("/api/stories", "POST", payload),

  testimonials: () => getJson<Testimonial[]>("/api/testimonials"),
  createTestimonial: (
    payload: { clientName: string; company: string; comment: string; rating: number },
    token?: string,
  ) => json("/api/testimonials", "POST", payload, token),
  deleteTestimonial: (id: number, token: string) =>
    del(`/api/testimonials/${id}`, token),

  messages: (clientId: string) =>
    getJson<ChatMessage[]>(`/api/messages/client/${encodeURIComponent(clientId)}`),
  adminClientMessages: (clientId: string, token: string) =>
    getJson<ChatMessage[]>(
      `/api/messages/client/${encodeURIComponent(clientId)}`,
      token,
    ),
  orderMessages: (orderNumber: string) =>
    getJson<OrderMessage[]>(`/api/messages/${encodeURIComponent(orderNumber)}`),
  conversations: (token: string) =>
    getJson<Conversation[]>("/api/messages/conversations", token),
  clearClientMessages: (clientId: string, token: string) =>
    del(`/api/messages/client/${encodeURIComponent(clientId)}`, token),
  deleteConversation: (clientId: string, token: string) =>
    del(`/api/messages/client/${encodeURIComponent(clientId)}/full`, token),

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
  }) => json("/api/inquiries", "POST", payload),

  inquiries: (token: string) => getJson<Inquiry[]>("/api/inquiries", token),
  myAssignments: (token: string) => getJson<StaffJob[]>("/api/inquiries/staff", token),
  updateInquiryStatus: (id: number, status: string, token: string) =>
    json(`/api/inquiries/${id}/status`, "PUT", { status }, token),
  assignStaff: (id: number, staffUsername: string, token: string) =>
    json(`/api/inquiries/${id}/assign`, "POST", { staffUsername }, token),
  approveStaffFile: (id: number, token: string) =>
    fetch(`${API_URL}/api/inquiries/${id}/approve-staff-file`, {
      method: "POST",
      headers: { ...authHeader(token) },
    }),
  toggleClientChat: (id: number, token: string) =>
    fetch(`${API_URL}/api/inquiries/${id}/toggle-client-chat`, {
      method: "POST",
      headers: { ...authHeader(token) },
    }),
  deliverFile: (id: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/api/inquiries/${id}/deliver`, {
      method: "POST",
      headers: { ...authHeader(token) },
      body: formData,
    });
  },
  staffDeliverFile: (id: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/api/inquiries/${id}/staff-deliver`, {
      method: "POST",
      headers: { ...authHeader(token) },
      body: formData,
    });
  },
  deleteInquiry: (id: number, token: string) => del(`/api/inquiries/${id}`, token),

  login: (username: string, password: string) =>
    fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (oldPassword: string, newPassword: string, token: string) =>
    json("/api/auth/change-password", "POST", { oldPassword, newPassword }, token),
  staffList: (token: string) => getJson<StaffUser[]>("/api/auth/staff", token),
  createStaff: (username: string, password: string, token: string) =>
    json("/api/auth/staff", "POST", { username, password }, token),
  deleteStaff: (id: number, token: string) => del(`/api/auth/staff/${id}`, token),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
  },
};

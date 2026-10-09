import { adminAuth, authHeader } from "./auth";
import { getApiUrl } from "./config";
import type {
  ChatMessage,
  Conversation,
  Inquiry,
  TrackOrder,
  MyOrder,
  SiteAccount,
  MemberAccount,
  MemberGift,
  OrderMessage,
  Project,
  StaffJob,
  StaffUser,
  Story,
  StudioProfile,
  Testimonial,
  ClientLogo,
} from "./types";

function notifyAuthLost(path: string, status: number) {
  if (status !== 401 && status !== 403) return;
  if (path.includes("/api/auth/login")) return;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("admin-auth-lost"));
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    cache: "no-store",
    ...init,
  });
  notifyAuthLost(path, res.status);
  return res;
}

async function getJson<T>(path: string, token?: string | null): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await request(`${path}${sep}_=${Date.now()}`, {
    headers: { ...authHeader(token ?? null) },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

function json(path: string, method: string, body: unknown, token?: string | null) {
  return request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token ?? null),
    },
    body: JSON.stringify(body),
  });
}

function del(path: string, token?: string | null) {
  return request(path, {
    method: "DELETE",
    headers: { ...authHeader(token ?? null) },
  });
}

export const api = {
  profile: () => getJson<StudioProfile>("/api/profile"),
  updateProfile: (profile: StudioProfile, token: string) =>
    json("/api/profile", "PUT", profile, token),

  projects: () => getJson<Project[]>("/api/projects"),
  projectById: (id: number) => getJson<Project>(`/api/projects/${id}`),
  createProject: (payload: Partial<Project>, token: string) =>
    json("/api/projects", "POST", payload, token),
  updateProject: (id: number, payload: Partial<Project>, token: string) =>
    json(`/api/projects/${id}`, "PUT", payload, token),
  deleteProject: (id: number, token: string) => del(`/api/projects/${id}`, token),
  likeProject: (id: number) => json(`/api/projects/${id}/like`, "POST", {}),
  commentProject: (id: number, payload: { authorName: string; content: string }) =>
    json(`/api/projects/${id}/comment`, "POST", payload),
  setProjectLikes: (id: number, likesCount: number, token: string) =>
    json(`/api/projects/${id}/likes`, "PUT", { likesCount }, token),
  deleteProjectComment: (projectId: number, commentId: number, token: string) =>
    del(`/api/projects/${projectId}/comments/${commentId}`, token),

  stories: () => getJson<Story[]>("/api/stories"),
  createStory: (
    payload: { title: string; mediaUrl: string; mediaType: string },
    token: string,
  ) => json("/api/stories", "POST", payload, token),

  testimonials: () => getJson<Testimonial[]>("/api/testimonials"),
  createTestimonial: (
    payload: { clientName: string; company: string; comment: string; rating: number },
    token: string,
  ) => json("/api/testimonials", "POST", payload, token),
  deleteTestimonial: (id: number, token: string) =>
    del(`/api/testimonials/${id}`, token),

  clientLogos: () => getJson<ClientLogo[]>("/api/clientlogos"),
  createClientLogo: (payload: Partial<ClientLogo>, token: string) =>
    json("/api/clientlogos", "POST", payload, token),
  updateClientLogo: (id: number, payload: Partial<ClientLogo>, token: string) =>
    json(`/api/clientlogos/${id}`, "PUT", payload, token),
  deleteClientLogo: (id: number, token: string) =>
    del(`/api/clientlogos/${id}`, token),

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
    json("/api/inquiries/register", "POST", { clientName, clientEmail }),
  clientLogin: (clientEmail: string, password = "") =>
    json("/api/inquiries/client-login", "POST", { clientEmail, password }),
  members: (token: string) => getJson<MemberAccount[]>("/api/members", token),
  deleteMember: (clientId: string, token: string) =>
    del(`/api/members/${encodeURIComponent(clientId)}`, token),
  setMemberPassword: (clientId: string, password: string, token: string) =>
    json(`/api/members/${encodeURIComponent(clientId)}/password`, "PUT", { password }, token),
  addMemberGift: (
    clientId: string,
    payload: { kind: string; title: string; detail: string },
    token: string,
  ) => json(`/api/members/${encodeURIComponent(clientId)}/gifts`, "POST", payload, token),
  myGifts: (clientId: string) =>
    getJson<MemberGift[]>(`/api/members/mine/${encodeURIComponent(clientId)}`),
  reorderLogos: (ids: number[], token: string) =>
    json("/api/clientlogos/order", "PUT", { ids }, token),
  reorderProjects: (ids: number[], token: string) =>
    json("/api/projects/order", "PUT", { ids }, token),
  myOrders: (clientId: string) =>
    getJson<MyOrder[]>(`/api/inquiries/mine/${encodeURIComponent(clientId)}`),
  accounts: (token: string) => getJson<SiteAccount[]>("/api/inquiries/accounts", token),
  broadcast: (subject: string, message: string, token: string) =>
    json("/api/inquiries/broadcast", "POST", { subject, message }, token),
  updateClientProfile: (clientId: string, clientName: string, clientEmail: string) =>
    json("/api/inquiries/profile", "PUT", { clientId, clientName, clientEmail }),
  uploadClientAvatar: (clientId: string, file: File) => {
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("file", file);
    return request("/api/inquiries/avatar", { method: "POST", body: formData });
  },
  clientLikes: (clientId: string) =>
    getJson<number[]>(`/api/inquiries/likes/${encodeURIComponent(clientId)}`),
  saveLike: (clientId: string, projectId: number) =>
    json("/api/inquiries/likes", "POST", { clientId, projectId }),

  briefAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/inquiries/attachment", { method: "POST", body: formData });
  },

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
    request(`/api/inquiries/${id}/approve-staff-file`, {
      method: "POST",
      headers: { ...authHeader(token) },
    }),
  toggleClientChat: (id: number, token: string) =>
    request(`/api/inquiries/${id}/toggle-client-chat`, {
      method: "POST",
      headers: { ...authHeader(token) },
    }),
  prepareDelivery: (id: number, file: File | null, link: string, token: string) => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (link) formData.append("link", link);
    return request(`/api/inquiries/${id}/deliver`, {
      method: "POST",
      headers: { ...authHeader(token) },
      body: formData,
    });
  },
  confirmPayment: (id: number, token: string) =>
    request(`/api/inquiries/${id}/confirm`, {
      method: "POST",
      headers: { ...authHeader(token) },
    }),
  inquiryReceipt: (id: number, token: string) =>
    request(`/api/inquiries/${id}/receipt`, { headers: { ...authHeader(token) } }),
  trackOrder: (token: string) => getJson<TrackOrder>(`/api/inquiries/track/${encodeURIComponent(token)}`),
  uploadReceipt: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("receipt", file);
    return request(`/api/inquiries/track/${encodeURIComponent(token)}/receipt`, {
      method: "POST",
      body: formData,
    });
  },
  staffDeliverFile: (id: number, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/api/inquiries/${id}/staff-deliver`, {
      method: "POST",
      headers: { ...authHeader(token) },
      body: formData,
    });
  },
  deleteInquiry: (id: number, token: string) => del(`/api/inquiries/${id}`, token),

  login: (username: string, password: string) =>
    json("/api/auth/login", "POST", { username, password }),
  me: (token: string) => getJson<{ username: string; role: string }>("/api/auth/me", token),
  changePassword: (oldPassword: string, newPassword: string, token: string) =>
    json("/api/auth/change-password", "POST", { oldPassword, newPassword }, token),
  staffList: (token: string) => getJson<StaffUser[]>("/api/auth/staff", token),
  createStaff: (username: string, password: string, token: string) =>
    json("/api/auth/staff", "POST", { username, password }, token),
  deleteStaff: (id: number, token: string) => del(`/api/auth/staff/${id}`, token),

  upload: (file: File, token?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    const auth = token ?? adminAuth.getToken();
    return request("/api/upload", {
      method: "POST",
      headers: { ...authHeader(auth) },
      body: formData,
    });
  },
};

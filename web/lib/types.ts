export type StudioProfile = {
  id: number;
  designerName: string;
  bio: string;
  avatarUrl: string;
  aboutPhotoUrl?: string;
  heroGalleryJson?: string;
  heroVideoUrl?: string;
  instagramUrl: string;
  announcementText: string;
  showAnnouncement: boolean;
  notesJson?: string;
};

export type GalleryItem = {
  url: string;
  type: "image" | "video";
};

export type Project = {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  cardImageUrl?: string;
  category: string;
  likesCount: number;
  createdAt?: string;
  year?: string | null;
  processNotes?: string | null;
  galleryJson?: string;
};

export type Story = {
  id: number;
  title: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
};

export type ClientLogo = {
  id: number;
  name: string;
  logoUrl: string;
  sortOrder: number;
};

export type Testimonial = {
  id: number;
  clientName: string;
  company: string;
  comment: string;
  rating: number;
};

export type ChatMessage = {
  id: number;
  clientId: string;
  clientName: string;
  sender: string;
  content: string;
  sentAt: string;
};

export type OrderMessage = {
  id: number;
  orderNumber: string;
  sender: string;
  content: string;
  sentAt: string;
};

export type Conversation = {
  clientId: string;
  clientName: string;
  lastMessage: string | null;
  lastSender: string | null;
  lastAt: string | null;
  hasMessages: boolean;
};

export type Inquiry = {
  id: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  budget: string;
  message: string;
  selectedProjectTitle: string | null;
  status: string;
  orderNumber: string;
  deliveredFileUrl: string | null;
  createdAt: string;
  assignedStaffUsername: string | null;
  staffFileUrl: string | null;
  staffFileReady: boolean;
  clientChatEnabled: boolean;
};

export type StaffJob = {
  id: number;
  orderNumber: string;
  selectedProjectTitle: string | null;
  budget: string;
  message: string;
  status: string;
  staffFileUrl: string | null;
  staffFileReady: boolean;
  clientChatEnabled: boolean;
  createdAt: string;
};

export type StaffUser = {
  id: number;
  username: string;
};

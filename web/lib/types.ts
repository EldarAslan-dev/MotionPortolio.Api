export type StudioProfile = {
  id: number;
  designerName: string;
  bio: string;
  avatarUrl: string;
  aboutPhotoUrl?: string;
  aboutTeaser?: string;
  aboutBody?: string;
  toolsJson?: string;
  heroGalleryJson?: string;
  heroVideoUrl?: string;
  instagramUrl: string;
  announcementText: string;
  showAnnouncement: boolean;
  notesJson?: string;
  siteDesignJson?: string;
  offersJson?: string;
};

export type GalleryItem = {
  url: string;
  type: "image" | "video";
  posterUrl?: string;
  width?: number;
  height?: number;
  radius?: number;
  fit?: "cover" | "contain";
};

export type ToolItem = {
  id: string;
  name: string;
  logoUrl: string;
};

export type ProjectComment = {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
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
  comments?: ProjectComment[];
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
  clientEmail?: string;
  avatarUrl?: string | null;
  lastMessage: string | null;
  lastSender: string | null;
  lastAt: string | null;
  hasMessages: boolean;
};

export type MyOrder = {
  id: number;
  orderNumber: string;
  status: string;
  selectedProjectTitle: string | null;
  budget: string;
  message: string;
  createdAt: string;
  deliveredFileUrl: string | null;
  clientId: string;
  clientName: string;
  receiptUploaded?: boolean;
};

export type SiteAccount = {
  clientId: string;
  clientName: string;
  clientEmail: string;
  avatarUrl: string;
  createdAt: string;
};

export type MemberGift = {
  id: number;
  kind: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type MemberAccount = {
  clientId: string;
  name: string;
  email: string;
  createdAt: string;
  hasPassword: boolean;
  orders: number;
  paid: { currency: string; amount: number }[];
  ledger: {
    id: number;
    orderNumber: string;
    status: string;
    budget: string;
    title: string;
    createdAt: string;
  }[];
  gifts: MemberGift[];
};

export type TrackOrder = {
  order_id: string;
  client_name: string;
  package_name: string;
  amount: string;
  status: string;
  receipt_uploaded: boolean;
  payment?: { m10: string; card: string; bank: string } | null;
  download_url?: string | null;
};

export type Inquiry = {
  id: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAvatarUrl?: string | null;
  budget: string;
  message: string;
  selectedProjectTitle: string | null;
  status: string;
  orderNumber: string;
  deliveredFileUrl: string | null;
  trackToken: string;
  deliverableLink: string | null;
  receiptAt: string | null;
  hasReceipt: boolean;
  hasDeliverable: boolean;
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

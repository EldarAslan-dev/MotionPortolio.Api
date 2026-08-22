export type StudioProfile = {
  id: number;
  designerName: string;
  bio: string;
  avatarUrl: string;
  instagramUrl: string;
  announcementText: string;
  showAnnouncement: boolean;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  likesCount: number;
};

export type Story = {
  id: number;
  title: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
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

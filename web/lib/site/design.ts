export type WorkGroup = { id: string; title: string; category: string };
export type SitePage = { id: string; title: string; slug: string; body: string };

export type SiteDesign = {
  logoRole: string;
  headline: string;
  headlineSize: number;
  subline: string;
  sublineSize: number;
  worksLabel: string;
  worksSize: number;
  clientsLabel: string;
  clientsSize: number;
  contactTitle: string;
  contactSize: number;
  contactButton: string;
  exploreLabel: string;
  touchLabel: string;
  linkedinUrl: string;
  behanceUrl: string;
  instagramLabel: string;
  linkedinLabel: string;
  behanceLabel: string;
  colorsOn: boolean;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  gradient: boolean;
  gradientAngle: number;
  groups: WorkGroup[];
  pages: SitePage[];
};

export const DEFAULT_DESIGN: SiteDesign = {
  logoRole: "Motion & Art Direction",
  headline: "Motion choreography shaped for visionary brands.",
  headlineSize: 92,
  subline:
    "Graphic design, kinetic typography, and 3D CGI direction built for digital products and commercial campaigns.",
  sublineSize: 16,
  worksLabel: "Selected works",
  worksSize: 22,
  clientsLabel: "Companies we've worked with",
  clientsSize: 22,
  contactTitle: "Let's build something people remember.",
  contactSize: 84,
  contactButton: "GET IN TOUCH",
  exploreLabel: "Explore works",
  touchLabel: "Get in touch",
  linkedinUrl: "https://www.linkedin.com/in/bilgeyis-mirzazada-b61a38216",
  behanceUrl: "https://www.behance.net/billqeis",
  instagramLabel: "Instagram",
  linkedinLabel: "LinkedIn",
  behanceLabel: "Behance",
  colorsOn: false,
  bg: "#faf7f1",
  surface: "#ffffff",
  text: "#1b1611",
  muted: "#7a6f64",
  accent: "#b45309",
  accent2: "#d97706",
  gradient: true,
  gradientAngle: 100,
  groups: [],
  pages: [],
};

function num(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function parseDesign(raw: string | null | undefined): SiteDesign {
  if (!raw) return { ...DEFAULT_DESIGN, groups: [], pages: [] };
  try {
    const data = JSON.parse(raw) as Partial<SiteDesign>;
    return {
      ...DEFAULT_DESIGN,
      ...data,
      headlineSize: num(data.headlineSize, DEFAULT_DESIGN.headlineSize, 28, 140),
      sublineSize: num(data.sublineSize, DEFAULT_DESIGN.sublineSize, 12, 32),
      worksSize: num(data.worksSize, DEFAULT_DESIGN.worksSize, 14, 64),
      clientsSize: num(data.clientsSize, DEFAULT_DESIGN.clientsSize, 14, 64),
      contactSize: num(data.contactSize, DEFAULT_DESIGN.contactSize, 28, 120),
      gradientAngle: num(data.gradientAngle, DEFAULT_DESIGN.gradientAngle, 0, 360),
      groups: Array.isArray(data.groups) ? data.groups : [],
      pages: Array.isArray(data.pages) ? data.pages : [],
    };
  } catch {
    return { ...DEFAULT_DESIGN, groups: [], pages: [] };
  }
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

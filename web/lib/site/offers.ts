export type Currency = "USD" | "AZN";

export type OfferPackage = {
  id: string;
  title: string;
  price: number;
  currency: Currency;
};

export type QuestionKind = "text" | "long" | "chips" | "email" | "file" | "styles";

export type BriefField = {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  kind: QuestionKind;
  custom?: boolean;
  options?: string[];
};

export type OffersConfig = {
  packages: OfferPackage[];
  fields: BriefField[];
  styleTags: string[];
};

const FIELDS: BriefField[] = [
  { key: "email", label: "Email", placeholder: "name@studio.com", required: true, enabled: true, kind: "email" },
  { key: "telegram", label: "Telegram və ya WhatsApp", placeholder: "@username və ya +994...", required: false, enabled: true, kind: "text" },
  { key: "brandName", label: "Markanın adı", placeholder: "Markanın və ya layihənin dəqiq adı", required: true, enabled: true, kind: "text" },
  { key: "tagline", label: "Sloqan", placeholder: "Sloqan və ya alt yazı, varsa", required: false, enabled: true, kind: "text" },
  { key: "industry", label: "Fəaliyyət sahəsi", placeholder: "Məsələn: kafe, fintech, geyim", required: false, enabled: true, kind: "text" },
  { key: "targetAudience", label: "Hədəf kütlə", placeholder: "Bu işi kim görəcək?", required: false, enabled: true, kind: "long" },
  { key: "styleTags", label: "Stil", placeholder: "", required: false, enabled: true, kind: "styles" },
  { key: "colorPreferences", label: "Rənglər", placeholder: "İstənilən və ya qətiyyən istənilməyən rənglər", required: false, enabled: true, kind: "text" },
  { key: "references", label: "Referanslar", placeholder: "Pinterest, Behance və ya sayt linkləri", required: false, enabled: true, kind: "long" },
  { key: "file", label: "Fayl", placeholder: "PNG, JPG, SVG və ya PDF", required: false, enabled: true, kind: "file" },
  { key: "notes", label: "Qeydlər", placeholder: "Qaçınılması vacib olan detallar", required: false, enabled: true, kind: "long" },
];

const BUILT_IN = new Set(FIELDS.map((field) => field.key));

function kindOf(value: unknown, fallback: QuestionKind): QuestionKind {
  if (value === "text" || value === "long" || value === "chips" || value === "email" || value === "file" || value === "styles") {
    return value;
  }
  return fallback;
}

export const DEFAULT_OFFERS: OffersConfig = {
  packages: [
    { id: "logo", title: "Logo short", price: 150, currency: "USD" },
    { id: "standard", title: "Standard", price: 300, currency: "USD" },
    { id: "campaign", title: "Campaign", price: 600, currency: "USD" },
  ],
  fields: FIELDS,
  styleTags: ["Minimalist", "Modern", "Lüks", "Əyləncəli", "Korporativ", "Bold"],
};

export function money(price: number, currency: Currency) {
  const n = Number.isFinite(price) ? price : 0;
  return currency === "AZN" ? `${n} ₼` : `$${n}`;
}

export function parseOffers(raw: string | null | undefined): OffersConfig {
  if (!raw) return { packages: [...DEFAULT_OFFERS.packages], fields: FIELDS.map((f) => ({ ...f })), styleTags: [...DEFAULT_OFFERS.styleTags] };
  try {
    const data = JSON.parse(raw) as Partial<OffersConfig>;
    const packages = Array.isArray(data.packages)
      ? data.packages
          .filter((item) => item && item.title)
          .map((item) => ({
            id: String(item.id || crypto.randomUUID()),
            title: String(item.title),
            price: Number(item.price) || 0,
            currency: item.currency === "AZN" ? "AZN" as const : "USD" as const,
          }))
      : DEFAULT_OFFERS.packages;
    const savedFields = Array.isArray(data.fields) ? data.fields : [];
    const byKey = new Map(savedFields.map((field) => [field.key, field]));
    const fields = FIELDS.map((field) => {
      const saved = byKey.get(field.key);
      if (!saved) return { ...field };
      return {
        ...field,
        label: String(saved.label || field.label),
        placeholder: String(saved.placeholder ?? field.placeholder),
        required: Boolean(saved.required),
        enabled: saved.enabled !== false,
      };
    });
    for (const saved of savedFields) {
      if (!saved || !saved.custom || BUILT_IN.has(String(saved.key))) continue;
      const options = Array.isArray(saved.options)
        ? saved.options.map((item) => String(item).trim()).filter(Boolean)
        : [];
      const kind = kindOf(saved.kind, "text");
      fields.push({
        key: String(saved.key),
        label: String(saved.label || "Sual"),
        placeholder: String(saved.placeholder || ""),
        required: Boolean(saved.required),
        enabled: saved.enabled !== false,
        kind: kind === "long" || kind === "chips" ? kind : "text",
        custom: true,
        options,
      });
    }
    const styleTags = Array.isArray(data.styleTags)
      ? data.styleTags.map((tag) => String(tag).trim()).filter(Boolean)
      : DEFAULT_OFFERS.styleTags;
    return {
      packages,
      fields,
      styleTags: styleTags.length ? styleTags : DEFAULT_OFFERS.styleTags,
    };
  } catch {
    return { packages: [...DEFAULT_OFFERS.packages], fields: FIELDS.map((f) => ({ ...f })), styleTags: [...DEFAULT_OFFERS.styleTags] };
  }
}

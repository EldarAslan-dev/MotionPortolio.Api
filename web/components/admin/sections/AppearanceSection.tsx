"use client";

import { useEffect, useState } from "react";
import { AdminCard, adminBtn, adminFieldClass } from "@/components/admin/ui";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_DESIGN, parseDesign, slugify, type SiteDesign } from "@/lib/site/design";
import type { StudioProfile } from "@/lib/types";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-bone">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${adminFieldClass} w-28`}
        />
      </span>
    </label>
  );
}

function Preview({ name, design }: { name: string; design: SiteDesign }) {
  const fill = design.gradient
    ? `linear-gradient(${design.gradientAngle}deg, ${design.text}, ${design.accent} 45%, ${design.accent2})`
    : design.text;
  const button = design.gradient
    ? `linear-gradient(${design.gradientAngle}deg, ${design.accent}, ${design.accent2})`
    : design.accent;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 p-5" style={{ background: design.bg, color: design.text }}>
      <b style={{ fontSize: 15 }}>{name || "Bilgeyis Mirzazada"}</b>
      <div style={{ fontSize: 12, color: design.muted }}>{design.logoRole}</div>
      <div
        className="mt-4 font-extrabold leading-none"
        style={{
          fontSize: 28,
          background: fill,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: design.gradient ? "transparent" : design.text,
        }}
      >
        {design.headline}
      </div>
      <p className="mt-2" style={{ fontSize: design.sublineSize, color: design.muted }}>
        {design.subline}
      </p>
      <div className="mt-4 font-semibold" style={{ fontSize: design.worksSize, color: design.accent }}>
        {design.worksLabel}
      </div>
      <div className="mt-2 font-semibold" style={{ fontSize: design.clientsSize, color: design.accent }}>
        {design.clientsLabel}
      </div>
      <div className="mt-4 font-extrabold leading-none" style={{ fontSize: 26, background: fill, WebkitBackgroundClip: "text", backgroundClip: "text", color: design.gradient ? "transparent" : design.text }}>
        {design.contactTitle}
      </div>
      <span className="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ background: button }}>
        {design.contactButton}
      </span>
    </div>
  );
}

export function AppearanceSection({
  profile,
  onSave,
  onToast,
}: {
  profile: StudioProfile;
  onSave: (patch: Partial<StudioProfile>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(profile.designerName || "");
  const [design, setDesign] = useState<SiteDesign>(() => parseDesign(profile.siteDesignJson));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.designerName || "");
    setDesign(parseDesign(profile.siteDesignJson));
  }, [profile.designerName, profile.siteDesignJson]);

  function set<K extends keyof SiteDesign>(key: K, value: SiteDesign[K]) {
    setDesign((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({
        designerName: name,
        instagramUrl: profile.instagramUrl,
        siteDesignJson: JSON.stringify(design),
      });
      onToast("Sayt görünüşü yadda saxlandı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard title={t("sec.look")} hint={t("sec.lookHint")}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <label className="block text-sm text-bone">
            Ad
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">
            Rol
            <input value={design.logoRole} onChange={(e) => set("logoRole", e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">
            Hero başlığı
            <input value={design.headline} onChange={(e) => set("headline", e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">
            Hero ölçüsü {design.headlineSize}px
            <input type="range" min={36} max={120} value={design.headlineSize} onChange={(e) => set("headlineSize", Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="block text-sm text-bone">
            Hero alt yazı
            <textarea value={design.subline} onChange={(e) => set("subline", e.target.value)} rows={2} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">
            Alt yazı ölçüsü {design.sublineSize}px
            <input type="range" min={12} max={28} value={design.sublineSize} onChange={(e) => set("sublineSize", Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-bone">
              Selected works
              <input value={design.worksLabel} onChange={(e) => set("worksLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">
              Ölçü {design.worksSize}px
              <input type="range" min={14} max={48} value={design.worksSize} onChange={(e) => set("worksSize", Number(e.target.value))} className="mt-3 w-full" />
            </label>
            <label className="text-sm text-bone">
              Companies
              <input value={design.clientsLabel} onChange={(e) => set("clientsLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">
              Ölçü {design.clientsSize}px
              <input type="range" min={14} max={48} value={design.clientsSize} onChange={(e) => set("clientsSize", Number(e.target.value))} className="mt-3 w-full" />
            </label>
          </div>
          <label className="block text-sm text-bone">
            Əlaqə başlığı
            <input value={design.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">
            Əlaqə ölçüsü {design.contactSize}px
            <input type="range" min={28} max={110} value={design.contactSize} onChange={(e) => set("contactSize", Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-bone">Explore
              <input value={design.exploreLabel} onChange={(e) => set("exploreLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">Get in touch
              <input value={design.touchLabel} onChange={(e) => set("touchLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">Əlaqə düyməsi
              <input value={design.contactButton} onChange={(e) => set("contactButton", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-bone">Instagram adı
              <input value={design.instagramLabel} onChange={(e) => set("instagramLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">LinkedIn adı
              <input value={design.linkedinLabel} onChange={(e) => set("linkedinLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
            <label className="text-sm text-bone">Behance adı
              <input value={design.behanceLabel} onChange={(e) => set("behanceLabel", e.target.value)} className={`${adminFieldClass} mt-1`} />
            </label>
          </div>
          <label className="block text-sm text-bone">LinkedIn link
            <input value={design.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>
          <label className="block text-sm text-bone">Behance link
            <input value={design.behanceUrl} onChange={(e) => set("behanceUrl", e.target.value)} className={`${adminFieldClass} mt-1`} />
          </label>

          <div className="space-y-3 rounded-2xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm text-bone">
              <input type="checkbox" checked={design.colorsOn} onChange={(e) => set("colorsOn", e.target.checked)} />
              Rəng palitrasını sayta tətbiq et
            </label>
            <label className="flex items-center gap-2 text-sm text-bone">
              <input type="checkbox" checked={design.gradient} onChange={(e) => set("gradient", e.target.checked)} />
              Başlıq və düymədə gradient
            </label>
            <label className="block text-sm text-bone">
              Gradient bucağı {design.gradientAngle}°
              <input type="range" min={0} max={360} value={design.gradientAngle} onChange={(e) => set("gradientAngle", Number(e.target.value))} className="mt-1 w-full" />
            </label>
            <ColorField label="Fon" value={design.bg} onChange={(v) => set("bg", v)} />
            <ColorField label="Kart" value={design.surface} onChange={(v) => set("surface", v)} />
            <ColorField label="Yazı" value={design.text} onChange={(v) => set("text", v)} />
            <ColorField label="Solğun yazı" value={design.muted} onChange={(v) => set("muted", v)} />
            <ColorField label="Vurğu" value={design.accent} onChange={(v) => set("accent", v)} />
            <ColorField label="Vurğu 2" value={design.accent2} onChange={(v) => set("accent2", v)} />
            <div className="h-8 rounded-full" style={{ background: `linear-gradient(${design.gradientAngle}deg, ${design.accent}, ${design.accent2})` }} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <b className="text-sm text-bone">İş bölmələri</b>
              <button
                type="button"
                className={adminBtn}
                onClick={() => set("groups", [...design.groups, { id: crypto.randomUUID(), title: "Yeni bölmə", category: "" }])}
              >
                Bölmə əlavə et
              </button>
            </div>
            <p className="mb-2 text-xs text-mist">Kateqoriya portfeldəki işin kateqoriyası ilə eyni olmalıdır. Boş qoysan, başqa bölməyə düşməyən işlər burada görünər.</p>
            {design.groups.map((group) => (
              <div key={group.id} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                <input value={group.title} onChange={(e) => set("groups", design.groups.map((item) => item.id === group.id ? { ...item, title: e.target.value } : item))} className={adminFieldClass} />
                <input value={group.category} placeholder="Kateqoriya" onChange={(e) => set("groups", design.groups.map((item) => item.id === group.id ? { ...item, category: e.target.value } : item))} className={adminFieldClass} />
                <button type="button" className={adminBtn} onClick={() => set("groups", design.groups.filter((item) => item.id !== group.id))}>Sil</button>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <b className="text-sm text-bone">Əlavə səhifələr</b>
              <button
                type="button"
                className={adminBtn}
                onClick={() => set("pages", [...design.pages, { id: crypto.randomUUID(), title: "Yeni səhifə", slug: `sehife-${design.pages.length + 1}`, body: "" }])}
              >
                Səhifə əlavə et
              </button>
            </div>
            {design.pages.map((page) => (
              <div key={page.id} className="mb-3 space-y-2 rounded-xl border border-white/10 p-3">
                <input value={page.title} onChange={(e) => set("pages", design.pages.map((item) => item.id === page.id ? { ...item, title: e.target.value, slug: item.slug || slugify(e.target.value) } : item))} className={adminFieldClass} />
                <input value={page.slug} onChange={(e) => set("pages", design.pages.map((item) => item.id === page.id ? { ...item, slug: slugify(e.target.value) } : item))} className={adminFieldClass} />
                <textarea value={page.body} rows={3} onChange={(e) => set("pages", design.pages.map((item) => item.id === page.id ? { ...item, body: e.target.value } : item))} className={adminFieldClass} />
                <button type="button" className={adminBtn} onClick={() => set("pages", design.pages.filter((item) => item.id !== page.id))}>Sil</button>
              </div>
            ))}
          </div>

          <button type="button" className={adminBtn} disabled={saving} onClick={() => void save()}>
            {saving ? "Saxlanır…" : "Yadda saxla"}
          </button>
          <button type="button" className={`${adminBtn} ml-2`} onClick={() => setDesign({ ...DEFAULT_DESIGN, groups: [], pages: [] })}>
            İlkin görünüş
          </button>
        </div>
        <Preview name={name} design={design} />
      </div>
    </AdminCard>
  );
}

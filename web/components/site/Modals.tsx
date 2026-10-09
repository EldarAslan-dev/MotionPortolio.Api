"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ClientFace } from "@/components/ClientFace";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { money, parseOffers, type BriefField, type Currency } from "@/lib/site/offers";
import { useStudio } from "@/lib/site/StudioContext";

function Modal({
  open,
  onClose,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface text-bone shadow-2xl shadow-black/20 ${wide ? "max-w-3xl" : "max-w-md"}`}
      >
        {children}
      </div>
    </div>
  );
}

const pillClass =
  "w-full rounded-full border border-transparent bg-bone px-5 py-3 text-sm text-void placeholder:text-void/50 outline-none transition focus:border-void/40";
const areaClass =
  "w-full rounded-2xl border border-transparent bg-bone px-5 py-3 text-sm text-void placeholder:text-void/50 outline-none transition focus:border-void/40";
const submitClass =
  "shrink-0 rounded-full border border-bone/15 bg-void px-7 py-3 font-sans text-xs uppercase tracking-[0.15em] text-bone shadow-sm transition hover:bg-bone/5";

function ClientAuth() {
  const { t } = useI18n();
  const { registerOpen, setRegisterOpen, authMode, setAuthMode, authError, onLogin, onRegister, rememberedEmail } = useStudio();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-280, 280], [8, -8]);
  const rotateY = useTransform(mouseX, [-280, 280], [-8, 8]);
  if (!registerOpen) return null;
  const login = authMode === "login";

  return (
    <div className="auth-scene" onClick={(e) => e.target === e.currentTarget && setRegisterOpen(false)}>
      <div className="auth-glow" />
      <motion.div
        className="auth-stage"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ perspective: 1400 }}
      >
        <motion.form
          className="auth-card"
          style={{ rotateX, rotateY }}
          onSubmit={login ? onLogin : onRegister}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            mouseX.set(e.clientX - rect.left - rect.width / 2);
            mouseY.set(e.clientY - rect.top - rect.height / 2);
          }}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
        >
          <button type="button" className="auth-x" onClick={() => setRegisterOpen(false)} aria-label={t("auth.close")}>
            ✕
          </button>
          <div className="auth-mark">B</div>
          <h2>{login ? t("auth.welcome") : t("auth.register")}</h2>
          <p>{login ? t("auth.emailIn") : t("auth.nameEmail")}</p>
          {!login ? <input name="name" required placeholder={t("auth.name")} autoComplete="name" /> : null}
          <input name="email" type="email" required placeholder={t("auth.email")} autoComplete="email" defaultValue={rememberedEmail} key={rememberedEmail || "email"} />
          {login ? <input name="password" type="password" placeholder={t("auth.password")} autoComplete="current-password" /> : null}
          {authError ? <p className="auth-err">{authError}</p> : null}
          <button type="submit" className="auth-go">
            {login ? t("auth.signIn") : t("auth.create")}
          </button>
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setAuthMode(login ? "register" : "login");
            }}
          >
            {login ? t("auth.noAccount") : t("auth.hasAccount")}
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
}

function fieldOf(fields: BriefField[], key: BriefField["key"]) {
  return fields.find((item) => item.key === key);
}

function BriefForm() {
  const { t } = useI18n();
  const { inquiryTitle, clientId, clientName, clientEmail, clientAvatar, profile, setInquiryOpen } = useStudio();
  const offers = useMemo(() => parseOffers(profile?.offersJson), [profile?.offersJson]);
  const [pkgId, setPkgId] = useState(offers.packages[0]?.id || "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [offer, setOffer] = useState("");
  const [offerCurrency, setOfferCurrency] = useState<Currency>("USD");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const selected = offers.packages.find((item) => item.id === pkgId) || offers.packages[0];

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function shown(key: BriefField["key"]) {
    const field = fieldOf(offers.fields, key);
    if (!field || !field.enabled) return null;
    if ((key === "email" || key === "telegram") && clientId) return null;
    return field;
  }

  const missing = (() => {
    if (offers.packages.length > 0 && !selected) return true;
    if (!offer.trim() || Number(offer) <= 0) return true;
    for (const field of offers.fields) {
      if (!field.enabled || !field.required) continue;
      if ((field.key === "email" || field.key === "telegram") && clientId) continue;
      if (field.kind === "styles") {
        if (styles.length === 0) return true;
        continue;
      }
      if (field.kind === "chips") {
        if (!String(values[field.key] || "").trim()) return true;
        continue;
      }
      if (field.key === "file") {
        if (!file) return true;
        continue;
      }
      if (!String(values[field.key] || "").trim()) return true;
    }
    const email = shown("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || "")) return true;
    return false;
  })();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    setError("");
    let fileUrl = "";
    if (file) {
      const uploaded = await api.briefAttachment(file);
      if (!uploaded.ok) {
        setSending(false);
        setError("Fayl yüklənmədi. PNG, JPG, SVG və ya PDF seç.");
        return;
      }
      const data = await uploaded.json();
      fileUrl = String(data.url || "");
    }
    const lines = [
      selected ? `Paket: ${selected.title} — ${money(selected.price, selected.currency)}` : "",
      values.telegram ? `Telegram / WhatsApp: ${values.telegram}` : "",
      values.brandName ? `Marka: ${values.brandName}` : "",
      values.tagline ? `Sloqan: ${values.tagline}` : "",
      values.industry ? `Sahə: ${values.industry}` : "",
      values.targetAudience ? `Hədəf: ${values.targetAudience}` : "",
      styles.length ? `Stil: ${styles.join(", ")}` : "",
      values.colorPreferences ? `Rəng: ${values.colorPreferences}` : "",
      values.references ? `Referans: ${values.references}` : "",
      fileUrl ? `Fayl: ${fileUrl}` : "",
      values.notes ? `Qeyd: ${values.notes}` : "",
      ...offers.fields
        .filter((field) => field.custom && field.enabled && values[field.key])
        .map((field) => `${field.label}: ${values[field.key]}`),
      `Müştəri təklifi: ${money(Number(offer), offerCurrency)}`,
    ].filter(Boolean);
    const email = clientId ? clientEmail : values.email || "";
    const name = clientId ? clientName : values.brandName || email;
    const res = await api.inquiry({
      clientId: clientId || "",
      clientName: name,
      clientEmail: email,
      selectedProjectTitle: inquiryTitle,
      budget: money(Number(offer), offerCurrency),
      message: lines.join("\n"),
    });
    setSending(false);
    if (!res.ok) {
      setError(t("brief.sendFail"));
      return;
    }
    setInquiryOpen(false);
  }

  function onPickFile(next: File | null) {
    if (!next) return;
    const ok = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"].includes(next.type) || /\.(png|jpe?g|svg|pdf)$/i.test(next.name);
    if (!ok) {
      setError("Yalnız PNG, JPG, SVG və PDF.");
      return;
    }
    setError("");
    setFile(next);
  }

  const email = shown("email");
  const telegram = shown("telegram");
  const brand = shown("brandName");
  const tagline = shown("tagline");
  const industry = shown("industry");
  const audience = shown("targetAudience");
  const style = shown("styleTags");
  const colors = shown("colorPreferences");
  const references = shown("references");
  const attachment = shown("file");
  const notes = shown("notes");
  const extra = offers.fields.filter((field) => field.custom && field.enabled);

  function chipList(key: string) {
    return (values[key] || "").split(",").map((item) => item.trim()).filter(Boolean);
  }

  function toggleChip(key: string, tag: string) {
    const current = chipList(key);
    const next = current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag];
    setValue(key, next.join(", "));
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-black/5 px-6 pb-5 pt-7 sm:px-8">
        <h3 className="font-hero text-4xl text-bone">Brief</h3>
        <p className="mt-1 font-sans text-xs uppercase tracking-[0.14em] text-mist">{inquiryTitle}</p>
        {clientId ? (
          <div className="who mt-4">
            <ClientFace name={clientName} src={clientAvatar} size={42} />
            <div>
              <b>{clientName}</b>
              <span>{clientId}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div data-lenis-prevent className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
      {offers.packages.length ? (
        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">{t("brief.package")}</h4>
          <select value={selected?.id || ""} onChange={(e) => setPkgId(e.target.value)} className={pillClass}>
            {offers.packages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {money(item.price, item.currency)}
              </option>
            ))}
          </select>
          {selected ? <p className="text-sm text-mist">{t("brief.studioOffer")}: {money(selected.price, selected.currency)}. {t("brief.writeBudget")}</p> : null}
        </section>
      ) : null}

      {email || telegram ? (
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">{t("brief.contact")}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {email ? (
              <label className="block text-sm">
                <span className="mb-1.5 block text-mist">{email.label}</span>
                <input type="email" required={email.required} value={values.email || ""} onChange={(e) => setValue("email", e.target.value)} placeholder={email.placeholder} className={pillClass} />
              </label>
            ) : null}
            {telegram ? (
              <label className="block text-sm">
                <span className="mb-1.5 block text-mist">{telegram.label}</span>
                <input value={values.telegram || ""} onChange={(e) => setValue("telegram", e.target.value)} placeholder={telegram.placeholder} className={pillClass} />
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {brand || tagline || industry ? (
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Marka</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {brand ? (
              <label className="block text-sm">
                <span className="mb-1.5 block text-mist">{brand.label}</span>
                <input required={brand.required} value={values.brandName || ""} onChange={(e) => setValue("brandName", e.target.value)} placeholder={brand.placeholder} className={pillClass} />
              </label>
            ) : null}
            {tagline ? (
              <label className="block text-sm">
                <span className="mb-1.5 block text-mist">{tagline.label}</span>
                <input value={values.tagline || ""} onChange={(e) => setValue("tagline", e.target.value)} placeholder={tagline.placeholder} className={pillClass} />
              </label>
            ) : null}
            {industry ? (
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-mist">{industry.label}</span>
                <input value={values.industry || ""} onChange={(e) => setValue("industry", e.target.value)} placeholder={industry.placeholder} className={pillClass} />
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {audience || style || colors ? (
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Hədəf və stil</h4>
          {audience ? (
            <label className="block text-sm">
              <span className="mb-1.5 block text-mist">{audience.label}</span>
              <textarea rows={2} value={values.targetAudience || ""} onChange={(e) => setValue("targetAudience", e.target.value)} placeholder={audience.placeholder} className={areaClass} />
            </label>
          ) : null}
          {style ? (
            <div>
              <span className="mb-2 block text-sm text-mist">{style.label}</span>
              <div className="flex flex-wrap gap-2">
                {offers.styleTags.map((tag) => {
                  const on = styles.includes(tag);
                  return (
                    <button key={tag} type="button" onClick={() => setStyles((prev) => (on ? prev.filter((item) => item !== tag) : [...prev, tag]))} className={`rounded-full px-3.5 py-2 text-sm ${on ? "bg-[#1c1c1c] text-[#f6f1e7]" : "border border-black/15 text-mist"}`}>
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {colors ? (
            <label className="block text-sm">
              <span className="mb-1.5 block text-mist">{colors.label}</span>
              <input value={values.colorPreferences || ""} onChange={(e) => setValue("colorPreferences", e.target.value)} placeholder={colors.placeholder} className={pillClass} />
            </label>
          ) : null}
        </section>
      ) : null}

      {references || attachment || notes ? (
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Referans və qeyd</h4>
          {references ? (
            <label className="block text-sm">
              <span className="mb-1.5 block text-mist">{references.label}</span>
              <textarea rows={2} value={values.references || ""} onChange={(e) => setValue("references", e.target.value)} placeholder={references.placeholder} className={areaClass} />
            </label>
          ) : null}
          {attachment ? (
            <label className="block cursor-pointer rounded-2xl border border-dashed border-black/20 bg-[#1c1c1c] px-4 py-5 text-center text-sm text-[#f6f1e7]/75" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onPickFile(e.dataTransfer.files?.[0] || null); }}>
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-[#f6f1e7]/50">{attachment.label}</span>
              {file ? file.name : attachment.placeholder}
              <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf,image/png,image/jpeg,image/svg+xml,application/pdf" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
            </label>
          ) : null}
          {notes ? (
            <label className="block text-sm">
              <span className="mb-1.5 block text-mist">{notes.label}</span>
              <textarea rows={2} value={values.notes || ""} onChange={(e) => setValue("notes", e.target.value)} placeholder={notes.placeholder} className={areaClass} />
            </label>
          ) : null}
        </section>
      ) : null}

      {extra.length ? (
        <section className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Əlavə suallar</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {extra.map((field) => (
              <label key={field.key} className={`block text-sm ${field.kind === "long" || field.kind === "chips" ? "sm:col-span-2" : ""}`}>
                <span className="mb-1.5 block text-mist">{field.label}</span>
                {field.kind === "long" ? (
                  <textarea rows={3} value={values[field.key] || ""} onChange={(e) => setValue(field.key, e.target.value)} placeholder={field.placeholder} className={areaClass} />
                ) : field.kind === "chips" ? (
                  <span className="flex flex-wrap gap-2">
                    {(field.options || []).map((option) => {
                      const on = chipList(field.key).includes(option);
                      return (
                        <button key={option} type="button" onClick={() => toggleChip(field.key, option)} className={`rounded-full px-3.5 py-2 text-sm ${on ? "bg-[#1c1c1c] text-[#f6f1e7]" : "border border-black/15 text-mist"}`}>
                          {option}
                        </button>
                      );
                    })}
                  </span>
                ) : (
                  <input value={values[field.key] || ""} onChange={(e) => setValue(field.key, e.target.value)} placeholder={field.placeholder} className={pillClass} />
                )}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
      <div className="flex flex-col gap-3 border-t border-black/5 px-6 py-4 sm:flex-row sm:px-8">
        <div className={`${pillClass} flex items-center gap-2`}>
          <span className="text-void/70">{offerCurrency === "AZN" ? "₼" : "$"}</span>
          <input
            value={offer}
            onChange={(e) => setOffer(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder={t("brief.budget")}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
          <button type="button" onClick={() => setOfferCurrency("USD")} className={`text-xs ${offerCurrency === "USD" ? "font-semibold" : "opacity-45"}`}>
            USD
          </button>
          <button type="button" onClick={() => setOfferCurrency("AZN")} className={`text-xs ${offerCurrency === "AZN" ? "font-semibold" : "opacity-45"}`}>
            AZN
          </button>
        </div>
        <button type="submit" disabled={missing || sending} className={`${submitClass} disabled:opacity-40`}>
          {sending ? "..." : "Send"}
        </button>
      </div>
    </form>
  );
}

export function Modals() {
  const { inquiryOpen, setInquiryOpen } = useStudio();

  return (
    <>
      <ClientAuth />
      <Modal wide open={inquiryOpen} onClose={() => setInquiryOpen(false)}>
        <BriefForm />
      </Modal>
    </>
  );
}

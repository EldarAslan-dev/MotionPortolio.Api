"use client";

import { useState } from "react";
import { AdminCard, adminBtn, adminBtnQuiet, adminFieldClass } from "@/components/admin/ui";
import { useI18n } from "@/lib/i18n";
import { parseOffers, type Currency, type OffersConfig } from "@/lib/site/offers";
import type { StudioProfile } from "@/lib/types";

export function OffersSection({
  profile,
  onSave,
  onToast,
}: {
  profile: StudioProfile;
  onSave: (patch: Partial<StudioProfile>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [config, setConfig] = useState<OffersConfig>(() => parseOffers(profile.offersJson));
  const [tag, setTag] = useState("");
  const [question, setQuestion] = useState({ label: "", placeholder: "", kind: "text" as "text" | "long" | "chips", required: false, options: "" });
  const [saving, setSaving] = useState(false);

  function patch(next: OffersConfig) {
    setConfig(next);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({ offersJson: JSON.stringify(config) });
      onToast("Təkliflər yadda saxlandı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard title={t("sec.offers")} hint={t("sec.offersHint")}>
      <div className="space-y-3">
        {config.packages.map((item, index) => (
          <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_110px_90px_auto]">
            <input
              value={item.title}
              onChange={(e) => {
                const packages = config.packages.slice();
                packages[index] = { ...item, title: e.target.value };
                patch({ ...config, packages });
              }}
              placeholder="İşin adı"
              className={adminFieldClass}
            />
            <input
              value={item.price}
              onChange={(e) => {
                const packages = config.packages.slice();
                packages[index] = { ...item, price: Number(e.target.value) || 0 };
                patch({ ...config, packages });
              }}
              inputMode="decimal"
              className={adminFieldClass}
            />
            <select
              value={item.currency}
              onChange={(e) => {
                const packages = config.packages.slice();
                packages[index] = { ...item, currency: e.target.value as Currency };
                patch({ ...config, packages });
              }}
              className={adminFieldClass}
            >
              <option value="USD">USD</option>
              <option value="AZN">AZN</option>
            </select>
            <button
              type="button"
              className={adminBtnQuiet}
              onClick={() => patch({ ...config, packages: config.packages.filter((pkg) => pkg.id !== item.id) })}
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminBtnQuiet}
          onClick={() =>
            patch({
              ...config,
              packages: [...config.packages, { id: crypto.randomUUID(), title: "Yeni iş", price: 0, currency: "USD" }],
            })
          }
        >
          Paket əlavə et
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {config.fields.map((field, index) => (
          <div key={field.key} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={field.label}
              onChange={(e) => {
                const fields = config.fields.slice();
                fields[index] = { ...field, label: e.target.value };
                patch({ ...config, fields });
              }}
              className={adminFieldClass}
            />
            <input
              value={field.placeholder}
              onChange={(e) => {
                const fields = config.fields.slice();
                fields[index] = { ...field, placeholder: e.target.value };
                patch({ ...config, fields });
              }}
              placeholder="Placeholder"
              className={adminFieldClass}
            />
            <label className="flex items-center gap-1 text-xs text-mist">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => {
                  const fields = config.fields.slice();
                  fields[index] = { ...field, required: e.target.checked };
                  patch({ ...config, fields });
                }}
              />
              Vacib
            </label>
            <label className="flex items-center gap-1 text-xs text-mist">
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={(e) => {
                  const fields = config.fields.slice();
                  fields[index] = { ...field, enabled: e.target.checked };
                  patch({ ...config, fields });
                }}
              />
              Görünür
            </label>
            {field.custom ? (
              <button
                type="button"
                className={adminBtnQuiet}
                onClick={() => patch({ ...config, fields: config.fields.filter((item) => item.key !== field.key) })}
              >
                Sil
              </button>
            ) : null}
            {field.custom && field.kind === "chips" ? (
              <input
                value={(field.options || []).join(", ")}
                onChange={(e) => {
                  const fields = config.fields.slice();
                  fields[index] = {
                    ...field,
                    options: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  };
                  patch({ ...config, fields });
                }}
                placeholder="Seçimlər, vergüllə"
                className={`${adminFieldClass} sm:col-span-4`}
              />
            ) : null}
          </div>
        ))}
        <div className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <input
            value={question.label}
            onChange={(e) => setQuestion({ ...question, label: e.target.value })}
            placeholder="Yeni sual"
            className={adminFieldClass}
          />
          <input
            value={question.placeholder}
            onChange={(e) => setQuestion({ ...question, placeholder: e.target.value })}
            placeholder="Nümunə mətn"
            className={adminFieldClass}
          />
          <select
            value={question.kind}
            onChange={(e) => setQuestion({ ...question, kind: e.target.value as "text" | "long" | "chips" })}
            className={adminFieldClass}
          >
            <option value="text">Qısa cavab</option>
            <option value="long">Uzun cavab</option>
            <option value="chips">Seçimlər</option>
          </select>
          <button
            type="button"
            className={adminBtnQuiet}
            onClick={() => {
              const label = question.label.trim();
              if (!label) return;
              patch({
                ...config,
                fields: [
                  ...config.fields,
                  {
                    key: crypto.randomUUID(),
                    label,
                    placeholder: question.placeholder.trim(),
                    required: question.required,
                    enabled: true,
                    kind: question.kind,
                    custom: true,
                    options: question.options.split(",").map((item) => item.trim()).filter(Boolean),
                  },
                ],
              });
              setQuestion({ label: "", placeholder: "", kind: "text", required: false, options: "" });
            }}
          >
            Sual əlavə et
          </button>
          {question.kind === "chips" ? (
            <input
              value={question.options}
              onChange={(e) => setQuestion({ ...question, options: e.target.value })}
              placeholder="Seçimlər, vergüllə"
              className={`${adminFieldClass} sm:col-span-3`}
            />
          ) : null}
          <label className="flex items-center gap-1 text-xs text-mist">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => setQuestion({ ...question, required: e.target.checked })}
            />
            Vacib
          </label>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap gap-2">
          {config.styleTags.map((item) => (
            <button
              key={item}
              type="button"
              className={adminBtnQuiet}
              onClick={() => patch({ ...config, styleTags: config.styleTags.filter((tagName) => tagName !== item) })}
            >
              {item} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Yeni stil" className={adminFieldClass} />
          <button
            type="button"
            className={adminBtnQuiet}
            onClick={() => {
              const next = tag.trim();
              if (!next || config.styleTags.includes(next)) return;
              patch({ ...config, styleTags: [...config.styleTags, next] });
              setTag("");
            }}
          >
            Əlavə et
          </button>
        </div>
      </div>

      <button type="button" disabled={saving} className={`${adminBtn} mt-5`} onClick={save}>
        {saving ? "Saxlanır…" : "Təklifləri yadda saxla"}
      </button>
    </AdminCard>
  );
}

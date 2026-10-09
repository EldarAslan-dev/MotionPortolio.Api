"use client";

import { useI18n } from "@/lib/i18n";
import { useStudio } from "@/lib/site/StudioContext";

export function Footer() {
  const { t } = useI18n();
  const { ready, name } = useStudio();
  const label = (ready ? name : "Bilgeyis Mirzazada").trim();

  return (
    <footer className="relative z-[1] border-t border-[var(--bd)] py-6 text-xs text-[rgb(var(--mist))]">
      <div className="pub-wrap flex flex-wrap items-center justify-between gap-3">
        <span>{label.toUpperCase()} © {new Date().getFullYear()}. {t("footer.motion")}</span>
        <span>
          {t("footer.baku")} · <a href="#hero">{t("footer.top")}</a>
        </span>
      </div>
    </footer>
  );
}

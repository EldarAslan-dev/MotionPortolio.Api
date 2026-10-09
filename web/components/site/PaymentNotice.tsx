"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useStudio } from "@/lib/site/StudioContext";

function inboxUrl(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (domain === "gmail.com" || domain === "googlemail.com") return "https://mail.google.com/mail/u/0/#inbox";
  if (domain === "hotmail.com" || domain === "outlook.com" || domain === "live.com" || domain.endsWith(".outlook.com"))
    return "https://outlook.live.com/mail/0/inbox";
  if (domain === "yahoo.com" || domain.endsWith(".yahoo.com")) return "https://mail.yahoo.com";
  if (domain === "icloud.com" || domain === "me.com" || domain === "mac.com") return "https://www.icloud.com/mail";
  return domain ? `https://${domain}` : "https://mail.google.com";
}

export function PaymentNotice() {
  const { t } = useI18n();
  const { clientId, clientEmail } = useStudio();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setOpen(false);
      return;
    }
    let cancelled = false;
    api
      .myOrders(clientId)
      .then((list) => {
        if (cancelled) return;
        setOpen(list.some((order) => order.status === "Ödəniş gözlənilir" && !order.receiptUploaded));
      })
      .catch(() => {
        if (!cancelled) setOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface px-7 py-8 text-bone shadow-2xl">
        <h2 className="font-hero text-3xl">{t("pay.title")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">{t("pay.body")}</p>
        <a
          href={inboxUrl(clientEmail)}
          target="_blank"
          rel="noreferrer"
          className="gold-btn mt-6 inline-flex"
        >
          {t("pay.now")}
        </a>
      </div>
    </div>
  );
}

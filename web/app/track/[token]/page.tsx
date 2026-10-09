"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { TrackOrder } from "@/lib/types";

const STEPS = ["Yeni", "İcrada", "Ödəniş gözlənilir", "Tamamlandı"] as const;

export default function TrackPage() {
  const { t } = useI18n();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    try {
      setOrder(await api.trackOrder(token));
      setMissing(false);
    } catch {
      setMissing(true);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const res = await api.uploadReceipt(token, file);
    if (res.ok) {
      await load();
      setBusy(false);
      return;
    }
    const data = await res.json().catch(() => null);
    setError(data?.message || t("track.uploadFail"));
    setBusy(false);
  }

  const idx = order ? STEPS.findIndex((step) => step === order.status) : -1;
  const stepLabel = [t("track.received"), t("track.progress"), t("track.payment"), t("track.delivery")];

  return (
    <main className="min-h-screen bg-[#0e0c09] px-4 py-8 text-[#f1ead8]" style={{ fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="mx-auto max-w-[560px]">
        {missing ? (
          <section className="rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6">
            <h1 className="text-xl">{t("track.missing")}</h1>
            <p className="mt-2 text-sm text-[#9a9078]">{t("track.missingBody")}</p>
          </section>
        ) : !order ? (
          <section className="rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6">{t("track.loading")}</section>
        ) : (
          <>
            <section className="mb-3.5 rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6">
              <h1 className="text-xl">{t("track.order")} #{order.order_id}</h1>
              <p className="mt-1 text-sm text-[#9a9078]">
                {order.package_name} · {order.client_name}
              </p>
              {order.status === "Ləğv edildi" ? (
                <p className="mt-4 text-sm text-[#9a9078]">{t("track.cancelled")}</p>
              ) : (
                <ol className="mt-4 flex gap-1.5">
                  {STEPS.map((step, i) => (
                    <li key={step} className={`flex-1 border-t-[3px] pt-1.5 text-xs ${i <= idx ? "border-[#e8c46a] text-[#f1ead8]" : "border-[#2a2418] text-[#9a9078]"}`}>
                      {stepLabel[i]}
                    </li>
                  ))}
                </ol>
              )}
            </section>
            {order.status === "Ödəniş gözlənilir" && order.payment ? (
              <section className="mb-3.5 rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6">
                <h2 className="mb-2 text-[15px]">{t("track.payInfo")}</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-[#2a2418]">
                      <td className="py-2">{t("track.amount")}</td>
                      <td className="py-2 text-right font-semibold">{order.amount}</td>
                    </tr>
                    {[
                      ["m10", order.payment.m10],
                      [`${t("track.card")} (${order.payment.bank})`, order.payment.card],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-[#2a2418]">
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-right font-semibold">
                          {value}
                          <button
                            type="button"
                            className="ml-2 text-xs text-[#e8c46a]"
                            onClick={() => {
                              void navigator.clipboard?.writeText(value);
                              setCopied(value);
                            }}
                          >
                            {copied === value ? t("track.copied") : t("track.copy")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
            {order.status === "Ödəniş gözlənilir" && order.receipt_uploaded ? (
              <section className="mb-3.5 rounded-[14px] border border-[#e8c46a] bg-[#16130e] p-6">
                <b>{t("track.receivedPay")}</b>
                <p className="mt-1.5 text-sm text-[#9a9078]">{t("track.receivedPayBody")}</p>
              </section>
            ) : null}
            {order.status === "Ödəniş gözlənilir" ? (
              <form
                className="mb-3.5 rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const file = new FormData(e.currentTarget).get("receipt");
                  if (file instanceof File && file.size > 0) void upload(file);
                }}
              >
                <h2 className="mb-2 text-[15px]">{order.receipt_uploaded ? t("track.replace") : t("track.upload")}</h2>
                <input name="receipt" type="file" accept="image/*,application/pdf" required aria-label={t("track.receiptFile")} className="w-full rounded-[10px] border border-dashed border-[#2a2418] p-3 text-sm" />
                <button type="submit" disabled={busy} className="mt-3 w-full rounded-[10px] bg-[#e8c46a] px-3 py-3 font-semibold text-[#1a1405] disabled:opacity-50">
                  {busy ? t("track.uploading") : t("track.send")}
                </button>
                {error ? <p className="mt-2 text-sm text-[#e57373]">{error}</p> : null}
                <p className="mt-2 text-sm text-[#9a9078]">{t("track.types")}</p>
              </form>
            ) : null}
            {order.status === "Tamamlandı" && order.download_url ? (
              <section className="mb-3.5 rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6">
                <h2 className="text-[15px]">{t("track.ready")}</h2>
                <a href={order.download_url} className="mt-3 block rounded-[10px] bg-[#e8c46a] px-3 py-3 text-center font-semibold text-[#1a1405]">
                  {t("track.download")}
                </a>
              </section>
            ) : null}
            {order.status === "Yeni" || order.status === "İcrada" ? (
              <section className="rounded-[14px] border border-[#2a2418] bg-[#16130e] p-6 text-sm text-[#9a9078]">
                {t("track.working")}
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

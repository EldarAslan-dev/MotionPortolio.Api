"use client";

import { api } from "@/lib/api";
import type { Testimonial } from "@/lib/types";

export function TestimonialsSection({
  testimonials,
  token,
  onChanged,
  onToast,
}: {
  testimonials: Testimonial[];
  token: string;
  onChanged: () => void;
  onToast: (msg: string) => void;
}) {
  async function publish(t: Testimonial) {
    const res = await api.createTestimonial(
      { clientName: t.clientName, company: t.company, comment: t.comment, rating: t.rating },
      token,
    );
    if (res.ok) onToast("🌟 Rəy uğurla vitrinə paylaşıldı!");
  }

  async function remove(id: number) {
    if (!confirm("Bu rəyi silmək istəyirsiniz?")) return;
    const res = await api.deleteTestimonial(id, token);
    if (res.ok) onChanged();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-white">💬 Müştəri Rəyləri İdarəsi</h2>

      {testimonials.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">Hələ gələn rəy yoxdur.</p>
      ) : (
        <>
          {/* Mobile / tablet: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 text-white"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold">{t.clientName}</span>
                  <span className="shrink-0 text-sm">⭐ {t.rating}</span>
                </div>
                {t.company ? (
                  <div className="mb-1.5 text-xs text-neutral-400">{t.company}</div>
                ) : null}
                <p className="mb-3 text-sm text-neutral-300">{t.comment}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => publish(t)}
                    className="flex-1 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Vitrinə Paylaş
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="border-b border-white/10 px-3 py-2">Müştəri</th>
                  <th className="border-b border-white/10 px-3 py-2">Şirkət</th>
                  <th className="border-b border-white/10 px-3 py-2">Ulduz</th>
                  <th className="border-b border-white/10 px-3 py-2">Rəy</th>
                  <th className="border-b border-white/10 px-3 py-2">Vitrinə Paylaş</th>
                  <th className="border-b border-white/10 px-3 py-2">Sil</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 text-white">
                    <td className="px-3 py-3 font-semibold">{t.clientName}</td>
                    <td className="px-3 py-3 text-neutral-400">{t.company || "-"}</td>
                    <td className="px-3 py-3">⭐ {t.rating}</td>
                    <td className="max-w-xs px-3 py-3 text-neutral-300">{t.comment}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => publish(t)}
                        className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black"
                      >
                        Paylaş
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

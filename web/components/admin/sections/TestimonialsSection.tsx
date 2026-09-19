"use client";

import { AdminCard, adminBtnGhost, adminBtnQuiet } from "@/components/admin/ui";
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
    if (res.ok) onToast("Rəy vitrinə paylaşıldı.");
  }

  async function remove(id: number) {
    if (!confirm("Bu rəyi silmək istəyirsiniz?")) return;
    const res = await api.deleteTestimonial(id, token);
    if (res.ok) onChanged();
  }

  return (
    <AdminCard title="Rəylər" hint="Müştəri rəylərini vitrinə çıxar və ya sil.">
      {testimonials.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist">Hələ gələn rəy yoxdur.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-line bg-void p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-bone">{t.clientName}</span>
                  <span className="shrink-0 text-xs text-mist">{t.rating} / 5</span>
                </div>
                {t.company ? <div className="mb-1.5 text-xs text-mist">{t.company}</div> : null}
                <p className="mb-3 text-sm leading-relaxed text-mist">{t.comment}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => publish(t)} className={`${adminBtnGhost} flex-1`}>
                    Vitrinə paylaş
                  </button>
                  <button type="button" onClick={() => remove(t.id)} className={adminBtnQuiet}>
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-mist">
                  <th className="border-b border-line px-3 py-2">Müştəri</th>
                  <th className="border-b border-line px-3 py-2">Şirkət</th>
                  <th className="border-b border-line px-3 py-2">Ulduz</th>
                  <th className="border-b border-line px-3 py-2">Rəy</th>
                  <th className="border-b border-line px-3 py-2">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id} className="border-b border-line text-bone">
                    <td className="px-3 py-3 font-semibold">{t.clientName}</td>
                    <td className="px-3 py-3 text-mist">{t.company || "—"}</td>
                    <td className="px-3 py-3 text-mist">{t.rating} / 5</td>
                    <td className="max-w-xs px-3 py-3 text-mist">{t.comment}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => publish(t)} className={adminBtnGhost}>
                          Paylaş
                        </button>
                        <button type="button" onClick={() => remove(t.id)} className={adminBtnQuiet}>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminCard>
  );
}

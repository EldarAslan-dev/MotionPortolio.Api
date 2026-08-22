import type { Toast } from "@/hooks/useToasts";

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

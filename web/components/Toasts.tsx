import type { Toast } from "@/hooks/useToasts";

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-auto z-[200] flex max-w-sm flex-col gap-2 sm:left-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-bone shadow-2xl"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

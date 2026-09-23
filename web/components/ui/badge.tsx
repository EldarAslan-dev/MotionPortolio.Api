import type { ReactNode } from "react";

const VARIANTS = {
  neutral: "border-line bg-bone/5 text-mist",
  new: "border-cue/40 bg-cue/12 text-cue",
  progress: "border-line bg-bone/10 text-bone",
  done: "border-transparent bg-bone text-void",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Maps the inquiry's free-text status (Azerbaijani, admin-selectable) to a Badge tone. */
export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "Yeni") return "new";
  if (status === "Tamamlandı") return "done";
  return "progress";
}

"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  children,
  align = "end",
}: {
  children: ReactNode;
  align?: "start" | "end" | "center";
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content align={align} sideOffset={6} asChild>
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="z-[200] min-w-[180px] rounded-xl border border-line bg-surface p-1.5 text-sm text-bone shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          {children}
        </motion.div>
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  destructive,
}: {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium outline-none transition data-[highlighted]:bg-bone/8 ${
        destructive ? "text-mist data-[highlighted]:text-bone" : "text-bone"
      } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownPrimitive.Label className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist">
      {children}
    </DropdownPrimitive.Label>
  );
}

export function DropdownMenuSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-line" />;
}

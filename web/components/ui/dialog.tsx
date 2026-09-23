"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

/**
 * Shared glass/blur modal shell used by the Order window, registration
 * gate, and any other blocking dialog on the public site. Radix owns
 * focus-trap/escape/outside-click semantics; Framer Motion owns the
 * spring entry/exit. Visual layer only — callers keep their own state
 * (`open`/`onClose`) and form handlers untouched.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Rendered as the Radix-required accessible dialog title (visually hidden if you already show your own heading in `children`). */
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[80] bg-void/70 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => {
                // Let the first field take focus naturally instead of the dialog root.
                e.preventDefault();
              }}
            >
              <motion.div
                className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={SPRING}
                  className="w-full max-w-md rounded-2xl border border-bone/10 bg-surface/85 p-6 text-bone shadow-2xl shadow-black/50 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                  {children}
                </motion.div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

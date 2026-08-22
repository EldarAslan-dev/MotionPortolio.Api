"use client";

import { useCallback, useRef, useState } from "react";

export type Toast = { id: number; message: string };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return { toasts, push };
}

export function playNotificationSound() {
  try {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {
    /* audio not available */
  }
}

"use client";

import { createContext, useContext } from "react";
import type { StudioData } from "@/lib/site/useStudioData";
import type { InquiryFlow } from "@/lib/site/useInquiryFlow";

export type StudioContextValue = StudioData & InquiryFlow;

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error("useStudio() must be used within the (site) layout's StudioContext.Provider");
  }
  return ctx;
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Testimonial } from "@/lib/types";

/**
 * Owns client registration + inquiry ("Sifariş") + review submission state
 * and handlers. Lifted out of the old monolithic StudioSite verbatim (same
 * localStorage keys, same API calls) so the registration/inquiry modal
 * stack can live once in the (site) layout and be shared by every public
 * page (homepage + project detail pages).
 */
export function useInquiryFlow({
  setTestimonials: _setTestimonials,
}: {
  setTestimonials: (list: Testimonial[]) => void;
}) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState("General collaboration");
  const [pkg, setPkg] = useState("300");
  const [budget, setBudget] = useState("$300");
  const [inquiryMsg, setInquiryMsg] = useState("");

  useEffect(() => {
    setClientId(localStorage.getItem("clientId"));
    setClientName(localStorage.getItem("clientName") || "");
    setClientEmail(localStorage.getItem("clientEmail") || "");
  }, []);

  function needClient(): boolean {
    if (clientId) return true;
    setRegisterOpen(true);
    return false;
  }

  function openInquiry(title: string) {
    if (!needClient()) return;
    setInquiryTitle(title);
    setPkg("300");
    setBudget("$300");
    setInquiryOpen(true);
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api.register(
      String(form.get("name") || ""),
      String(form.get("email") || ""),
    );
    if (!res.ok) return;
    const data = await res.json();
    setClientId(data.clientId);
    setClientName(data.clientName);
    setClientEmail(data.clientEmail);
    localStorage.setItem("clientId", data.clientId);
    localStorage.setItem("clientName", data.clientName);
    localStorage.setItem("clientEmail", data.clientEmail);
    setRegisterOpen(false);
  }

  async function onInquiry(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    const res = await api.inquiry({
      clientId,
      clientName,
      clientEmail,
      selectedProjectTitle: inquiryTitle,
      budget,
      message: inquiryMsg,
    });
    if (res.ok) {
      setInquiryOpen(false);
      setInquiryMsg("");
    }
  }

  async function onReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReviewOpen(false);
  }

  return {
    clientId,
    clientName,
    clientEmail,
    registerOpen,
    setRegisterOpen,
    inquiryOpen,
    setInquiryOpen,
    reviewOpen,
    setReviewOpen,
    inquiryTitle,
    pkg,
    setPkg,
    budget,
    setBudget,
    inquiryMsg,
    setInquiryMsg,
    needClient,
    openInquiry,
    onRegister,
    onInquiry,
    onReview,
  };
}

export type InquiryFlow = ReturnType<typeof useInquiryFlow>;

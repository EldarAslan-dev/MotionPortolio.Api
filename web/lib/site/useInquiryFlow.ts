"use client";

import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAvatar, setClientAvatar] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState("General collaboration");

  const [rememberedEmail, setRememberedEmail] = useState("");

  useEffect(() => {
    setClientId(localStorage.getItem("clientId"));
    setClientName(localStorage.getItem("clientName") || "");
    setClientEmail(localStorage.getItem("clientEmail") || "");
    setClientAvatar(localStorage.getItem("clientAvatar") || "");
    setRememberedEmail(localStorage.getItem("bm-known-email") || "");
  }, []);

  function remember(data: { clientId: string; clientName: string; clientEmail: string; avatarUrl?: string }) {
    const avatar = data.avatarUrl || "";
    setClientId(data.clientId);
    setClientName(data.clientName || "");
    setClientEmail(data.clientEmail || "");
    setClientAvatar(avatar);
    localStorage.setItem("clientId", data.clientId);
    localStorage.setItem("clientName", data.clientName || "");
    localStorage.setItem("clientEmail", data.clientEmail || "");
    localStorage.setItem("clientAvatar", avatar);
    if (data.clientEmail) {
      localStorage.setItem("bm-known-email", data.clientEmail);
      setRememberedEmail(data.clientEmail);
    }
    setAuthError("");
    setRegisterOpen(false);
  }

  function applyProfile(data: { clientName?: string; clientEmail?: string; avatarUrl?: string }) {
    if (data.clientName != null) {
      setClientName(data.clientName);
      localStorage.setItem("clientName", data.clientName);
    }
    if (data.clientEmail != null) {
      setClientEmail(data.clientEmail);
      localStorage.setItem("clientEmail", data.clientEmail);
    }
    if (data.avatarUrl != null) {
      setClientAvatar(data.avatarUrl);
      localStorage.setItem("clientAvatar", data.avatarUrl);
    }
  }

  function openAuth(mode: "login" | "register") {
    setAuthError("");
    setAuthMode(mode);
    setRegisterOpen(true);
  }

  function needClient(): boolean {
    if (clientId) return true;
    openAuth("register");
    return false;
  }

  function openInquiry(title: string) {
    setInquiryTitle(title);
    setInquiryOpen(true);
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api.register(
      String(form.get("name") || ""),
      String(form.get("email") || ""),
    );
    if (!res.ok) {
      setAuthError(t("auth.failRegister"));
      return;
    }
    remember(await res.json());
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api.clientLogin(String(form.get("email") || ""), String(form.get("password") || ""));
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setAuthError(data?.passwordRequired ? t("auth.badPassword") : t("auth.failLogin"));
      return;
    }
    remember(await res.json());
  }

  function logout() {
    localStorage.removeItem("clientId");
    localStorage.removeItem("clientName");
    localStorage.removeItem("clientEmail");
    localStorage.removeItem("clientAvatar");
    setClientId(null);
    setClientName("");
    setClientEmail("");
    setClientAvatar("");
    setProfileOpen(false);
  }

  async function onReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReviewOpen(false);
  }

  return {
    clientId,
    clientName,
    clientEmail,
    clientAvatar,
    rememberedEmail,
    applyProfile,
    profileOpen,
    setProfileOpen,
    registerOpen,
    setRegisterOpen,
    authMode,
    setAuthMode,
    authError,
    openAuth,
    onLogin,
    logout,
    inquiryOpen,
    setInquiryOpen,
    reviewOpen,
    setReviewOpen,
    inquiryTitle,
    needClient,
    openInquiry,
    onRegister,
    onReview,
  };
}

export type InquiryFlow = ReturnType<typeof useInquiryFlow>;

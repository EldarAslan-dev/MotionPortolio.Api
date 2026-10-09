"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ClientFace } from "@/components/ClientFace";
import { statusText, useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { mediaUrl, projectCover } from "@/lib/config";
import { useStudio } from "@/lib/site/StudioContext";
import type { MemberGift, MyOrder } from "@/lib/types";

function savedLikeIds() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("bm-like-") && localStorage.getItem(key) === "1")
    .map((key) => Number(key.slice("bm-like-".length)))
    .filter((id) => id > 0);
}

function englishBrief(message: string) {
  const labels: Record<string, string> = {
    Paket: "Package",
    Marka: "Brand",
    Sloqan: "Tagline",
    Sahə: "Industry",
    Hədəf: "Audience",
    Stil: "Style",
    Rəng: "Colors",
    Referans: "References",
    Fayl: "File",
    Qeyd: "Notes",
    "Müştəri təklifi": "Your offer",
  };
  return message
    .split("\n")
    .map((line) => {
      const cut = line.indexOf(": ");
      if (cut < 0) return line;
      const key = line.slice(0, cut);
      return `${labels[key] || key}: ${line.slice(cut + 2)}`;
    })
    .join("\n");
}

export function AccountPanel() {
  const { t, lang } = useI18n();
  const { clientId, clientName, clientEmail, clientAvatar, applyProfile, logout, openAuth, openInquiry, projects } = useStudio();
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [gifts, setGifts] = useState<MemberGift[]>([]);
  const [likeIds, setLikeIds] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(clientName);
    setEmail(clientEmail);
  }, [clientName, clientEmail]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    api.myGifts(clientId).then(setGifts).catch(() => setGifts([]));
    api.myOrders(clientId).then((list) => {
      if (!cancelled) setOrders(list);
    }).catch(() => {
      if (!cancelled) setOrders([]);
    });
    const local = savedLikeIds();
    Promise.all(local.map((id) => api.saveLike(clientId, id).catch(() => null)))
      .then(() => api.clientLikes(clientId))
      .then((ids) => {
        if (!cancelled) setLikeIds(ids);
      })
      .catch(() => {
        if (!cancelled) setLikeIds(local);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <section className="account">
        <h1>{t("account.title")}</h1>
        <p className="profile-empty">{t("account.signInHint")}</p>
        <button type="button" className="gold-btn" onClick={() => openAuth("login")}>
          {t("account.signIn")}
        </button>
      </section>
    );
  }

  const liked = projects.filter((project) => likeIds.includes(project.id));

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    const res = await api.updateClientProfile(clientId!, name.trim(), email.trim());
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setNote(data?.message || t("account.saveFail"));
      return;
    }
    const data = await res.json();
    applyProfile({ clientName: data.clientName, clientEmail: data.clientEmail, avatarUrl: data.avatarUrl });
    setNote(t("account.saved"));
  }

  async function onPhoto(file: File | null) {
    if (!file || !clientId) return;
    setBusy(true);
    setNote("");
    const res = await api.uploadClientAvatar(clientId, file);
    setBusy(false);
    if (!res.ok) {
      setNote(t("account.photoFail"));
      return;
    }
    const data = await res.json();
    applyProfile({ avatarUrl: data.avatarUrl });
    setNote(t("account.photoOk"));
  }

  return (
    <section className="account">
      <div className="account-head">
        <label className="account-photo">
          <ClientFace name={name || clientName} src={clientAvatar} size={84} />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => onPhoto(e.target.files?.[0] || null)}
          />
          <span>{t("account.changePhoto")}</span>
        </label>
        <div>
          <h1>{clientName || t("account.client")}</h1>
          <code>{clientId}</code>
        </div>
        <button type="button" className="ghost-btn" onClick={logout}>
          {t("account.signOut")}
        </button>
      </div>

      <form className="account-form" onSubmit={onSave}>
        <label>
          {t("account.name")}
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          {t("account.email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="gold-btn" disabled={busy}>
          {t("account.save")}
        </button>
        {note ? <p>{note}</p> : null}
      </form>

      <h2>{t("account.createTitle")}</h2>
      <p className="profile-empty">{t("account.createBody")}</p>
      <button type="button" className="gold-btn" onClick={() => openInquiry("General collaboration")}>
        {t("account.create")}
      </button>

      <h2>{t("account.perks")}</h2>
      {gifts.length === 0 ? (
        <p className="profile-empty">{t("account.noPerks")}</p>
      ) : (
        <ul className="profile-orders">
          {gifts.map((gift) => (
            <li key={gift.id}>
              <div>
                <b>{gift.kind === "free" ? t("account.free") : t("account.discount")}</b>
              </div>
              <p>{gift.title}</p>
              {gift.detail ? <small>{gift.detail}</small> : null}
            </li>
          ))}
        </ul>
      )}

      <h2>{t("account.orders")}</h2>
      {orders.length === 0 ? (
        <p className="profile-empty">{t("account.noOrders")}</p>
      ) : (
        <ul className="profile-orders">
          {orders.map((order) => (
            <li key={order.id}>
              <div>
                <b>{order.orderNumber}</b>
                <span>{statusText(order.status, t)}</span>
              </div>
              <p>{order.selectedProjectTitle || t("account.general")}</p>
              <small>
                {order.budget}
                {" · "}
                {new Date(order.createdAt).toLocaleDateString(lang === "az" ? "az" : "en")}
              </small>
              {order.message ? <p>{lang === "en" ? englishBrief(order.message) : order.message}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <h2>{t("account.liked")}</h2>
      {liked.length === 0 ? (
        <p className="profile-empty">{t("account.noLikes")}</p>
      ) : (
        <div className="account-likes">
          {liked.map((project) => {
            const cover = projectCover(project);
            const src = cover && cover.type === "image" ? mediaUrl(cover.url) : "";
            return (
              <Link key={project.id} href={`/work/${project.id}`} className="account-like">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" />
                ) : (
                  <span />
                )}
                <b>{project.title}</b>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon, { type IconName } from "./Icon";

export default function MobileMenu({ categories, settings, navigation }: { categories: Category[]; settings: SiteSettings; navigation: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useMemo(() => navigation
    .filter((item) => item.is_active && (item.location === "mobile" || item.location === "header"))
    .sort((a, b) => a.sort_order - b.sort_order), [navigation]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const close = () => setOpen(false);
  const socialLinks = [
    ["instagram", settings.instagram, "Instagram"],
    ["tiktok", settings.tiktok, "TikTok"],
    ["store", settings.shopee_showcase, "Vitrine Shopee"],
    ["whatsapp", settings.whatsapp, "WhatsApp"],
    ["youtube", settings.youtube, "YouTube"],
  ] as const;

  const menu = open ? (
    <div className="hs-menu-portal" role="presentation" style={{"--brand":settings.primary_color,"--brand-soft":settings.secondary_color,"--surface":settings.surface_color,"--text":settings.text_color,"--muted":settings.muted_text_color,"--border":settings.border_color} as CSSProperties}>
      <button className="hs-menu-overlay" type="button" onClick={close} aria-label="Fechar menu" />
      <aside className="hs-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu principal">
        <div className="hs-drawer-head">
          <Link href="/" className="hs-drawer-brand" onClick={close}>
            <span><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" /></span>
            <div><strong>{settings.site_name}</strong><small>{settings.header_tagline}</small></div>
          </Link>
          <button type="button" onClick={close} aria-label="Fechar menu"><Icon name="close" /></button>
        </div>

        <nav className="hs-drawer-links" aria-label="Links do menu">
          {items.length ? items.map((item) => (
            <Link href={item.url} key={item.id} onClick={close} target={item.open_new_tab ? "_blank" : undefined}>
              <span><Icon name={(item.icon || "link") as IconName} /><b>{item.label}</b></span><Icon name="arrow" size={16} />
            </Link>
          )) : <>
            <Link href="/" onClick={close}><span><Icon name="home" /><b>Início</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#produtos-dos-videos" onClick={close}><span><Icon name="sparkles" /><b>Produtos dos vídeos</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#categorias" onClick={close}><span><Icon name="categories" /><b>Categorias</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#produtos" onClick={close}><span><Icon name="products" /><b>Todos os produtos</b></span><Icon name="arrow" size={16} /></Link>
          </>}
        </nav>

        {categories.length ? (
          <div className="hs-drawer-categories">
            <div><strong>Categorias</strong><small>Escolha uma área</small></div>
            <section>
              {categories.slice(0, 10).map((category) => (
                <Link href={`/categoria/${category.slug}`} key={category.id} onClick={close}>
                  <span style={{ borderColor: category.accent_color || "var(--brand)" }}>
                    {category.image_url ? <img src={category.image_url} alt="" /> : <b>{category.icon || "✦"}</b>}
                  </span>
                  <small>{category.name}</small>
                </Link>
              ))}
            </section>
          </div>
        ) : null}

        <div className="hs-drawer-socials">
          {socialLinks.filter(([, url]) => Boolean(url)).map(([icon, url, label]) => (
            <a href={url} target="_blank" rel="noreferrer" aria-label={label} key={label}><Icon name={icon} /><span>{label}</span></a>
          ))}
        </div>
      </aside>
    </div>
  ) : null;

  return <>
    <button className="hs-menu-trigger" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}><Icon name="menu" /></button>
    {mounted && menu ? createPortal(menu, document.body) : null}
  </>;
}

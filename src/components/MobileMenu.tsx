"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon, { type IconName } from "./Icon";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

export default function MobileMenu({ categories, settings, navigation }: { categories: Category[]; settings: SiteSettings; navigation: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useMemo(() => navigation.filter((item) => item.is_active && isSafePublicUrl(item.url) && (item.location === "mobile" || item.location === "header")).sort((a, b) => a.sort_order - b.sort_order), [navigation]);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 20);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); triggerRef.current?.focus(); };
  }, [open]);

  const fallback = [
    ["/", "Início", "home"],
    ["/#produtos-dos-videos", "Produtos dos vídeos", "sparkles"],
    ["/#categorias", "Categorias", "categories"],
    ["/#produtos", "Catálogo completo", "products"],
  ] as const;
  const socials = [
    ["instagram", settings.instagram, "Instagram"], ["tiktok", settings.tiktok, "TikTok"], ["store", settings.shopee_showcase, "Shopee"], ["whatsapp", settings.whatsapp, "WhatsApp"], ["youtube", settings.youtube, "YouTube"],
  ] as const;
  const close = () => setOpen(false);

  const drawer = open ? (
    <div className="hs-mobile-menu" role="presentation">
      <button className="hs-mobile-menu__backdrop" onClick={close} aria-label="Fechar menu" />
      <aside className="hs-mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menu principal">
        <div className="hs-mobile-menu__handle" />
        <header>
          <Link href="/" onClick={close} className="hs-mobile-menu__brand"><span><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" /></span><div><strong>{settings.site_name}</strong><small>Encontre seu próximo achado</small></div></Link>
          <button ref={closeRef} onClick={close} aria-label="Fechar menu"><Icon name="close" /></button>
        </header>
        <Link href="/busca" onClick={close} className="hs-mobile-menu__search"><Icon name="search" /><span>Buscar nome ou código</span><Icon name="arrow" size={16} /></Link>
        <nav className="hs-mobile-menu__links">
          {(items.length ? items.map((item) => ({ href: item.url, label: item.label, icon: (item.icon || "link") as IconName, id: item.id })) : fallback.map(([href, label, icon]) => ({ href, label, icon: icon as IconName, id: href }))).map((item) => (
            <Link href={safePublicHref(item.href, "/")} key={item.id} onClick={close}><span><Icon name={item.icon} /></span><strong>{item.label}</strong><Icon name="arrow" size={16} /></Link>
          ))}
        </nav>
        {categories.length ? <section className="hs-mobile-menu__categories"><div><strong>Categorias</strong><small>Escolha uma área</small></div><nav>{categories.slice(0, 7).map((category) => <Link href={`/categoria/${category.slug}`} onClick={close} key={category.id}>{category.image_url ? <img src={category.image_url} alt="" /> : <span>{category.name.slice(0, 2).toUpperCase()}</span>}<b>{category.name}</b></Link>)}</nav></section> : null}
        <footer>
          <div>{socials.filter(([, url]) => isSafePublicUrl(url)).map(([icon, url, label]) => <a href={safePublicHref(url)} target="_blank" rel="noopener noreferrer" aria-label={label} key={label}><Icon name={icon} /></a>)}</div>
          <small>Links de afiliado podem gerar comissão sem custo extra.</small>
        </footer>
      </aside>
    </div>
  ) : null;

  return <><button ref={triggerRef} className="hs-menu-trigger" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}><Icon name="menu" /></button>{mounted && drawer ? createPortal(drawer, document.body) : null}</>;
}

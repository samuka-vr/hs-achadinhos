"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon, { type IconName } from "./Icon";
import SearchBox from "./SearchBox";

export default function MobileMenu({ categories, settings, navigation }: { categories: Category[]; settings: SiteSettings; navigation: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => navigation
    .filter((item) => item.is_active && (item.location === "mobile" || item.location === "header"))
    .sort((a, b) => a.sort_order - b.sort_order), [navigation]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  const close = () => setOpen(false);

  return <>
    <button className="hs-menu-trigger" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}><Icon name="menu" /></button>
    {open ? <div className="hs-sheet-backdrop" role="presentation" onMouseDown={close}>
      <aside className="hs-mobile-sheet" role="dialog" aria-modal="true" aria-label="Menu" onMouseDown={(event) => event.stopPropagation()}>
        <div className="hs-sheet-handle" />
        <div className="hs-sheet-head">
          <div><small>H&S ACHADINHOS</small><strong>O que você procura?</strong></div>
          <button type="button" onClick={close} aria-label="Fechar menu"><Icon name="close" /></button>
        </div>
        <div className="hs-sheet-search"><SearchBox /></div>
        <nav className="hs-sheet-links">
          {items.length ? items.map((item) => <Link href={item.url} key={item.id} onClick={close} target={item.open_new_tab ? "_blank" : undefined}>
            <span><Icon name={(item.icon || "link") as IconName} /><b>{item.label}</b></span><Icon name="arrow" size={16} />
          </Link>) : <>
            <Link href="/" onClick={close}><span><Icon name="home" /><b>Início</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#produtos-dos-videos" onClick={close}><span><Icon name="sparkles" /><b>Produtos dos vídeos</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#categorias" onClick={close}><span><Icon name="categories" /><b>Categorias</b></span><Icon name="arrow" size={16} /></Link>
            <Link href="/#produtos" onClick={close}><span><Icon name="products" /><b>Todos os produtos</b></span><Icon name="arrow" size={16} /></Link>
          </>}
        </nav>
        {categories.length ? <div className="hs-sheet-categories">
          <div className="hs-sheet-section-title"><span>Categorias</span><small>Deslize para ver</small></div>
          <div>{categories.slice(0, 10).map((category) => <Link href={`/categoria/${category.slug}`} key={category.id} onClick={close}>
            <span style={{ borderColor: category.accent_color || "var(--brand)" }}>{category.image_url ? <img src={category.image_url} alt="" /> : <b>{category.icon || "✦"}</b>}</span>
            <small>{category.name}</small>
          </Link>)}</div>
        </div> : null}
        <div className="hs-sheet-socials">
          {settings.instagram ? <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a> : null}
          {settings.tiktok ? <a href={settings.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><Icon name="tiktok" /></a> : null}
          {settings.whatsapp ? <a href={settings.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" /></a> : null}
          {settings.youtube ? <a href={settings.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Icon name="youtube" /></a> : null}
        </div>
      </aside>
    </div> : null}
  </>;
}

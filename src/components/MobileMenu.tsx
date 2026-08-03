"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function MobileMenu({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="header-icon-button mobile-menu-trigger" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
      {open ? <div className="mobile-drawer-backdrop" onClick={() => setOpen(false)}>
        <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-drawer-head">
            <div className="brand brand-compact">
              <img src={settings.logo_url || "/brand/hs-logo.png"} alt="" />
              <span>{settings.site_name}</span>
            </div>
            <button className="header-icon-button" type="button" onClick={() => setOpen(false)} aria-label="Fechar menu"><Icon name="close" /></button>
          </div>
          <nav className="mobile-drawer-links">
            <Link href="/" onClick={() => setOpen(false)}><Icon name="home" /> Início</Link>
            <Link href="/#categorias" onClick={() => setOpen(false)}><Icon name="categories" /> Categorias</Link>
            <Link href="/#produtos" onClick={() => setOpen(false)}><Icon name="products" /> Todos os produtos</Link>
            <Link href="/sobre" onClick={() => setOpen(false)}><Icon name="sparkles" /> Sobre</Link>
          </nav>
          <div className="mobile-drawer-section">
            <small>Categorias</small>
            {categories.slice(0, 10).map((category) => <Link href={`/categoria/${category.slug}`} key={category.id} onClick={() => setOpen(false)}><span>{category.icon || "•"}</span>{category.name}</Link>)}
          </div>
          <div className="mobile-drawer-socials">
            {settings.instagram ? <a href={settings.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" />Instagram</a> : null}
            {settings.whatsapp ? <a href={settings.whatsapp} target="_blank" rel="noreferrer"><Icon name="whatsapp" />WhatsApp</a> : null}
          </div>
        </aside>
      </div> : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function MobileMenu({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className="header-icon-button mobile-menu-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="mobile-site-menu"
      >
        <Icon name="menu" />
      </button>

      {open ? (
        <div className="mobile-drawer-backdrop" role="presentation" onMouseDown={close}>
          <aside
            id="mobile-site-menu"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu do site"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-head">
              <Link className="brand brand-compact" href="/" onClick={close}>
                <img src={settings.logo_url || "/brand/hs-logo.png"} alt="" />
                <span>{settings.site_name}</span>
              </Link>
              <button className="header-icon-button" type="button" onClick={close} aria-label="Fechar menu">
                <Icon name="close" />
              </button>
            </div>

            <div className="mobile-drawer-body">
              <div className="mobile-drawer-callout">
                <span><Icon name="sparkles" size={18} /></span>
                <div>
                  <strong>Veio de um vídeo?</strong>
                  <small>Os links mais recentes ficam logo no início da página.</small>
                </div>
                <Link href="/#ultimos-links" onClick={close}>Ver agora</Link>
              </div>

              <nav className="mobile-drawer-links" aria-label="Navegação móvel">
                <Link href="/" onClick={close}><Icon name="home" /><span>Início</span></Link>
                <Link href="/#ultimos-links" onClick={close}><Icon name="sparkles" /><span>Produtos dos vídeos</span></Link>
                <Link href="/#categorias" onClick={close}><Icon name="categories" /><span>Categorias</span></Link>
                <Link href="/#produtos" onClick={close}><Icon name="products" /><span>Todos os produtos</span></Link>
                <Link href="/sobre" onClick={close}><Icon name="tag" /><span>Sobre</span></Link>
              </nav>

              {categories.length ? (
                <div className="mobile-drawer-section">
                  <small>Explorar por categoria</small>
                  <div className="mobile-drawer-category-grid">
                    {categories.slice(0, 8).map((category) => (
                      <Link href={`/categoria/${category.slug}`} key={category.id} onClick={close}>
                        <span>{category.icon || "•"}</span>
                        <b>{category.name}</b>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mobile-drawer-socials">
                {settings.instagram ? <a href={settings.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" />Instagram</a> : null}
                {settings.tiktok ? <a href={settings.tiktok} target="_blank" rel="noreferrer"><Icon name="tiktok" />TikTok</a> : null}
                {settings.whatsapp ? <a href={settings.whatsapp} target="_blank" rel="noreferrer"><Icon name="whatsapp" />WhatsApp</a> : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

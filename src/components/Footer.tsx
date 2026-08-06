"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon, { type IconName } from "./Icon";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

type FooterLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

type FooterGroup = {
  id: "explore" | "categories" | "information";
  title: string;
  links: FooterLink[];
};

export default function Footer({
  settings,
  categories,
  navigation,
}: {
  settings: SiteSettings;
  categories: Category[];
  navigation: NavigationItem[];
}) {
  const [openGroup, setOpenGroup] = useState<FooterGroup["id"] | null>(null);

  const socials: Array<[string, string, IconName]> = [
    [settings.instagram, "Instagram", "instagram"],
    [settings.tiktok, "TikTok", "tiktok"],
    [settings.shopee_showcase, "Vitrine Shopee", "store"],
    [settings.whatsapp, "WhatsApp", "whatsapp"],
    [settings.youtube, "YouTube", "youtube"],
  ];

  const footerItems: FooterLink[] = navigation
    .filter(
      (item) =>
        item.location === "footer" &&
        item.is_active &&
        isSafePublicUrl(item.url),
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      label: item.label,
      href: safePublicHref(item.url, "/"),
      external: item.open_new_tab,
    }));

  const groups: FooterGroup[] = [
    {
      id: "explore",
      title: "Explorar",
      links: [
        { id: "home", label: "Início", href: "/" },
        { id: "videos", label: "Produtos dos vídeos", href: "/#produtos-dos-videos" },
        { id: "catalog", label: "Catálogo completo", href: "/catalogo" },
        { id: "search", label: "Buscar produto", href: "/busca" },
      ],
    },
    {
      id: "categories",
      title: "Categorias",
      links: categories.slice(0, 7).map((category) => ({
        id: category.id,
        label: category.name,
        href: `/categoria/${category.slug}`,
      })),
    },
    {
      id: "information",
      title: "Informações",
      links: footerItems.length
        ? footerItems
        : [
            { id: "about", label: "Sobre", href: "/sobre" },
            { id: "privacy", label: "Privacidade e transparência", href: "/privacidade" },
          ],
    },
  ];

  return (
    <footer className="hs-footer">
      <div className="hs-shell hs-footer__content">
        <section className="hs-footer__brand" aria-label="Sobre a H&S Achadinhos">
          <span className="hs-footer__brand-mark">
            <img
              src={settings.logo_url || "/brand/hs-monogram.svg"}
              alt=""
              width="64"
              height="64"
            />
          </span>
          <div>
            <strong>{settings.site_name}</strong>
            <p>
              {settings.footer_description ||
                "Produtos dos vídeos organizados para você encontrar rápido."}
            </p>
          </div>
          <nav className="hs-footer__socials" aria-label="Redes sociais">
            {socials
              .filter(([url]) => isSafePublicUrl(url))
              .map(([url, label, icon]) => (
                <a
                  href={safePublicHref(url)}
                  key={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon name={icon} />
                </a>
              ))}
          </nav>
        </section>

        <nav className="hs-footer__navigation" aria-label="Links do rodapé">
          {groups.map((group) => {
            const isOpen = openGroup === group.id;
            return (
              <section className={`hs-footer__group ${isOpen ? "is-open" : ""}`} key={group.id}>
                <button
                  type="button"
                  className="hs-footer__group-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`footer-group-${group.id}`}
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                >
                  <span>{group.title}</span>
                  <Icon name={isOpen ? "up" : "down"} size={17} />
                </button>
                <div className="hs-footer__group-body" id={`footer-group-${group.id}`}>
                  {group.links.map((item) =>
                    item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={item.id}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} key={item.id}>
                        {item.label}
                      </Link>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </nav>

        <div className="hs-footer__legal">
          <p>
            Alguns links são de afiliado e podem gerar comissão para a H&S
            Achadinhos, sem alterar o preço para você. A compra, o pagamento, o
            frete e o atendimento acontecem na Shopee.
          </p>
          <small>© {new Date().getFullYear()} {settings.site_name}. Todos os direitos reservados.</small>
        </div>
      </div>
    </footer>
  );
}

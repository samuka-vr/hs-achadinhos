import Link from "next/link";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon, { type IconName } from "./Icon";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

export default function Footer({ settings, categories, navigation }: { settings: SiteSettings; categories: Category[]; navigation: NavigationItem[] }) {
  const socials: Array<[string, string, IconName]> = [[settings.instagram, "Instagram", "instagram"], [settings.tiktok, "TikTok", "tiktok"], [settings.shopee_showcase, "Vitrine Shopee", "store"], [settings.whatsapp, "WhatsApp", "whatsapp"], [settings.youtube, "YouTube", "youtube"]];
  const footerItems = navigation.filter((item) => item.location === "footer" && item.is_active && isSafePublicUrl(item.url)).sort((a, b) => a.sort_order - b.sort_order);
  return (
    <footer className="hs-footer">
      <div className="hs-shell hs-footer__top">
        <div className="hs-footer__brand"><span><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" /></span><div><strong>{settings.site_name}</strong><p>{settings.footer_description || "Produtos dos vídeos organizados para você encontrar rápido."}</p></div></div>
        <div className="hs-footer__column"><strong>Explorar</strong><Link href="/#produtos-dos-videos">Dos vídeos</Link><Link href="/#categorias">Categorias</Link><Link href="/#produtos">Catálogo</Link><Link href="/busca">Buscar</Link></div>
        <div className="hs-footer__column"><strong>Categorias</strong>{categories.slice(0, 5).map((category) => <Link href={`/categoria/${category.slug}`} key={category.id}>{category.name}</Link>)}</div>
        <div className="hs-footer__column"><strong>Informações</strong>{footerItems.length ? footerItems.map((item) => <Link href={safePublicHref(item.url, "/")} key={item.id} target={item.open_new_tab ? "_blank" : undefined} rel={item.open_new_tab ? "noopener noreferrer" : undefined}>{item.label}</Link>) : <><Link href="/sobre">Sobre</Link><Link href="/privacidade">Privacidade</Link></>}</div>
      </div>
      <div className="hs-shell hs-footer__bottom">
        <div className="hs-footer__socials">{socials.filter(([url]) => isSafePublicUrl(url)).map(([url, label, icon]) => <a href={safePublicHref(url)} key={label} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon name={icon} /></a>)}</div>
        <p>Os links levam à Shopee. Preços e estoque podem mudar.</p>
        <small>© {new Date().getFullYear()} {settings.site_name}</small>
      </div>
    </footer>
  );
}

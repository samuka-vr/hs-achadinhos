import Link from "next/link";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon from "./Icon";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";
import MobileMenu from "./MobileMenu";

export default function Header({ settings, categories, navigation }: { settings: SiteSettings; categories: Category[]; navigation: NavigationItem[] }) {
  const items = navigation.filter((item) => item.location === "header" && item.is_active && isSafePublicUrl(item.url)).sort((a, b) => a.sort_order - b.sort_order).slice(0, 4);
  return (
    <>
      {settings.announcement_enabled && settings.announcement_text ? (
        <div className="hs-top-note"><a href={safePublicHref(settings.announcement_url, "#produtos-dos-videos")}><span />{settings.announcement_text}<Icon name="arrow" size={14} /></a></div>
      ) : null}
      <header className={`hs-header ${settings.sticky_header ? "is-sticky" : ""}`}>
        <div className="hs-shell hs-header__inner">
          <Link href="/" className="hs-brand" aria-label={`Página inicial de ${settings.site_name}`}>
            <span className="hs-brand__mark"><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" /></span>
            <span className="hs-brand__text"><strong>{settings.site_name}</strong><small>{settings.header_tagline || "Achou no vídeo. Encontrou aqui."}</small></span>
          </Link>
          <nav className="hs-header__nav" aria-label="Navegação principal">
            {items.length ? items.map((item) => <Link href={safePublicHref(item.url, "/")} key={item.id} target={item.open_new_tab ? "_blank" : undefined} rel={item.open_new_tab ? "noopener noreferrer" : undefined}>{item.label}</Link>) : <><Link href="/#produtos-dos-videos">Dos vídeos</Link><Link href="/#categorias">Categorias</Link><Link href="/#produtos">Catálogo</Link></>}
          </nav>
          <div className="hs-header__actions">
            {settings.show_header_search ? <Link href="/busca" className="hs-header__search"><Icon name="search" size={18} /><span>Buscar</span></Link> : null}
            <MobileMenu settings={settings} categories={categories} navigation={navigation} />
          </div>
        </div>
      </header>
    </>
  );
}

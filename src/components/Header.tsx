import Link from "next/link";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon from "./Icon";
import MobileMenu from "./MobileMenu";

export default function Header({ settings, categories, navigation }: { settings: SiteSettings; categories: Category[]; navigation: NavigationItem[] }) {
  const headerItems = navigation
    .filter((item) => item.location === "header" && item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 5);

  return (
    <>
      {settings.announcement_enabled && settings.announcement_text ? (
        <div className="hs-announcement">
          <a href={settings.announcement_url || "#produtos-dos-videos"}>
            <span className="hs-announcement-dot" />
            <span>{settings.announcement_text}</span>
            <Icon name="arrow" size={14} />
          </a>
        </div>
      ) : null}

      <header className={`hs-header ${settings.sticky_header ? "is-sticky" : ""}`}>
        <div className="hs-container hs-header-inner">
          <Link className="hs-brand" href="/" aria-label={`Página inicial de ${settings.site_name}`}>
            <span className="hs-brand-mark">
              <img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" />
            </span>
            <span className="hs-brand-name">
              <strong>{settings.site_name}</strong>
              <small>{settings.header_tagline || "Achou no vídeo. Encontrou aqui."}</small>
            </span>
          </Link>

          <nav className="hs-desktop-nav" aria-label="Navegação principal">
            {headerItems.length ? (
              headerItems.map((item) => (
                <Link href={item.url} key={item.id} target={item.open_new_tab ? "_blank" : undefined}>
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                <Link href="/#produtos-dos-videos">Dos vídeos</Link>
                <Link href="/#categorias">Categorias</Link>
                <Link href="/#produtos">Catálogo</Link>
              </>
            )}
          </nav>

          <div className="hs-header-actions">
            {settings.show_header_search ? (
              <Link className="hs-header-search-button" href="/busca" aria-label="Buscar produtos">
                <Icon name="search" />
                <span>Buscar</span>
              </Link>
            ) : null}
            <MobileMenu categories={categories} settings={settings} navigation={navigation} />
          </div>
        </div>
      </header>
    </>
  );
}

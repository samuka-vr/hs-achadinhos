import Link from "next/link";
import type { Category, SiteSettings } from "@/lib/types";
import SearchBox from "./SearchBox";
import Icon from "./Icon";
import MobileMenu from "./MobileMenu";

export default function Header({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  return (
    <>
      {settings.announcement_enabled && settings.announcement_text ? <div className="announcement-bar"><a href={settings.announcement_url || "#produtos"}>{settings.announcement_text}</a></div> : null}
      <header className="site-header clean-header">
        <div className="container clean-header-row">
          <Link className="brand clean-brand" href="/" aria-label={`${settings.site_name} - início`}>
            <img className="brand-logo" src={settings.logo_url || "/brand/hs-logo.png"} alt={`Logo ${settings.site_name}`} />
            <span className="brand-copy"><strong>{settings.site_name}</strong><small>{settings.header_tagline}</small></span>
          </Link>
          <SearchBox />
          <div className="header-actions">
            <nav className="clean-desktop-nav" aria-label="Navegação principal">
              <Link href="/#ultimos-links">Produtos dos vídeos</Link>
              <Link href="/#categorias">Categorias</Link>
              <Link href="/#produtos">Todos os produtos</Link>
            </nav>
            {settings.instagram ? <a className="header-icon-button desktop-action" href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a> : null}
            <MobileMenu categories={categories} settings={settings} />
          </div>
        </div>
      </header>
    </>
  );
}

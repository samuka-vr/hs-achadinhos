import Link from "next/link";
import type { Category, SiteSettings } from "@/lib/types";
import SearchBox from "./SearchBox";
import Icon from "./Icon";
import MobileMenu from "./MobileMenu";

export default function Header({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  return (
    <>
      {settings.announcement_enabled && settings.announcement_text ? <div className="announcement-bar">
        <a href={settings.announcement_url || "#produtos"}><Icon name="sparkles" size={16} />{settings.announcement_text}<Icon name="arrow" size={16} /></a>
      </div> : null}
      <header className="site-header">
        <div className="container header-main-row">
          <Link className="brand" href="/" aria-label={`${settings.site_name} - início`}>
            <img className="brand-logo" src={settings.logo_url || "/brand/hs-logo.png"} alt={`Logo ${settings.site_name}`} />
            <span className="brand-copy"><strong>{settings.site_name}</strong><small>Achadinhos selecionados</small></span>
          </Link>
          <SearchBox />
          <div className="header-actions">
            {settings.instagram ? <a className="header-icon-button desktop-action" href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a> : null}
            {settings.whatsapp ? <a className="header-icon-button desktop-action" href={settings.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" /></a> : null}
            <MobileMenu categories={categories} settings={settings} />
          </div>
        </div>
        <div className="header-nav-row">
          <div className="container header-nav-inner">
            <nav className="main-nav" aria-label="Navegação principal">
              <Link href="/">Início</Link>
              <Link href="/#categorias">Categorias</Link>
              <Link href="/#novidades">Novidades</Link>
              <Link href="/#produtos">Todos os produtos</Link>
              <Link href="/sobre">Sobre</Link>
            </nav>
            <div className="quick-category-nav">
              {categories.slice(0, 5).map((category) => <Link href={`/categoria/${category.slug}`} key={category.id}>{category.icon ? <span>{category.icon}</span> : null}{category.name}</Link>)}
            </div>
          </div>
        </div>
      </header>
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
        <Link href="/"><Icon name="home" /><span>Início</span></Link>
        <Link href="/#categorias"><Icon name="categories" /><span>Categorias</span></Link>
        <Link className="mobile-bottom-main" href="/#produtos"><Icon name="search" /><span>Buscar</span></Link>
        <Link href="/#novidades"><Icon name="sparkles" /><span>Novidades</span></Link>
        <Link href="/sobre"><Icon name="products" /><span>Sobre</span></Link>
      </nav>
    </>
  );
}

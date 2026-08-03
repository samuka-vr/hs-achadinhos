import Link from "next/link";
import type { Category, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function Footer({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  const year = new Date().getFullYear();
  const socials = [
    ["instagram", settings.instagram, "Instagram"], ["whatsapp", settings.whatsapp, "WhatsApp"], ["tiktok", settings.tiktok, "TikTok"], ["youtube", settings.youtube, "YouTube"], ["facebook", settings.facebook, "Facebook"], ["telegram", settings.telegram, "Telegram"],
  ] as const;
  return (
    <footer className="site-footer">
      <div className="footer-glow" />
      <div className="container footer-content">
        <div className="footer-grid">
          <div className="footer-brand-column">
            <Link className="brand footer-brand" href="/"><img className="brand-logo" src={settings.logo_url || "/brand/hs-logo.png"} alt="" /><span className="brand-copy"><strong>{settings.site_name}</strong><small>Achadinhos selecionados</small></span></Link>
            <p>{settings.footer_description}</p>
            <div className="footer-socials">{socials.map(([icon, href, label]) => href ? <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon name={icon} /></a> : null)}</div>
          </div>
          <div><h3>Explore</h3><div className="footer-links"><Link href="/">Início</Link><Link href="/#produtos">Todos os produtos</Link><Link href="/#novidades">Novidades</Link><Link href="/sobre">Sobre a H&S</Link></div></div>
          <div><h3>Categorias</h3><div className="footer-links">{categories.slice(0, 6).map((category) => <Link key={category.id} href={`/categoria/${category.slug}`}>{category.name}</Link>)}</div></div>
          <div><h3>Informações</h3><div className="footer-links"><Link href="/privacidade">Política de privacidade</Link>{settings.email ? <a href={`mailto:${settings.email}`}><Icon name="mail" size={16} />{settings.email}</a> : null}<Link href="/admin/login">Área administrativa</Link></div></div>
        </div>
        <div className="footer-disclosure"><Icon name="check" /><p>Ao clicar em uma oferta, você será direcionado para a Shopee. Podemos receber comissão por compras realizadas através dos links, sem custo adicional para você.</p></div>
        <div className="footer-bottom"><span>© {year} {settings.site_name}. Todos os direitos reservados.</span><span>Feito para encontrar boas escolhas com mais facilidade.</span></div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import type { Category, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function Footer({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  const year = new Date().getFullYear();
  const socials = [
    ["instagram", settings.instagram], ["whatsapp", settings.whatsapp], ["tiktok", settings.tiktok], ["youtube", settings.youtube], ["facebook", settings.facebook], ["telegram", settings.telegram],
  ] as const;
  return (
    <footer className="site-footer clean-footer">
      <div className="container clean-footer-grid">
        <div className="clean-footer-brand"><img src={settings.logo_url || "/brand/hs-logo.png"} alt="" /><div><strong>{settings.site_name}</strong><p>{settings.footer_description}</p></div></div>
        <div><strong>Navegação</strong><Link href="/">Início</Link><Link href="/#categorias">Categorias</Link><Link href="/#produtos">Produtos</Link><Link href="/sobre">Sobre</Link></div>
        <div><strong>Categorias</strong>{categories.slice(0, 5).map((category) => <Link key={category.id} href={`/categoria/${category.slug}`}>{category.name}</Link>)}</div>
        <div><strong>Contato</strong><div className="clean-socials">{socials.filter(([,url]) => url).map(([name,url]) => <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name}><Icon name={name} /></a>)}</div>{settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : <small>Use os canais acima para falar com a gente.</small>}</div>
      </div>
      <div className="container clean-footer-bottom"><span>© {year} {settings.site_name}</span><span>Alguns links podem gerar comissão de afiliado, sem custo extra para você.</span><Link href="/privacidade">Privacidade</Link></div>
    </footer>
  );
}

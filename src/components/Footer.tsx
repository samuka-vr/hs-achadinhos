import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/">
              <span className="brand-mark">H&S</span>
              <span>{settings.site_name}</span>
            </Link>
            <p>Produtos selecionados para você encontrar boas opções com mais rapidez.</p>
          </div>
          <div>
            <strong>Navegação</strong>
            <div className="footer-links" style={{ marginTop: 12 }}>
              <Link href="/">Início</Link>
              <Link href="/#categorias">Categorias</Link>
              <Link href="/sobre">Sobre</Link>
              <Link href="/privacidade">Privacidade</Link>
            </div>
          </div>
          <div>
            <strong>Contato</strong>
            <div className="footer-links" style={{ marginTop: 12 }}>
              {settings.whatsapp ? <a href={settings.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> : <small>WhatsApp ainda não configurado.</small>}
              {settings.instagram ? <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a> : null}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Este site pode receber comissão por compras realizadas através dos links, sem custo adicional para você.</p>
          <span>© {year} {settings.site_name}. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}

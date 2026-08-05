import Link from "next/link";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function Footer({ settings }: { settings: SiteSettings; categories: Category[]; navigation: NavigationItem[] }) {
  const socials = [
    ["instagram", settings.instagram, "Instagram"],
    ["tiktok", settings.tiktok, "TikTok"],
    ["store", settings.shopee_showcase, "Vitrine Shopee"],
    ["whatsapp", settings.whatsapp, "WhatsApp"],
    ["youtube", settings.youtube, "YouTube"],
    ["facebook", settings.facebook, "Facebook"],
    ["telegram", settings.telegram, "Telegram"],
  ] as const;
  const active = socials.filter(([, url]) => Boolean(url));

  return (
    <footer className="hs-social-footer" aria-label="Rodapé">
      <div className="hs-container hs-social-footer-inner">
        <div className="hs-footer-brand-panel">
          <div className="hs-footer-brand-lockup">
            <span className="hs-footer-brand-mark"><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt="" /></span>
            <div>
              <strong>{settings.site_name || "H&S Achadinhos"}</strong>
              <span>Viu no vídeo? Encontre aqui.</span>
            </div>
          </div>
          <p>Os produtos e preços podem mudar na Shopee. Ao acessar uma oferta, você será direcionado para a plataforma parceira.</p>
        </div>

        <div className="hs-footer-social-block">
          <div className="hs-footer-social-title">
            <strong>{settings.footer_social_title || "Acompanhe os próximos achados"}</strong>
            <span>{settings.footer_social_subtitle || "Vídeos novos, produtos novos e links organizados."}</span>
          </div>
          <nav aria-label="Redes sociais">
            {active.length ? (
              active.map(([name, url, label]) => (
                <a href={url} target="_blank" rel="noreferrer" key={name} aria-label={label}>
                  <span><Icon name={name} /></span>
                  <b>{label}</b>
                </a>
              ))
            ) : (
              <span className="hs-footer-empty">Os links das redes serão adicionados em breve.</span>
            )}
          </nav>
        </div>
      </div>

      <div className="hs-container hs-footer-bottom">
        <span>© {new Date().getFullYear()} {settings.site_name || "H&S Achadinhos"}</span>
        <div>
          <Link href="/politica-de-privacidade">Privacidade</Link>
          <Link href="/termos-de-uso">Termos</Link>
          <Link href="/aviso-de-afiliado">Aviso de afiliado</Link>
        </div>
      </div>
    </footer>
  );
}

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

  return <footer className="hs-social-footer" aria-label="Redes sociais">
    <div className="hs-container hs-social-footer-inner">
      <div className="hs-footer-social-title"><strong>Acompanhe nossos achadinhos</strong><span>Novidades e links nas redes</span></div>
      <nav aria-label="Links das redes sociais">
        {active.length ? active.map(([name, url, label]) => (
          <a href={url} target="_blank" rel="noreferrer" key={name} aria-label={label}><Icon name={name} /><span>{label}</span></a>
        )) : <span className="hs-footer-empty">Links das redes serão adicionados em breve.</span>}
      </nav>
    </div>
  </footer>;
}

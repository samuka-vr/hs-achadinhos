import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import Icon from "./Icon";

export default function Footer({ settings }: { settings: SiteSettings; categories: Category[]; navigation: NavigationItem[] }) {
  const socials = [
    ["instagram", settings.instagram, "Instagram"],
    ["tiktok", settings.tiktok, "TikTok"],
    ["whatsapp", settings.whatsapp, "WhatsApp"],
    ["youtube", settings.youtube, "YouTube"],
    ["facebook", settings.facebook, "Facebook"],
    ["telegram", settings.telegram, "Telegram"],
  ] as const;
  const active = socials.filter(([, url]) => Boolean(url));
  if (!active.length) return null;
  return <footer className="hs-social-footer" aria-label="Redes sociais">
    <div className="hs-container hs-social-footer-inner">
      {active.map(([name, url, label]) => <a href={url} target="_blank" rel="noreferrer" key={name} aria-label={label}><Icon name={name} /><span>{label}</span></a>)}
    </div>
  </footer>;
}

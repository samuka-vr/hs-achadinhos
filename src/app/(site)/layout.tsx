import type { CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import Icon, { type IconName } from "@/components/Icon";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, NavigationItem } from "@/lib/types";
import { parseSettings } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = getServerSupabase();
  const [s, c, n] = supabase ? await Promise.all([
    supabase.from("site_settings").select("key,value"),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("navigation_items").select("*").eq("is_active", true).order("sort_order"),
  ]) : [{ data: null }, { data: [] }, { data: [] }];

  const settings = parseSettings(s.data);
  const categories = (c.data ?? []) as Category[];
  const navigation = (n.data ?? []) as NavigationItem[];
  const style = {
    "--brand": settings.primary_color,
    "--brand-soft": settings.secondary_color,
    "--accent": settings.accent_color,
    "--site-bg": settings.background_color,
    "--surface": settings.surface_color,
    "--text": settings.text_color,
    "--muted": settings.muted_text_color,
    "--border": settings.border_color,
    "--button-text": settings.button_text_color,
    "--container": `${settings.container_width}px`,
    "--radius": `${settings.corner_radius}px`,
    "--mobile-columns": settings.product_columns_mobile,
    "--desktop-columns": settings.product_columns_desktop,
    "--font-body": settings.font_family === "System" ? "system-ui" : settings.font_family,
    "--font-heading": settings.heading_font_family === "System" ? "system-ui" : settings.heading_font_family,
    "--section-space": `${settings.section_spacing}px`,
    "--shadow-alpha": settings.shadow_strength / 100,
  } as CSSProperties;
  const classes = [
    "site-theme-v5 site-theme-v6",
    `card-style-${settings.card_style}`,
    settings.show_prices ? "show-prices" : "hide-prices",
    settings.show_product_codes ? "show-codes" : "hide-codes",
    settings.show_click_count ? "show-clicks" : "hide-clicks",
    `button-style-${settings.button_style}`,
    `image-ratio-${settings.product_image_ratio}`,
    settings.animations_enabled ? "animations-on" : "animations-off",
  ].join(" ");

  if (settings.maintenance_mode) {
    const socials: Array<[string, string, IconName]> = [
      [settings.instagram, "Instagram", "instagram"],
      [settings.tiktok, "TikTok", "tiktok"],
      [settings.shopee_showcase, "Vitrine Shopee", "store"],
      [settings.whatsapp, "WhatsApp", "whatsapp"],
    ];
    return <div className={`${classes} maintenance-page-v8`} style={style}>
      <style dangerouslySetInnerHTML={{ __html: settings.custom_css || "" }} />
      <main>
        <div className="maintenance-card-v8">
          <img src={settings.logo_url || "/brand/hs-monogram.svg"} alt={settings.site_name} />
          <span>H&S ACHADINHOS</span>
          <h1>{settings.maintenance_title}</h1>
          <p>{settings.maintenance_message}</p>
          <nav>{socials.filter(([url]) => Boolean(url)).map(([url, label, icon]) => <a key={label} href={url} target="_blank" rel="noreferrer"><Icon name={icon} />{label}</a>)}</nav>
        </div>
      </main>
    </div>;
  }

  return <div className={classes} style={style}>
    <style dangerouslySetInnerHTML={{ __html: settings.custom_css || "" }} />
    <PageTracker />
    <Header settings={settings} categories={categories} navigation={navigation} />
    {children}
    <Footer settings={settings} categories={categories} navigation={navigation} />
  </div>;
}

import type { CSSProperties } from "react";
import "../styles/gallery-v13.css";
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

  const legacyPalette: Record<string, string> = {
    "#c96f78": "#d96c78",
    "#b85f6a": "#d96c78",
    "#fffdfc": "#f6efea",
    "#ffffff": "#fff9f5",
    "#f8efec": "#f3b29f",
    "#f5dfe1": "#8f394d",
    "#ead4d7": "#8f394d",
    "#242122": "#2a2224",
    "#756e70": "#726568",
    "#eae2e0": "#e8d9d3",
  };
  const visualColor = (value: string, fallback: string) => legacyPalette[String(value || "").toLowerCase()] || value || fallback;
  const palette = {
    coral: visualColor(settings.primary_color, "#d96c78"),
    wine: visualColor(settings.accent_color, "#8f394d"),
    peach: visualColor(settings.secondary_color, "#f3b29f"),
    background: visualColor(settings.background_color, "#f6efea"),
    surface: visualColor(settings.surface_color, "#fff9f5"),
    text: visualColor(settings.text_color, "#2a2224"),
    muted: visualColor(settings.muted_text_color, "#726568"),
    border: visualColor(settings.border_color, "#e8d9d3"),
  };
  const style = {
    "--brand": palette.coral,
    "--brand-soft": palette.peach,
    "--accent": palette.wine,
    "--site-bg": palette.background,
    "--surface": palette.surface,
    "--text": palette.text,
    "--muted": palette.muted,
    "--border": palette.border,
    "--button-text": settings.button_text_color,
    "--gallery-coral": palette.coral,
    "--gallery-wine": palette.wine,
    "--gallery-peach": palette.peach,
    "--gallery-bg": palette.background,
    "--gallery-surface": palette.surface,
    "--gallery-ink": palette.text,
    "--gallery-muted": palette.muted,
    "--gallery-border": palette.border,
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
    "gallery-app",
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
    <PageTracker />
    <Header settings={settings} categories={categories} navigation={navigation} />
    {children}
    <Footer settings={settings} categories={categories} navigation={navigation} />
  </div>;
}

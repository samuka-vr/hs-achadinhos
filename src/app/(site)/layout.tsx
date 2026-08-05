import type { CSSProperties } from "react";
import "../styles/public-v14.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import Icon, { type IconName } from "@/components/Icon";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, NavigationItem } from "@/lib/types";
import { parseSettings } from "@/lib/utils";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = getServerSupabase();
  const [settingsResult, categoryResult, navigationResult] = supabase ? await Promise.all([
    supabase.from("site_settings").select("key,value"),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("navigation_items").select("*").eq("is_active", true).order("sort_order"),
  ]) : [{ data: null }, { data: [] }, { data: [] }];

  const settings = parseSettings(settingsResult.data);
  const categories = (categoryResult.data ?? []) as Category[];
  const navigation = (navigationResult.data ?? []) as NavigationItem[];
  const style = {
    "--hs-primary": settings.primary_color || "#e85d75",
    "--hs-primary-strong": settings.accent_color || "#6f2f50",
    "--hs-secondary": settings.secondary_color || "#f6b36f",
    "--hs-bg": settings.background_color || "#fff8f3",
    "--hs-surface": settings.surface_color || "#ffffff",
    "--hs-text": settings.text_color || "#251f25",
    "--hs-muted": settings.muted_text_color || "#756b73",
    "--hs-border": settings.border_color || "#eaded8",
    "--hs-button-text": settings.button_text_color || "#ffffff",
    "--hs-container": `${Math.min(Math.max(settings.container_width || 1180, 960), 1380)}px`,
    "--hs-radius": `${Math.min(Math.max(settings.corner_radius || 20, 12), 28)}px`,
    "--hs-mobile-columns": Math.min(Math.max(settings.product_columns_mobile || 2, 1), 2),
    "--hs-desktop-columns": Math.min(Math.max(settings.product_columns_desktop || 4, 2), 5),
    "--hs-body-font": settings.font_family === "System" ? "system-ui" : settings.font_family,
    "--hs-heading-font": settings.heading_font_family === "System" ? "system-ui" : settings.heading_font_family,
  } as CSSProperties;
  const classes = [
    "hs-public-app",
    settings.show_prices ? "show-prices" : "hide-prices",
    settings.show_product_codes ? "show-codes" : "hide-codes",
    settings.animations_enabled ? "animations-on" : "animations-off",
  ].join(" ");

  if (settings.maintenance_mode) {
    const socials: Array<[string, string, IconName]> = [[settings.instagram, "Instagram", "instagram"], [settings.tiktok, "TikTok", "tiktok"], [settings.shopee_showcase, "Vitrine Shopee", "store"], [settings.whatsapp, "WhatsApp", "whatsapp"]];
    return <div className={`${classes} hs-maintenance`} style={style}><main><section><img src={settings.logo_url || "/brand/hs-monogram.svg"} alt={settings.site_name} /><span>H&S ACHADINHOS</span><h1>{settings.maintenance_title}</h1><p>{settings.maintenance_message}</p><nav>{socials.filter(([url]) => isSafePublicUrl(url)).map(([url, label, icon]) => <a href={safePublicHref(url)} target="_blank" rel="noopener noreferrer" key={label}><Icon name={icon} />{label}</a>)}</nav></section></main></div>;
  }

  return <div className={classes} style={style}><PageTracker /><Header settings={settings} categories={categories} navigation={navigation} />{children}<Footer settings={settings} categories={categories} navigation={navigation} /></div>;
}

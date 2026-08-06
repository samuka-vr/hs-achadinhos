import type { CSSProperties } from "react";
import "../styles/public.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import Icon, { type IconName } from "@/components/Icon";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, NavigationItem } from "@/lib/types";
import { parseSettings } from "@/lib/utils";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";


function normalizeLegacyTheme(value: string | null | undefined, legacy: string, replacement: string) {
  return !value || value.toLowerCase() === legacy.toLowerCase() ? replacement : value;
}

function darkenHexColor(value: string, factor = 0.56) {
  const match = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return "#8f394d";
  const number = Number.parseInt(match[1], 16);
  const channels = [number >> 16, (number >> 8) & 255, number & 255]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel * factor))));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

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
  const primary = normalizeLegacyTheme(settings.primary_color, "#c96f78", "#d96c78");
  const style = {
    "--hs-primary": primary,
    "--hs-primary-strong": darkenHexColor(primary),
    "--hs-accent": normalizeLegacyTheme(settings.accent_color, "#f5dfe1", "#b7a6ca"),
    "--hs-secondary": normalizeLegacyTheme(settings.secondary_color, "#f8efec", "#f3b29f"),
    "--hs-bg": normalizeLegacyTheme(settings.background_color, "#fffdfc", "#f6efea"),
    "--hs-surface": normalizeLegacyTheme(settings.surface_color, "#ffffff", "#fff9f5"),
    "--hs-text": normalizeLegacyTheme(settings.text_color, "#242122", "#2a2224"),
    "--hs-muted": normalizeLegacyTheme(settings.muted_text_color, "#756e70", "#726568"),
    "--hs-border": normalizeLegacyTheme(settings.border_color, "#eae2e0", "#e8d9d3"),
    "--hs-button-text": settings.button_text_color || "#ffffff",
    "--hs-button-primary": settings.button_primary_color || primary,
    "--hs-button-primary-hover": settings.button_primary_hover_color || darkenHexColor(settings.button_primary_color || primary, 0.82),
    "--hs-button-secondary": settings.button_secondary_color || "#fff3f0",
    "--hs-button-secondary-text": settings.button_secondary_text_color || "#8f394d",
    "--hs-link": settings.link_color || primary,
    "--hs-success": settings.success_color || "#2f7d5b",
    "--hs-danger": settings.danger_color || "#b5475a",
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

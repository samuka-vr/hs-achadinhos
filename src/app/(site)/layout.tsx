import type { CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { parseSettings } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = getServerSupabase();
  const [settingsResult, categoriesResult] = supabase ? await Promise.all([
    supabase.from("site_settings").select("key,value"),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
  ]) : [{ data: null }, { data: [] }];
  const settings = parseSettings(settingsResult.data);
  const categories = (categoriesResult.data ?? []) as Category[];
  const style = { "--brand": settings.primary_color, "--brand-soft": settings.secondary_color } as CSSProperties;
  return <div className="site-theme" style={style}><Header settings={settings} categories={categories} />{children}<Footer settings={settings} categories={categories} /></div>;
}

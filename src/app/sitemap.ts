import type { MetadataRoute } from "next";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeSiteUrl } from "@/lib/security";

type SitemapRow = { slug: string; updated_at: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL).toString().replace(/\/$/, "");
  const supabase = getServerSupabase();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/busca`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
  ];
  if (!supabase) return entries;

  const [products, categories, pages] = await Promise.all([
    supabase.from("products").select("slug,updated_at").eq("is_active", true).limit(1000),
    supabase.from("categories").select("slug,updated_at").eq("is_active", true).limit(100),
    supabase.from("content_pages").select("slug,updated_at").eq("is_published", true).limit(100),
  ]);

  ((products.data ?? []) as SitemapRow[]).forEach((item) => entries.push({ url: `${base}/produto/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly", priority: 0.8 }));
  ((categories.data ?? []) as SitemapRow[]).forEach((item) => entries.push({ url: `${base}/categoria/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly", priority: 0.7 }));
  ((pages.data ?? []) as SitemapRow[]).forEach((item) => entries.push({ url: `${base}/${item.slug}`, lastModified: item.updated_at, changeFrequency: "monthly", priority: 0.4 }));
  return entries;
}

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServerSupabase();
  const { data } = supabase ? await supabase.from("categories").select("name,description,image_url").eq("slug", slug).eq("is_active", true).maybeSingle() : { data: null };
  return { title: data?.name || "Categoria", description: data?.description || undefined, openGraph: { images: data?.image_url ? [data.image_url] : [] } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!category) notFound();
  const { data } = await supabase.from("products").select("*,categories(id,name,slug)").eq("category_id", category.id).eq("is_active", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(240);
  const products = (data ?? []) as Product[];
  const initials = String(category.name).split(/\s|&/).map((part) => part.trim()).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return <main className="hs-inner-page"><div className="hs-shell">
    <nav className="hs-breadcrumbs"><Link href="/">Início</Link><Icon name="arrow" size={13} /><strong>{category.name}</strong></nav>
    <section className="hs-category-hero" style={{ "--category-accent": category.accent_color || "#e85d75" } as CSSProperties}>
      <div className="hs-category-hero__media">{category.image_url ? <img src={category.image_url} alt={category.name} /> : <span>{initials}</span>}</div>
      <div className="hs-category-hero__copy"><span>CATEGORIA</span><h1>{category.name}</h1><p>{category.description || "Produtos organizados para você encontrar mais rápido."}</p><small><Icon name="products" size={16} />{products.length} produto(s)</small></div>
    </section>
    <section className="hs-section hs-inner-section"><ProductGrid products={products} /></section>
  </div></main>;
}

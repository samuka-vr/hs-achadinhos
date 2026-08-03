import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServerSupabase();
  const { data } = supabase ? await supabase.from("categories").select("name").eq("slug", slug).eq("is_active", true).maybeSingle() : { data: null };
  return { title: data?.name ?? "Categoria" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!category) notFound();
  const { data } = await supabase.from("products").select("*,categories(id,name,slug)").eq("category_id", category.id).eq("is_active", true).order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];
  return <main className="page"><div className="container">
    <section className="category-hero-pro">
      <div className="category-hero-icon">{category.image_url ? <img src={category.image_url} alt={category.name} /> : <span>{category.icon || "✦"}</span>}</div>
      <div><span className="section-eyebrow">Categoria</span><h1>{category.name}</h1><p>{products.length} produto(s) selecionados para você explorar.</p></div>
      <Icon name="categories" size={48} className="category-hero-watermark" />
    </section>
    <section className="section"><div className="catalog-result-line"><Icon name="products" size={17} /><strong>{products.length}</strong> produto(s) nesta categoria</div><ProductGrid products={products} /></section>
  </div></main>;
}

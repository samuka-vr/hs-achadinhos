import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  const { data } = await supabase
    .from("products")
    .select("*,categories(id,name,slug)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];
  const initials = String(category.name).split(/\s|&/).map((part) => part.trim()).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <main className="category-page-v5">
      <div className="container-v5">
        <section className="category-hero-v5" style={{ background: `linear-gradient(135deg,${category.accent_color || "var(--brand)"}1f,var(--surface))` }}>
          <div className="category-hero-image-v5" style={{ borderColor: category.accent_color || "var(--brand)" }}>
            {category.image_url ? <img src={category.image_url} alt={category.name} /> : <span>{initials}</span>}
          </div>
          <div><span>CATEGORIA</span><h1>{category.name}</h1><p>{category.description || `${products.length} produto(s) organizados nesta categoria.`}</p><small>{products.length} produto(s)</small></div>
        </section>
        <section className="section-v5"><ProductGrid products={products} /></section>
      </div>
    </main>
  );
}

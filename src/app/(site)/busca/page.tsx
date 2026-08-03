import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { normalizeSearch } from "@/lib/utils";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const normalized = normalizeSearch(q);
  const supabase = getServerSupabase();
  const { data } = supabase ? await supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).limit(1000) : { data: [] };
  const products = ((data ?? []) as Product[]).filter((product) => normalizeSearch([product.name, product.short_description || "", product.categories?.name || "", ...(product.tags || [])].join(" ")).includes(normalized) && normalized.length > 0);
  return <main className="page"><div className="container"><section className="search-results-hero"><Icon name="search" size={30} /><div><span className="section-eyebrow">Resultado da pesquisa</span><h1>Busca por “{q}”</h1><p>{products.length} produto(s) encontrado(s).</p></div></section><section className="section"><ProductGrid products={products} emptyTitle="Nenhum produto encontrado" /></section></div></main>;
}

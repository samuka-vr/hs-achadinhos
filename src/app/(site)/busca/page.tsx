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
  const products = ((data ?? []) as Product[]).filter((product) => {
    const haystack = normalizeSearch([product.name, product.short_description || "", product.categories?.name || "", ...(product.tags || [])].join(" "));
    return normalized.length > 0 && haystack.includes(normalized);
  });
  return (
    <main className="page"><div className="container">
      <div className="section-head"><div><h1>Resultados da busca</h1><p>{products.length} resultado(s) para “{q}”.</p></div></div>
      <ProductGrid products={products} emptyTitle="Nenhum produto encontrado" />
    </div></main>
  );
}

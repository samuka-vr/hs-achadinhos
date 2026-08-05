import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import SearchBox from "@/components/SearchBox";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 120);
  const supabase = getServerSupabase();
  let products: Product[] = [];
  if (supabase && query) {
    const pattern = `%${query.replace(/[,%()]/g, " ")}%`;
    const [byName, byCode] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).ilike("name", pattern).limit(120),
      supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).ilike("product_code", pattern).limit(40),
    ]);
    const map = new Map<string, Product>();
    [...(byCode.data ?? []), ...(byName.data ?? [])].forEach((item) => map.set(item.id, item as Product));
    products = [...map.values()];
  }
  return <main className="hs-inner-page"><div className="hs-shell">
    <section className="hs-search-page-hero"><span><Icon name="search" size={28} /></span><div><small>BUSCA H&S</small><h1>{query ? `Resultados para “${query}”` : "Encontre um produto"}</h1><p>{query ? `${products.length} produto(s) encontrado(s).` : "Digite o nome ou o código que apareceu no vídeo."}</p></div><SearchBox variant="hero" /></section>
    <section className="hs-section hs-inner-section"><ProductGrid products={products} emptyTitle="Nenhum produto encontrado" /></section>
  </div></main>;
}

import Icon from "@/components/Icon";
import ProductExplorer from "@/components/ProductExplorer";
import SearchBox from "@/components/SearchBox";
import { getCatalogPage } from "@/lib/catalog";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const supabase = getServerSupabase();
  let initialProducts: Product[] = [];
  let initialTotal = 0;
  let categories: Category[] = [];

  if (supabase) {
    const [catalog, categoryResult] = await Promise.all([
      getCatalogPage(supabase, { page: 1, pageSize: 6, term: query }).catch(() => ({
        products: [] as Product[], total: 0, page: 1, pageSize: 6, hasMore: false,
      })),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
    ]);
    initialProducts = catalog.products;
    initialTotal = catalog.total;
    categories = (categoryResult.data || []) as Category[];
  }

  return (
    <main className="hs-inner-page">
      <div className="hs-shell">
        <section className="hs-search-page-hero">
          <span><Icon name="search" size={28} /></span>
          <div>
            <small>BUSCA H&S</small>
            <h1>{query ? `Resultados para “${query}”` : "Encontre um produto"}</h1>
            <p>{query ? `${initialTotal} produto(s) encontrado(s).` : "Digite o nome ou o código que apareceu no vídeo."}</p>
          </div>
          <SearchBox variant="hero" />
        </section>
        <section className="hs-section hs-inner-section">
          <ProductExplorer
            initialProducts={initialProducts}
            initialTotal={initialTotal}
            categories={categories}
            pageSize={6}
            initialTerm={query}
          />
        </section>
      </div>
    </main>
  );
}

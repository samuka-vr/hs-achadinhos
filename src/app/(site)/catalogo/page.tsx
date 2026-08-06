import type { Metadata } from "next";
import CategoryStories from "@/components/CategoryStories";
import Icon from "@/components/Icon";
import ProductExplorer from "@/components/ProductExplorer";
import SearchBox from "@/components/SearchBox";
import { getCatalogPage } from "@/lib/catalog";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo completo",
  description: "Veja os achadinhos, filtre por categoria e encontre o produto pelo nome ou código.",
};

export default async function CatalogPage() {
  const supabase = getServerSupabase();
  let initialProducts: Product[] = [];
  let initialTotal = 0;
  let categories: Category[] = [];

  if (supabase) {
    const [catalogResult, categoryResult] = await Promise.all([
      getCatalogPage(supabase, { page: 1, pageSize: 6, sort: "recent" }).catch(() => ({
        products: [] as Product[],
        total: 0,
        page: 1,
        pageSize: 6,
        hasMore: false,
      })),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
    ]);
    initialProducts = catalogResult.products;
    initialTotal = catalogResult.total;
    categories = (categoryResult.data || []) as Category[];
  }

  return (
    <main className="hs-inner-page hs-catalog-page">
      <div className="hs-shell">
        <section className="hs-catalog-page__hero">
          <span className="hs-catalog-page__eyebrow"><Icon name="products" size={16} /> CATÁLOGO</span>
          <div>
            <h1>Todos os produtos</h1>
            <p>Encontre pelo nome, pelo código ou por uma das categorias.</p>
          </div>
          <SearchBox />
        </section>

        {categories.length ? (
          <section className="hs-catalog-page__categories" aria-labelledby="catalog-categories-title">
            <header>
              <div><span>ATALHOS</span><h2 id="catalog-categories-title">Categorias</h2></div>
              <small>{categories.length} áreas</small>
            </header>
            <CategoryStories categories={categories} />
          </section>
        ) : null}

        <section className="hs-catalog-page__products" aria-labelledby="catalog-products-title">
          <header className="hs-section-heading">
            <div>
              <span>EXPLORE OS ACHADOS</span>
              <h2 id="catalog-products-title">Encontre o produto certo</h2>
              <p>Começamos com seis produtos. Use “Ver mais” para continuar sem pesar a página.</p>
            </div>
          </header>
          <ProductExplorer
            initialProducts={initialProducts}
            initialTotal={initialTotal}
            categories={categories}
            pageSize={6}
          />
        </section>
      </div>
    </main>
  );
}

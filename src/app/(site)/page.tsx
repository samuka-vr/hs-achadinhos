import Link from "next/link";
import ProductExplorer from "@/components/ProductExplorer";
import ProductGrid from "@/components/ProductGrid";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import { parseSettings } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = getServerSupabase();
  let products: Product[] = [];
  let categories: Category[] = [];
  let settings = parseSettings(null);

  if (supabase) {
    const [productsResult, categoriesResult, settingsResult] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).order("created_at", { ascending: false }).limit(500),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
      supabase.from("site_settings").select("key,value"),
    ]);
    products = (productsResult.data ?? []) as Product[];
    categories = (categoriesResult.data ?? []) as Category[];
    settings = parseSettings(settingsResult.data);
  }

  const trending = [...products].sort((a, b) => b.click_count - a.click_count).slice(0, 8);
  const newest = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

  return (
    <main className="page">
      <div className="container">
        <section className="hero">
          <div className="hero-copy">
            <span className="badge">Seleção atualizada de achadinhos</span>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
            <a className="button" href="#produtos">Explorar produtos</a>
          </div>
        </section>

        <section className="section" id="categorias">
          <div className="section-head"><div><h2>Categorias</h2><p>Encontre produtos por tipo.</p></div></div>
          {categories.length ? <div className="category-row">{categories.map((category) => <Link className="category-chip" href={`/categoria/${category.slug}`} key={category.id}><span>{category.icon || "•"}</span>{category.name}</Link>)}</div> : <div className="empty"><h3>Nenhuma categoria cadastrada</h3><p>As categorias aparecerão aqui após a configuração inicial.</p></div>}
        </section>

        <section className="section">
          <div className="section-head"><div><h2>Em alta</h2><p>Os produtos que mais chamaram atenção.</p></div></div>
          <ProductGrid products={trending} />
        </section>

        <section className="section">
          <div className="section-head"><div><h2>Novidades</h2><p>Os últimos produtos adicionados.</p></div></div>
          <ProductGrid products={newest} />
        </section>

        <section className="section" id="produtos">
          <div className="section-head"><div><h2>Todos os produtos</h2><p>Filtre e ordene para achar o que procura.</p></div></div>
          <ProductExplorer products={products} categories={categories} pageSize={settings.products_per_page || 24} />
        </section>
      </div>
    </main>
  );
}

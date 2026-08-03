import Link from "next/link";
import CategoryStories from "@/components/CategoryStories";
import Icon from "@/components/Icon";
import ProductCoverflow from "@/components/ProductCoverflow";
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
  const sliderProducts = [...products].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.click_count - a.click_count).slice(0, 14);

  return (
    <main className="page home-page">
      <div className="container">
        <section className="home-intro">
          <div>
            <span>{settings.hero_eyebrow}</span>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
          </div>
          <a className="button" href="#produtos">{settings.hero_button_text}<Icon name="arrow" size={17} /></a>
        </section>

        {settings.coverflow_enabled && sliderProducts.length ? (
          <section className="home-slider-section" aria-label="Produtos em destaque">
            <div className="simple-section-head"><div><h2>{settings.coverflow_title}</h2><p>{settings.coverflow_subtitle}</p></div></div>
            <ProductCoverflow products={sliderProducts} speed={settings.carousel_speed} />
          </section>
        ) : null}

        {settings.show_categories && categories.length ? (
          <section className="section simple-section" id="categorias">
            <div className="simple-section-head"><div><h2>Categorias</h2><p>Escolha uma para ver só o que interessa.</p></div></div>
            <CategoryStories categories={categories} />
          </section>
        ) : null}

        {settings.show_trending && trending.length ? (
          <section className="section simple-section" id="em-alta">
            <div className="simple-section-head"><div><h2>Mais vistos</h2><p>Os produtos que receberam mais cliques.</p></div><Link href="#produtos">Ver todos <Icon name="arrow" size={16} /></Link></div>
            <ProductGrid products={trending} />
          </section>
        ) : null}

        {settings.show_newest && newest.length ? (
          <section className="section simple-section" id="novidades">
            <div className="simple-section-head"><div><h2>Adicionados recentemente</h2><p>Os últimos links cadastrados.</p></div></div>
            <ProductGrid products={newest} />
          </section>
        ) : null}

        {settings.show_catalog ? (
          <section className="section simple-section catalog-section-clean" id="produtos">
            <div className="simple-section-head"><div><h2>Todos os produtos</h2><p>Busque pelo nome ou filtre por categoria.</p></div></div>
            <ProductExplorer products={products} categories={categories} pageSize={settings.products_per_page || 24} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

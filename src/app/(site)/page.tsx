import Link from "next/link";
import CategoryStories from "@/components/CategoryStories";
import Icon from "@/components/Icon";
import ProductCoverflow from "@/components/ProductCoverflow";
import ProductExplorer from "@/components/ProductExplorer";
import ProductGrid from "@/components/ProductGrid";
import SearchBox from "@/components/SearchBox";
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
  const videoLinks = [...products]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 14);

  return (
    <main className="page home-page">
      <div className="container">
        <section className="bio-entry" aria-labelledby="bio-entry-title">
          <div className="bio-entry-copy">
            <span className="bio-entry-badge"><Icon name="sparkles" size={16} />{settings.hero_eyebrow}</span>
            <h1 id="bio-entry-title">{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
            <div className="bio-entry-search"><SearchBox /></div>
            <div className="bio-entry-actions">
              <a className="button" href="#ultimos-links">{settings.hero_button_text}<Icon name="arrow" size={17} /></a>
              <a className="button secondary" href="#categorias">Ver categorias</a>
            </div>
          </div>
          <div className="bio-entry-help" aria-label="Como encontrar o produto">
            <strong>É bem simples</strong>
            <ol>
              <li><span>1</span><p><b>Veja os últimos links</b><small>Os produtos dos vídeos mais recentes aparecem primeiro.</small></p></li>
              <li><span>2</span><p><b>Toque na foto</b><small>Você abre os detalhes do achadinho.</small></p></li>
              <li><span>3</span><p><b>Ir para a Shopee</b><small>O botão leva direto ao link do produto.</small></p></li>
            </ol>
          </div>
        </section>

        {settings.coverflow_enabled && videoLinks.length ? (
          <section className="home-slider-section bio-links-section" id="ultimos-links" aria-label="Últimos produtos divulgados">
            <div className="simple-section-head">
              <div><span className="section-kicker">LINK DA BIO</span><h2>{settings.coverflow_title}</h2><p>{settings.coverflow_subtitle}</p></div>
              <a href="#produtos">Ver todos <Icon name="arrow" size={16} /></a>
            </div>
            <ProductCoverflow products={videoLinks} speed={settings.carousel_speed} randomize={false} />
          </section>
        ) : null}

        {settings.show_categories && categories.length ? (
          <section className="section simple-section" id="categorias">
            <div className="simple-section-head"><div><h2>Categorias</h2><p>Toque em uma bolinha para filtrar.</p></div></div>
            <CategoryStories categories={categories} />
          </section>
        ) : null}

        {settings.show_newest && newest.length ? (
          <section className="section simple-section" id="novidades">
            <div className="simple-section-head"><div><h2>Últimos achadinhos</h2><p>Os produtos cadastrados mais recentemente.</p></div></div>
            <ProductGrid products={newest} />
          </section>
        ) : null}

        {settings.show_trending && trending.length ? (
          <section className="section simple-section" id="em-alta">
            <div className="simple-section-head"><div><h2>Mais acessados</h2><p>O que o pessoal mais abriu por aqui.</p></div><Link href="#produtos">Ver todos <Icon name="arrow" size={16} /></Link></div>
            <ProductGrid products={trending} />
          </section>
        ) : null}

        {settings.show_catalog ? (
          <section className="section simple-section catalog-section-clean" id="produtos">
            <div className="simple-section-head"><div><h2>Todos os produtos</h2><p>Pesquise pelo nome ou use os filtros.</p></div></div>
            <ProductExplorer products={products} categories={categories} pageSize={settings.products_per_page || 24} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

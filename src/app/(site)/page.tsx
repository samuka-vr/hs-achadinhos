import Link from "next/link";
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
  const coverflowProducts = [...products].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.click_count - a.click_count).slice(0, 12);
  const categoryCounts = new Map<string, number>();
  products.forEach((product) => categoryCounts.set(product.category_id, (categoryCounts.get(product.category_id) || 0) + 1));

  return (
    <main className="page home-page">
      <div className="container">
        <section className="hero-pro">
          <div className="hero-pro-copy">
            <span className="hero-kicker"><Icon name="sparkles" size={17} />{settings.hero_eyebrow}</span>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
            <div className="hero-actions">
              <a className="button" href="#produtos">{settings.hero_button_text}<Icon name="arrow" size={18} /></a>
              <a className="button secondary" href="#categorias">Ver categorias</a>
            </div>
            <div className="hero-proof">
              <div><strong>{products.length}+</strong><span>produtos organizados</span></div>
              <div><strong>{categories.length}</strong><span>categorias</span></div>
              <div><strong>100%</strong><span>acesso gratuito</span></div>
            </div>
          </div>
          <div className="hero-pro-visual">
            <div className="hero-visual-ring" />
            <div className="hero-logo-card"><img src={settings.hero_image_url || settings.logo_url || "/brand/hs-logo.png"} alt={settings.site_name} /></div>
            <div className="floating-note note-one"><Icon name="check" size={16} /><span>Curadoria organizada</span></div>
            <div className="floating-note note-two"><Icon name="tag" size={16} /><span>Links diretos</span></div>
          </div>
        </section>

        <section className="trust-strip">
          <div><Icon name="search" /><span><strong>Busca rápida</strong><small>Encontre em segundos</small></span></div>
          <div><Icon name="categories" /><span><strong>Bem organizado</strong><small>Categorias intuitivas</small></span></div>
          <div><Icon name="external" /><span><strong>Direto para a Shopee</strong><small>Confira vendedor e avaliações</small></span></div>
          <div><Icon name="sparkles" /><span><strong>Atualizado</strong><small>Novos achadinhos frequentes</small></span></div>
        </section>

        <section className="section category-section" id="categorias">
          <div className="section-head section-head-pro"><div><span className="section-eyebrow">Explore do seu jeito</span><h2>Categorias em destaque</h2><p>Uma organização visual para você chegar mais rápido no que procura.</p></div><Link className="text-link" href="#produtos">Ver catálogo completo <Icon name="arrow" size={17} /></Link></div>
          {categories.length ? <div className="category-grid-pro">{categories.map((category, index) => <Link className={`category-card-pro category-tone-${(index % 4) + 1}`} href={`/categoria/${category.slug}`} key={category.id}>
            <div className="category-card-media">{category.image_url ? <img src={category.image_url} alt={category.name} /> : <span>{category.icon || "✦"}</span>}</div>
            <div><strong>{category.name}</strong><small>{categoryCounts.get(category.id) || 0} produto(s)</small></div>
            <span className="category-arrow"><Icon name="arrow" size={18} /></span>
          </Link>)}</div> : <div className="empty"><Icon name="categories" size={32} /><h3>Nenhuma categoria cadastrada</h3><p>As categorias aparecerão aqui após a configuração inicial.</p></div>}
        </section>

        {settings.coverflow_enabled && coverflowProducts.length ? <section className="section coverflow-section">
          <div className="section-head section-head-centered"><span className="section-eyebrow">Vitrine dinâmica</span><h2>{settings.coverflow_title}</h2><p>{settings.coverflow_subtitle}</p></div>
          <ProductCoverflow products={coverflowProducts} />
        </section> : null}

        <section className="section" id="em-alta">
          <div className="section-head section-head-pro"><div><span className="section-eyebrow">Preferidos do público</span><h2>Achadinhos em alta</h2><p>Os produtos que mais despertaram interesse por aqui.</p></div></div>
          <ProductGrid products={trending} />
        </section>

        <section className="section" id="novidades">
          <div className="section-head section-head-pro"><div><span className="section-eyebrow">Chegaram agora</span><h2>Novidades da semana</h2><p>Os últimos produtos adicionados à nossa curadoria.</p></div></div>
          <ProductGrid products={newest} />
        </section>

        <section className="section catalog-section" id="produtos">
          <div className="section-head section-head-pro"><div><span className="section-eyebrow">Catálogo completo</span><h2>Todos os achadinhos</h2><p>Pesquise, filtre e ordene para encontrar a melhor opção para você.</p></div></div>
          <ProductExplorer products={products} categories={categories} pageSize={settings.products_per_page || 24} />
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryStories from "@/components/CategoryStories";
import Icon from "@/components/Icon";
import ProductExplorer from "@/components/ProductExplorer";
import ProductGrid from "@/components/ProductGrid";
import ProductRail from "@/components/ProductRail";
import HeroProductCarousel from "@/components/HeroProductCarousel";
import SearchBox from "@/components/SearchBox";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Banner, Category, HomeSection, Product } from "@/lib/types";
import { parseSettings, safeNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fallbackSections: HomeSection[] = [
  { id: "hero", section_key: "hero", section_type: "hero", title: "Achou no vídeo? Está aqui.", subtitle: "Pesquise pelo nome ou pelo código que apareceu no vídeo.", eyebrow: "LINK DA BIO", is_enabled: true, sort_order: 10, settings: { show_search: true, layout: "split", show_steps: false }, created_at: "", updated_at: "" },
  { id: "categories", section_key: "categories", section_type: "categories", title: "Encontre por categoria", subtitle: "Um atalho para chegar mais rápido no que você procura.", eyebrow: "", is_enabled: true, sort_order: 20, settings: { limit: 12, style: "stories" }, created_at: "", updated_at: "" },
  { id: "video", section_key: "video-products", section_type: "video_products", title: "Vistos nos últimos vídeos", subtitle: "Os produtos mais recentes aparecem primeiro.", eyebrow: "DOS VÍDEOS", is_enabled: true, sort_order: 30, settings: { limit: 12, layout: "rail" }, created_at: "", updated_at: "" },
  { id: "newest", section_key: "newest", section_type: "newest", title: "Acabaram de chegar", subtitle: "Novos achadinhos adicionados ao catálogo.", eyebrow: "NOVIDADES", is_enabled: true, sort_order: 40, settings: { limit: 8, columns: 4 }, created_at: "", updated_at: "" },
  { id: "trending", section_key: "trending", section_type: "trending", title: "Os mais procurados", subtitle: "Produtos que mais receberam acessos.", eyebrow: "EM ALTA", is_enabled: true, sort_order: 50, settings: { limit: 8, columns: 4 }, created_at: "", updated_at: "" },
  { id: "catalog", section_key: "catalog", section_type: "catalog", title: "Todos os produtos", subtitle: "Busque, filtre e encontre seu próximo achadinho.", eyebrow: "CATÁLOGO", is_enabled: true, sort_order: 60, settings: { page_size: 24 }, created_at: "", updated_at: "" },
];

export default async function HomePage() {
  const supabase = getServerSupabase();
  let products: Product[] = [];
  let categories: Category[] = [];
  let sections: HomeSection[] = fallbackSections;
  let banners: Banner[] = [];
  let settings = parseSettings(null);

  if (supabase) {
    const [p, c, s, h, b] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(500),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
      supabase.from("site_settings").select("key,value"),
      supabase.from("home_sections").select("*").order("sort_order"),
      supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
    ]);
    products = (p.data ?? []) as Product[];
    categories = (c.data ?? []) as Category[];
    settings = parseSettings(s.data);
    if (h.data?.length) sections = h.data as HomeSection[];
    const now = Date.now();
    banners = ((b.data ?? []) as Banner[]).filter((item) => (!item.starts_at || new Date(item.starts_at).getTime() <= now) && (!item.ends_at || new Date(item.ends_at).getTime() >= now));
  }

  const videoProducts = [...products]
    .filter((product) => product.is_video_product || product.is_featured)
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.video_posted_at || b.created_at).getTime() - new Date(a.video_posted_at || a.created_at).getTime());
  const newest = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const trending = [...products].sort((a, b) => b.click_count - a.click_count);
  const heroProducts = [...videoProducts, ...newest.filter((item) => !videoProducts.some((video) => video.id === item.id))].slice(0, 80);

  function SectionHead({ section, id }: { section: HomeSection; id?: string }) {
    return <div className="hs-section-head" id={id}>
      <div>{section.eyebrow ? <span>{section.eyebrow}</span> : null}<h2>{section.title}</h2>{section.subtitle ? <p>{section.subtitle}</p> : null}</div>
      {["newest", "trending", "video_products"].includes(section.section_type) ? <Link href="#produtos">Ver todos <Icon name="arrow" size={16} /></Link> : null}
    </div>;
  }

  return <main className="hs-home"><div className="hs-container">
    {sections.filter((section) => section.is_enabled).sort((a, b) => a.sort_order - b.sort_order).map((section) => {
      if (section.section_type === "hero") return <section className={`hs-hero ${heroProducts.length ? "" : "is-empty"}`} key={section.id}>
        <div className="hs-hero-copy">
          <span className="hs-kicker"><Icon name="sparkles" size={14} />{section.eyebrow || "LINK DA BIO"}</span>
          <h1>{section.title || settings.hero_title}</h1>
          <p>{section.subtitle || settings.hero_subtitle}</p>
          {Boolean(section.settings.show_search ?? true) ? <SearchBox variant="hero" /> : null}
          <div className="hs-hero-chips"><a href="#produtos-dos-videos">Últimos vídeos</a><a href="#categorias">Categorias</a><a href="#produtos">Todos os produtos</a></div>
        </div>
        <HeroProductCarousel products={heroProducts} interval={settings.carousel_speed} />
      </section>;

      if (section.section_type === "banners") return banners.length ? <section className="hs-section hs-banner-section" key={section.id}><BannerCarousel banners={banners} autoplay={Boolean(section.settings.autoplay ?? true)} interval={safeNumber(section.settings.interval, 5000)} height={String(section.settings.height || "medium")} /></section> : null;

      if (section.section_type === "categories") {
        const limit = safeNumber(section.settings.limit, 12);
        const variant = String(section.settings.style || "stories") === "cards" ? "cards" : "stories";
        return categories.length ? <section className="hs-section hs-category-section" key={section.id}><SectionHead section={section} id="categorias" /><CategoryStories categories={categories.slice(0, limit)} variant={variant} /></section> : null;
      }

      if (section.section_type === "video_products") {
        const limit = safeNumber(section.settings.limit, 12);
        const layout = String(section.settings.layout || "rail");
        return videoProducts.length ? <section className="hs-section" id="produtos-dos-videos" key={section.id}><SectionHead section={section} />{layout === "grid" ? <ProductGrid products={videoProducts.slice(0, limit)} columns={safeNumber(section.settings.columns, 4)} /> : <ProductRail products={videoProducts.slice(0, limit)} autoplay={Boolean(section.settings.autoplay ?? true)} interval={safeNumber(section.settings.interval, settings.carousel_speed)} />}</section> : null;
      }

      if (section.section_type === "newest") {
        const limit = safeNumber(section.settings.limit, 8);
        return newest.length ? <section className="hs-section" key={section.id}><SectionHead section={section} id="novidades" /><ProductGrid products={newest.slice(0, limit)} columns={safeNumber(section.settings.columns, 4)} /></section> : null;
      }

      if (section.section_type === "trending") {
        const limit = safeNumber(section.settings.limit, 8);
        return trending.length ? <section className="hs-section" key={section.id}><SectionHead section={section} id="mais-acessados" /><ProductGrid products={trending.slice(0, limit)} columns={safeNumber(section.settings.columns, 4)} /></section> : null;
      }

      if (section.section_type === "catalog") return <section className="hs-section hs-catalog" id="produtos" key={section.id}><SectionHead section={section} /><ProductExplorer products={products} categories={categories} pageSize={safeNumber(section.settings.page_size, settings.products_per_page || 24)} showSearch={false} /></section>;

      if (section.section_type === "custom_text") return <section className={`hs-section hs-custom-block align-${String(section.settings.alignment || "left")}`} key={section.id}><SectionHead section={section} />{section.settings.body ? <div>{String(section.settings.body)}</div> : null}{section.settings.button_text ? <a className="hs-button" href={String(section.settings.button_url || "#produtos")}>{String(section.settings.button_text)}<Icon name="arrow" size={16} /></a> : null}</section>;
      return null;
    })}
  </div></main>;
}

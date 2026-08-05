import Link from "next/link";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryStories from "@/components/CategoryStories";
import HeroProductCarousel from "@/components/HeroProductCarousel";
import Icon, { type IconName } from "@/components/Icon";
import ProductExplorer from "@/components/ProductExplorer";
import ProductGrid from "@/components/ProductGrid";
import ProductRail from "@/components/ProductRail";
import SearchBox from "@/components/SearchBox";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Banner, Category, HomeSection, Product } from "@/lib/types";
import { parseSettings, safeNumber } from "@/lib/utils";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

export const dynamic = "force-dynamic";

const fallbackSections: HomeSection[] = [
  { id: "hero", section_key: "hero", section_type: "hero", title: "Viu no vídeo? Encontre aqui.", subtitle: "Pesquise pelo nome ou código e abra o produto certo na Shopee.", eyebrow: "SEU ATALHO PARA OS ACHADOS", is_enabled: true, sort_order: 10, settings: { show_search: true }, created_at: "", updated_at: "" },
  { id: "categories", section_key: "categories", section_type: "categories", title: "Escolha uma categoria", subtitle: "Os produtos ficam organizados para você chegar mais rápido.", eyebrow: "EXPLORE POR ÁREA", is_enabled: true, sort_order: 20, settings: { limit: 7 }, created_at: "", updated_at: "" },
  { id: "video", section_key: "video-products", section_type: "video_products", title: "Produtos dos últimos vídeos", subtitle: "Os links que acabaram de aparecer nas redes.", eyebrow: "DIRETO DO FEED", is_enabled: true, sort_order: 30, settings: { limit: 12, layout: "rail" }, created_at: "", updated_at: "" },
  { id: "newest", section_key: "newest", section_type: "newest", title: "Novidades no catálogo", subtitle: "Achados adicionados recentemente.", eyebrow: "ACABARAM DE CHEGAR", is_enabled: true, sort_order: 40, settings: { limit: 8, columns: 4 }, created_at: "", updated_at: "" },
  { id: "trending", section_key: "trending", section_type: "trending", title: "Mais procurados", subtitle: "Produtos que estão recebendo mais acessos.", eyebrow: "EM ALTA", is_enabled: true, sort_order: 50, settings: { limit: 8, columns: 4 }, created_at: "", updated_at: "" },
  { id: "catalog", section_key: "catalog", section_type: "catalog", title: "Todos os achados", subtitle: "Use os filtros para encontrar o que precisa.", eyebrow: "CATÁLOGO COMPLETO", is_enabled: true, sort_order: 60, settings: { page_size: 24 }, created_at: "", updated_at: "" },
];

function SectionHeading({ section, id, action }: { section: HomeSection; id?: string; action?: string }) {
  return <header className="hs-section-heading" id={id}><div><span>{section.eyebrow}</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>{action ? <Link href={action}>Ver tudo <Icon name="arrow" size={16} /></Link> : null}</header>;
}

export default async function HomePage() {
  const supabase = getServerSupabase();
  let products: Product[] = [];
  let categories: Category[] = [];
  let sections: HomeSection[] = fallbackSections;
  let banners: Banner[] = [];
  let settings = parseSettings(null);

  if (supabase) {
    const [productResult, categoryResult, settingsResult, sectionResult, bannerResult] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(240),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
      supabase.from("site_settings").select("key,value"),
      supabase.from("home_sections").select("*").order("sort_order"),
      supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
    ]);
    products = (productResult.data ?? []) as Product[];
    categories = (categoryResult.data ?? []) as Category[];
    settings = parseSettings(settingsResult.data);
    if (sectionResult.data?.length) sections = sectionResult.data as HomeSection[];
    const now = Date.now();
    banners = ((bannerResult.data ?? []) as Banner[]).filter((item) => (!item.starts_at || new Date(item.starts_at).getTime() <= now) && (!item.ends_at || new Date(item.ends_at).getTime() >= now));
  }

  const videoProducts = [...products].filter((product) => product.is_video_product || product.is_featured).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.video_posted_at || b.created_at).getTime() - new Date(a.video_posted_at || a.created_at).getTime());
  const newest = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const trending = [...products].sort((a, b) => b.click_count - a.click_count);
  const heroProducts = [...videoProducts, ...newest.filter((item) => !videoProducts.some((video) => video.id === item.id))].filter((item) => Boolean(item.image_url?.trim())).slice(0, 40);
  const enabled = sections.filter((section) => section.is_enabled).sort((a, b) => a.sort_order - b.sort_order);
  const socials: Array<[string, string, IconName]> = [[settings.instagram, "Instagram", "instagram"], [settings.tiktok, "TikTok", "tiktok"], [settings.shopee_showcase, "Shopee", "store"], [settings.whatsapp, "WhatsApp", "whatsapp"]];
  const activeSocials = socials.filter(([url]) => isSafePublicUrl(url));

  return <main className="hs-home">
    <div className="hs-shell">
      {enabled.map((section) => {
        if (section.section_type === "hero") return <section className="hs-hero" key={section.id}>
          <div className="hs-hero__copy">
            <span className="hs-hero__eyebrow"><Icon name="sparkles" size={15} />{section.eyebrow || "SEU ATALHO PARA OS ACHADOS"}</span>
            <h1>{section.title || settings.hero_title}</h1>
            <p>{section.subtitle || settings.hero_subtitle}</p>
            {Boolean(section.settings.show_search ?? true) ? <SearchBox variant="hero" /> : null}
            <div className="hs-hero__quick-links"><a href="#produtos-dos-videos"><span><Icon name="sparkles" /></span><div><strong>Dos vídeos</strong><small>Links recentes</small></div></a><a href="#categorias"><span><Icon name="categories" /></span><div><strong>Categorias</strong><small>Escolha uma área</small></div></a><a href="#produtos"><span><Icon name="products" /></span><div><strong>Catálogo</strong><small>Ver tudo</small></div></a></div>
            <div className="hs-hero__trust"><span><Icon name="search" size={15} />Busque pelo código</span><span><Icon name="external" size={15} />Abra direto na Shopee</span></div>
          </div>
          <div className="hs-hero__spotlight"><div className="hs-hero__spotlight-head"><span>Destaque de agora</span><small>Arraste para o lado</small></div><HeroProductCarousel products={heroProducts} interval={settings.carousel_speed} /></div>
        </section>;

        if (section.section_type === "banners") return banners.length ? <section className="hs-section" key={section.id}><BannerCarousel banners={banners} autoplay={Boolean(section.settings.autoplay ?? true)} interval={safeNumber(section.settings.interval, 5000)} height={String(section.settings.height || "medium")} /></section> : null;
        if (section.section_type === "categories") return categories.length ? <section className="hs-section hs-section--categories" key={section.id}><SectionHeading section={section} id="categorias" /><CategoryStories categories={categories.slice(0, safeNumber(section.settings.limit, 7))} /></section> : null;
        if (section.section_type === "video_products") return videoProducts.length ? <section className="hs-section hs-section--video" id="produtos-dos-videos" key={section.id}><SectionHeading section={section} action="#produtos" />{String(section.settings.layout || "rail") === "grid" ? <ProductGrid products={videoProducts.slice(0, safeNumber(section.settings.limit, 12))} columns={safeNumber(section.settings.columns, 4)} /> : <ProductRail products={videoProducts.slice(0, safeNumber(section.settings.limit, 12))} autoplay={Boolean(section.settings.autoplay ?? true)} interval={safeNumber(section.settings.interval, settings.carousel_speed)} />}</section> : null;
        if (section.section_type === "newest") return newest.length ? <section className="hs-section" key={section.id}><SectionHeading section={section} id="novidades" action="#produtos" /><ProductRail products={newest.slice(0, safeNumber(section.settings.limit, 8))} autoplay={false} /></section> : null;
        if (section.section_type === "trending") return trending.some((item) => item.click_count > 0) ? <section className="hs-section hs-section--tinted" key={section.id}><SectionHeading section={section} id="mais-acessados" action="#produtos" /><ProductRail products={trending.filter((item) => item.click_count > 0).slice(0, safeNumber(section.settings.limit, 8))} autoplay={false} /></section> : null;
        if (section.section_type === "catalog") return <section className="hs-section hs-section--catalog" id="produtos" key={section.id}><SectionHeading section={section} /><ProductExplorer products={products} categories={categories} pageSize={safeNumber(section.settings.page_size, settings.products_per_page || 24)} showSearch={false} /></section>;
        if (section.section_type === "custom_text") return <section className="hs-section hs-custom-block" key={section.id}><SectionHeading section={section} />{section.settings.body ? <div>{String(section.settings.body)}</div> : null}{section.settings.button_text ? <a className="hs-primary-button" href={safePublicHref(String(section.settings.button_url || "#produtos"), "#produtos")}>{String(section.settings.button_text)}<Icon name="arrow" size={16} /></a> : null}</section>;
        return null;
      })}
      {activeSocials.length ? <section className="hs-social-banner"><div><span>ACOMPANHE A H&S</span><h2>Os próximos achados aparecem primeiro nas redes.</h2><p>Veja os vídeos e volte para encontrar o link certo.</p></div><nav>{activeSocials.map(([url, label, icon]) => <a href={safePublicHref(url)} target="_blank" rel="noopener noreferrer" key={label}><Icon name={icon} /><span>{label}</span></a>)}</nav></section> : null}
    </div>
  </main>;
}

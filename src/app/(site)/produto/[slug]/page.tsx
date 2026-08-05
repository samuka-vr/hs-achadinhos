import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import ProductGallery from "@/components/ProductGallery";
import ShareButton from "@/components/ShareButton";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { getProductPriceDisplay } from "@/lib/utils";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) return { title: "Produto" };
  const { data } = await supabase.from("products").select("name,short_description,image_url,seo_title,seo_description").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) return { title: "Produto não encontrado" };
  const title = data.seo_title || data.name;
  const description = data.seo_description || data.short_description || `Confira ${data.name} na H&S Achadinhos.`;
  return { title, description, openGraph: { title, description, images: data.image_url ? [data.image_url] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();
  const { data } = await supabase.from("products").select("*,categories(id,name,slug),product_images(*)").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  const relatedResult = await supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).eq("category_id", product.category_id).neq("id", product.id).limit(8);
  const related = (relatedResult.data ?? []) as Product[];
  const price = getProductPriceDisplay(product);

  return <main className="hs-inner-page hs-product-page"><div className="hs-shell">
    <nav className="hs-breadcrumbs"><Link href="/">Início</Link><Icon name="arrow" size={13} /><Link href={`/categoria/${product.categories?.slug}`}>{product.categories?.name || "Categoria"}</Link><Icon name="arrow" size={13} /><strong>{product.name}</strong></nav>
    <section className="hs-product-detail">
      <div className="hs-product-detail__media"><ProductGallery name={product.name} cover={product.image_url} images={product.product_images || []} /></div>
      <div className="hs-product-detail__info">
        <div className="hs-product-detail__labels">{product.is_video_product ? <span><Icon name="sparkles" size={14} />Visto no vídeo</span> : null}{product.is_pinned ? <b>Destaque H&S</b> : null}</div>
        <Link className="hs-product-detail__category" href={`/categoria/${product.categories?.slug}`}>{product.categories?.name || "Achadinho"}</Link>
        <h1>{product.name}</h1>
        {product.product_code ? <div className="hs-product-detail__code"><span>Código do vídeo</span><strong>{product.product_code}</strong></div> : null}
        <div className={`hs-product-detail__price is-${price.mode}`}><strong>{price.main}</strong>{price.secondary ? <del>{price.secondary}</del> : null}</div>
        {product.short_description ? <p className="hs-product-detail__description">{product.short_description}</p> : null}
        {product.tags?.length ? <div className="hs-product-detail__tags">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
        <div className="hs-product-detail__actions"><a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver na Shopee <Icon name="external" size={18} /></a><ShareButton title={product.name} /></div>
        {product.video_url && isSafePublicUrl(product.video_url) ? <a className="hs-product-detail__video" href={safePublicHref(product.video_url)} target="_blank" rel="noopener noreferrer"><Icon name="tiktok" />Ver o vídeo deste produto</a> : null}
        <div className="hs-product-detail__notes"><div><Icon name="shield" /><span><strong>Compra segura na Shopee</strong><small>Pagamento, frete e estoque são confirmados na plataforma.</small></span></div><div><Icon name="click" /><span><strong>{product.click_count} acesso(s)</strong><small>Preço e disponibilidade podem mudar.</small></span></div></div>
      </div>
    </section>
    <section className="hs-section hs-related"><header className="hs-section-heading"><div><span>OUTRAS OPÇÕES</span><h2>Da mesma categoria</h2><p>Veja outros achados parecidos.</p></div></header><ProductGrid products={related} emptyTitle="Ainda não há produtos relacionados" /></section>
  </div></main>;
}

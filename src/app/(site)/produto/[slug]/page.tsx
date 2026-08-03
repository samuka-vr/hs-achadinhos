import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import ShareButton from "@/components/ShareButton";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) return { title: "Produto" };
  const { data } = await supabase.from("products").select("name,short_description,image_url").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) return { title: "Produto não encontrado" };
  return { title: data.name, description: data.short_description || `Confira ${data.name} na seleção da H&S Achadinhos.`, openGraph: { title: data.name, description: data.short_description || undefined, images: data.image_url ? [data.image_url] : [] } };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();
  const { data } = await supabase.from("products").select("*,categories(id,name,slug)").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  const relatedResult = await supabase.from("products").select("*,categories(id,name,slug)").eq("is_active", true).eq("category_id", product.category_id).neq("id", product.id).limit(4);
  const related = (relatedResult.data ?? []) as Product[];
  const discount = discountPercentage(product.current_price, product.old_price);
  const productSchema = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.image_url || undefined, description: product.short_description || undefined, offers: product.current_price !== null ? { "@type": "Offer", priceCurrency: "BRL", price: product.current_price, availability: "https://schema.org/InStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/go/${product.id}` } : undefined };

  return (
    <main className="page product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="container">
        <nav className="breadcrumbs"><Link href="/">Início</Link><span>/</span><Link href={`/categoria/${product.categories?.slug}`}>{product.categories?.name ?? "Categoria"}</Link><span>/</span><strong>{product.name}</strong></nav>
        <div className="product-detail-pro">
          <div className="product-detail-media-pro">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="product-placeholder"><Icon name="image" size={38} /><span>Sem imagem</span></div>}{product.badge ? <span className="product-badge">{product.badge}</span> : null}{discount ? <span className="detail-discount">-{discount}%</span> : null}</div>
          <div className="product-detail-copy">
            <Link className="product-category" href={`/categoria/${product.categories?.slug}`}>{product.categories?.name ?? "Achadinho"}</Link>
            <h1>{product.name}</h1>
            <div className="detail-interest"><Icon name="click" size={17} />{product.click_count > 0 ? `${product.click_count} pessoa(s) demonstraram interesse` : "Novo produto na nossa curadoria"}</div>
            <div className="price-row detail-price-row">{product.current_price !== null ? <span className="current-price">{formatPrice(product.current_price)}</span> : <span className="current-price">Confira o preço</span>}{product.old_price !== null ? <span className="old-price">{formatPrice(product.old_price)}</span> : null}</div>
            {product.short_description ? <p className="detail-description">{product.short_description}</p> : null}
            {product.tags?.length ? <div className="detail-tags">{product.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
            <div className="product-detail-actions"><a className="button detail-main-button" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver oferta na Shopee <Icon name="external" size={18} /></a><ShareButton title={product.name} /></div>
            <div className="detail-benefits"><div><Icon name="check" /><span><strong>Compra na Shopee</strong><small>Você finaliza diretamente na plataforma.</small></span></div><div><Icon name="search" /><span><strong>Confira antes de comprar</strong><small>Veja avaliações, frete, estoque e vendedor.</small></span></div></div>
            <div className="notice">O preço, o estoque e as condições podem mudar na Shopee. Confira as informações finais na página do vendedor antes da compra.</div>
          </div>
        </div>
        <section className="section"><div className="section-head section-head-pro"><div><span className="section-eyebrow">Continue explorando</span><h2>Você também pode gostar</h2><p>Outros produtos da mesma categoria.</p></div></div><ProductGrid products={related} emptyTitle="Ainda não há produtos relacionados" /></section>
      </div>
    </main>
  );
}

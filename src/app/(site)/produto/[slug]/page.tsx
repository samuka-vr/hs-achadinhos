import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import ProductGallery from "@/components/ProductGallery";
import ShareButton from "@/components/ShareButton";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

function displayPrice(product: Product) {
  const current = formatPrice(product.current_price);
  const secondary = formatPrice(product.old_price);
  const promotional = /oferta|desconto|promo/i.test(product.badge || "");

  if (!current) return { main: "Confira o preço na Shopee", secondary: "", label: "" };
  if (secondary && product.old_price && product.current_price && product.old_price > product.current_price) {
    if (promotional) return { main: current, secondary, label: "Preço promocional" };
    return { main: `${current} a ${secondary}`, secondary: "", label: "Faixa de preço" };
  }
  if (/a partir/i.test(product.badge || "")) return { main: `A partir de ${current}`, secondary: "", label: "" };
  return { main: current, secondary: "", label: "" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) return { title: "Produto" };

  const { data } = await supabase
    .from("products")
    .select("name,short_description,image_url,seo_title,seo_description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Produto não encontrado" };
  const title = data.seo_title || data.name;
  const description = data.seo_description || data.short_description || `Confira ${data.name} na H&S Achadinhos.`;
  return { title, description, openGraph: { title, description, images: data.image_url ? [data.image_url] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();

  const { data } = await supabase
    .from("products")
    .select("*,categories(id,name,slug),product_images(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;
  const relatedResult = await supabase
    .from("products")
    .select("*,categories(id,name,slug)")
    .eq("is_active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(8);
  const related = (relatedResult.data ?? []) as Product[];
  const price = displayPrice(product);

  return (
    <main className="product-page-v5">
      <div className="container-v5">
        <nav className="breadcrumbs-v5">
          <Link href="/">Início</Link><span>›</span>
          <Link href={`/categoria/${product.categories?.slug}`}>{product.categories?.name || "Categoria"}</Link><span>›</span>
          <strong>{product.name}</strong>
        </nav>

        <div className="product-detail-v5">
          <div className="product-gallery-shell-v5">
            <ProductGallery name={product.name} cover={product.image_url} images={product.product_images || []} />
          </div>

          <div className="product-info-v5">
            <div className="product-detail-labels-v5">
              {product.is_video_product ? <span>Produto do vídeo</span> : null}
              {product.badge ? <span>{product.badge}</span> : null}
              {product.is_pinned ? <b>Destaque H&S</b> : null}
            </div>

            <Link className="product-category-v5" href={`/categoria/${product.categories?.slug}`}>{product.categories?.name || "Achadinho"}</Link>
            <h1>{product.name}</h1>

            {product.product_code ? (
              <div className="product-detail-code-v5"><span>Código para buscar</span><strong>{product.product_code}</strong></div>
            ) : null}

            <div className="product-detail-price-v5">
              <strong>{price.main}</strong>
              {price.secondary ? <del>{price.secondary}</del> : null}
              {price.label ? <small>{price.label}</small> : null}
            </div>

            {product.short_description ? <p className="product-detail-description-v5">{product.short_description}</p> : null}
            {product.tags?.length ? <div className="product-tags-v5">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}

            <div className="product-detail-actions-v5">
              <a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver produto na Shopee <Icon name="external" size={18} /></a>
              <ShareButton title={product.name} />
            </div>

            {product.video_url ? (
              <a className="video-source-v5" href={product.video_url} target="_blank" rel="noreferrer"><Icon name="tiktok" />Ver o vídeo deste produto</a>
            ) : null}

            <div className="product-notes-v5">
              <div><Icon name="shield" /><span><strong>Compra finalizada na Shopee</strong><small>Frete, estoque e pagamento são conferidos por lá.</small></span></div>
              <div><Icon name="click" /><span><strong>{product.click_count} acesso(s)</strong><small>O preço e a disponibilidade podem mudar sem aviso.</small></span></div>
            </div>
          </div>
        </div>

        <section className="section-v5">
          <div className="section-head-v5"><div><span>MAIS OPÇÕES</span><h2>Da mesma categoria</h2><p>Outros produtos que podem interessar.</p></div></div>
          <ProductGrid products={related} emptyTitle="Ainda não há produtos relacionados" />
        </section>
      </div>
    </main>
  );
}

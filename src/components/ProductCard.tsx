import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

function productPrice(product: Product) {
  const current = formatPrice(product.current_price);
  const secondary = formatPrice(product.old_price);
  const promotional = /oferta|desconto|promo/i.test(product.badge || "");

  if (!current) return { main: "Ver preço na Shopee", secondary: "", mode: "hidden" };
  if (secondary && product.old_price && product.current_price && product.old_price > product.current_price) {
    if (promotional) return { main: current, secondary, mode: "promotion" };
    return { main: `${current} a ${secondary}`, secondary: "", mode: "range" };
  }
  if (/a partir/i.test(product.badge || "")) return { main: `A partir de ${current}`, secondary: "", mode: "from" };
  return { main: current, secondary: "", mode: "fixed" };
}

export default function ProductCard({ product }: { product: Product }) {
  const price = productPrice(product);

  return (
    <article className="hs-product-card">
      <Link className="hs-product-media" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
        <SafeProductImage src={product.image_url} alt={product.name} />
        <div className="hs-product-badges">
          {product.is_video_product ? <span>Visto no vídeo</span> : product.badge ? <span>{product.badge}</span> : null}
          {product.is_pinned ? <b>Destaque</b> : null}
        </div>
      </Link>

      <div className="hs-product-body">
        <div className="hs-product-topline">
          <span>{product.categories?.name || "Achadinho"}</span>
          {product.product_code ? <b>{product.product_code}</b> : null}
        </div>

        <h3><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>

        <div className={`hs-product-price price-${price.mode}`}>
          <strong>{price.main}</strong>
          {price.secondary ? <del>{price.secondary}</del> : null}
        </div>

        <div className="hs-product-card-actions">
          <Link className="hs-product-details" href={`/produto/${product.slug}`}>Ver detalhes</Link>
          <a className="hs-product-cta" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener" aria-label={`Ver ${product.name} na Shopee`}>
            <span>Ver na Shopee</span>
            <Icon name="external" size={15} />
          </a>
        </div>
        <span className="hs-product-clicks">{product.click_count} acesso(s)</span>
      </div>
    </article>
  );
}

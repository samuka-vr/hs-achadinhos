import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductPriceDisplay } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const price = getProductPriceDisplay(product);
  return (
    <article className="hs-product-card">
      <Link className="hs-product-card__media" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
        <SafeProductImage src={product.image_url} alt={product.name} />
        <div className="hs-product-card__badges">
          {product.is_video_product ? <span><Icon name="sparkles" size={13} />Visto no vídeo</span> : null}
          {product.is_pinned ? <b>Destaque</b> : null}
        </div>
      </Link>
      <div className="hs-product-card__body">
        <div className="hs-product-card__meta">
          <span>{product.categories?.name || "Achadinho"}</span>
          {product.product_code ? <b>{product.product_code}</b> : null}
        </div>
        <h3><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
        <div className={`hs-product-card__price is-${price.mode}`}>
          <strong>{price.main}</strong>
          {price.secondary ? <del>{price.secondary}</del> : null}
        </div>
        <div className="hs-product-card__actions">
          <Link href={`/produto/${product.slug}`}>Detalhes</Link>
          <a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">
            Shopee <Icon name="external" size={15} />
          </a>
        </div>
      </div>
    </article>
  );
}

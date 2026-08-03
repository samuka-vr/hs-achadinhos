import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercentage(product.current_price, product.old_price);
  return (
    <article className="product-card">
      <Link className="product-card-media-link" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
        <div className="product-image-wrap">
          {product.image_url ? <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" /> : <div className="product-placeholder"><Icon name="image" size={30} /><span>Sem imagem</span></div>}
          <div className="product-card-flags">
            {product.badge ? <span className="product-badge">{product.badge}</span> : null}
            {discount ? <span className="discount-badge">-{discount}%</span> : null}
          </div>
        </div>
      </Link>
      <div className="product-content">
        <span className="product-category">{product.categories?.name ?? "Achadinho"}</span>
        <h3 className="product-title"><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
        <div className="price-row">
          {product.current_price !== null ? <span className="current-price">{formatPrice(product.current_price)}</span> : <span className="current-price price-callout">Confira o preço</span>}
          {product.old_price !== null ? <span className="old-price">{formatPrice(product.old_price)}</span> : null}
        </div>
        <div className="product-card-footer">
          <span className="product-clicks"><Icon name="click" size={15} />{product.click_count > 0 ? `${product.click_count} interesse(s)` : "Novo achadinho"}</span>
          <a className="product-offer-button" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver oferta <Icon name="arrow" size={17} /></a>
        </div>
      </div>
    </article>
  );
}

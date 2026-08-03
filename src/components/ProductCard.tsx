import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercentage(product.current_price, product.old_price);
  return (
    <article className="product-card clean-product-card">
      <Link className="product-card-media-link" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
        <div className="product-image-wrap">
          {product.image_url ? <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" /> : <div className="product-placeholder"><Icon name="image" size={28} /><span>Sem imagem</span></div>}
          {product.badge || discount ? <div className="clean-product-flags">{product.badge ? <span>{product.badge}</span> : null}{discount ? <b>-{discount}%</b> : null}</div> : null}
        </div>
      </Link>
      <div className="product-content">
        <small>{product.categories?.name ?? "Achadinho"}</small>
        <h3 className="product-title"><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
        <div className="price-row">{product.current_price !== null ? <span className="current-price">{formatPrice(product.current_price)}</span> : <span className="current-price price-callout">Ver preço</span>}{product.old_price !== null ? <span className="old-price">{formatPrice(product.old_price)}</span> : null}</div>
        <a className="clean-product-action" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Abrir na Shopee <Icon name="external" size={16} /></a>
      </div>
    </article>
  );
}

import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
        <div className="product-image-wrap">
          {product.image_url ? (
            <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-placeholder">Sem imagem</div>
          )}
          {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        </div>
      </Link>
      <div className="product-content">
        <span className="product-category">{product.categories?.name ?? "Achadinho"}</span>
        <h3 className="product-title"><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
        <div className="price-row">
          {product.current_price !== null ? <span className="current-price">{formatPrice(product.current_price)}</span> : <span className="current-price">Ver preço</span>}
          {product.old_price !== null ? <span className="old-price">{formatPrice(product.old_price)}</span> : null}
        </div>
        <div className="product-actions">
          <a className="button small" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver oferta</a>
          <Link className="button secondary small" href={`/produto/${product.slug}`} aria-label="Ver detalhes">Detalhes</Link>
        </div>
      </div>
    </article>
  );
}

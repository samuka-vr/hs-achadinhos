import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercentage(product.current_price, product.old_price);
  return <article className="product-card-v5">
    <Link className="product-card-image-v5" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
      {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <div className="product-placeholder-v5"><Icon name="image" size={28}/><span>Sem imagem</span></div>}
      <div className="product-flags-v5">{product.is_video_product ? <span>Do vídeo</span> : null}{product.badge ? <span>{product.badge}</span> : null}{discount ? <b>-{discount}%</b> : null}</div>
      {product.is_pinned ? <i className="product-pin-v5">Fixado</i> : null}
    </Link>
    <div className="product-card-body-v5">
      <div className="product-card-meta-v5"><span>{product.categories?.name || "Achadinho"}</span>{product.product_code ? <b className="product-code-v5">Cód. {product.product_code}</b> : null}</div>
      <h3><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
      <div className="product-price-v5">{product.current_price !== null ? <strong>{formatPrice(product.current_price)}</strong> : <strong>Ver preço</strong>}{product.old_price !== null ? <del>{formatPrice(product.old_price)}</del> : null}</div>
      <span className="product-clicks-v5">{product.click_count} acesso(s)</span>
      <a className="product-action-v5" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Ver na Shopee <Icon name="external" size={15}/></a>
    </div>
  </article>;
}

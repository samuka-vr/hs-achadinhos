import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercentage(product.current_price, product.old_price);
  return <article className="hs-product-card">
    <Link className="hs-product-media" href={`/produto/${product.slug}`} aria-label={`Abrir ${product.name}`}>
      {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <div className="hs-product-placeholder"><Icon name="image" size={28} /><span>Adicione uma imagem</span></div>}
      <div className="hs-product-badges">
        {product.is_video_product ? <span>Visto no vídeo</span> : product.badge ? <span>{product.badge}</span> : null}
        {discount ? <b>-{discount}%</b> : null}
      </div>
    </Link>
    <div className="hs-product-body">
      <div className="hs-product-topline"><span>{product.categories?.name || "Achadinho"}</span>{product.product_code ? <b>Cód. {product.product_code}</b> : null}</div>
      <h3><Link href={`/produto/${product.slug}`}>{product.name}</Link></h3>
      <div className="hs-product-price"><div>{product.current_price !== null ? <strong>{formatPrice(product.current_price)}</strong> : <strong>Ver preço</strong>}{product.old_price !== null ? <del>{formatPrice(product.old_price)}</del> : null}</div></div>
      <a className="hs-product-cta" href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener" aria-label={`Ver ${product.name} na Shopee`}><span>Ver oferta</span><Icon name="external" size={15} /></a>
      <span className="hs-product-clicks">{product.click_count} acesso(s)</span>
    </div>
  </article>;
}

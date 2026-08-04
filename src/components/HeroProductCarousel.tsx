"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

export default function HeroProductCarousel({
  products,
  interval = 5200,
}: {
  products: Product[];
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (products.length < 2 || paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % products.length),
      Math.max(3500, interval),
    );
    return () => window.clearInterval(timer);
  }, [products.length, paused, interval]);

  if (!products.length) return null;

  const select = (index: number) => {
    const normalized = (index + products.length) % products.length;
    setActive(normalized);
  };

  return (
    <section
      className="hs-hero-carousel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hs-hero-slides" aria-live="polite">
        {products.map((product, index) => {
          const discount = discountPercentage(product.current_price, product.old_price);
          return (
            <article
              className={`hs-hero-slide ${index === active ? "is-active" : ""}`}
              aria-hidden={index !== active}
              key={product.id}
            >
              <Link className="hs-hero-product-image" href={`/produto/${product.slug}`} tabIndex={index === active ? 0 : -1}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <span className="hs-hero-product-placeholder"><Icon name="image" size={34} /></span>
                )}
                <span className="hs-hero-product-label">{product.is_video_product ? "Visto no vídeo" : "Achadinho recente"}</span>
                {discount ? <b className="hs-hero-product-discount">-{discount}%</b> : null}
              </Link>

              <div className="hs-hero-product-copy">
                <span>{product.categories?.name || "Achadinho"}</span>
                <h2>{product.name}</h2>
                <div className="hs-hero-product-price">
                  <strong>{formatPrice(product.current_price) || "Confira o preço"}</strong>
                  {product.old_price ? <del>{formatPrice(product.old_price)}</del> : null}
                </div>
                {product.product_code ? <small>Código {product.product_code}</small> : null}
                <div className="hs-hero-product-actions">
                  <Link href={`/produto/${product.slug}`} tabIndex={index === active ? 0 : -1}>Ver detalhes</Link>
                  <a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener" tabIndex={index === active ? 0 : -1}>
                    Ver na Shopee <Icon name="external" size={14} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {products.length > 1 ? (
        <div className="hs-hero-carousel-controls">
          <button type="button" onClick={() => select(active - 1)} aria-label="Produto anterior"><Icon name="arrow" size={17} /></button>
          <div className="hs-hero-carousel-dots" aria-label="Escolher produto">
            {products.map((product, index) => (
              <button
                type="button"
                className={index === active ? "is-active" : ""}
                onClick={() => select(index)}
                aria-label={`Mostrar ${product.name}`}
                aria-current={index === active ? "true" : undefined}
                key={product.id}
              />
            ))}
          </div>
          <button type="button" onClick={() => select(active + 1)} aria-label="Próximo produto"><Icon name="arrow" size={17} /></button>
        </div>
      ) : null}
    </section>
  );
}

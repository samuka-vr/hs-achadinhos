"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Icon from "./Icon";

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export default function ProductCoverflow({
  products,
  speed = 4200,
  randomize = false,
}: {
  products: Product[];
  speed?: number;
  randomize?: boolean;
}) {
  const available = useMemo(() => products.filter((item) => item.image_url).slice(0, 14), [products]);
  const [items, setItems] = useState<Product[]>(available);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setItems(randomize ? shuffle(available) : available);
    setActive(0);
  }, [available, randomize]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), Math.max(2500, speed));
    return () => window.clearInterval(timer);
  }, [items.length, paused, speed]);

  if (!items.length) return null;
  const current = items[active];
  const previous = items[(active - 1 + items.length) % items.length];
  const next = items[(active + 1) % items.length];

  return (
    <div
      className="product-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {items.length > 1 ? (
        <button type="button" className="slider-side-card slider-side-left" onClick={() => setActive((active - 1 + items.length) % items.length)} aria-label="Produto anterior">
          <img src={previous.image_url || ""} alt="" />
        </button>
      ) : null}

      <article className="slider-main-card">
        <Link href={`/produto/${current.slug}`} aria-label={`Abrir ${current.name}`}>
          <div className="slider-main-media">
            <img src={current.image_url || ""} alt={current.name} />
            {current.is_featured ? <span>Do vídeo</span> : current.badge ? <span>{current.badge}</span> : null}
          </div>
          <div className="slider-main-copy">
            <small>{current.is_featured ? "Link em destaque" : current.categories?.name || "Achadinho"}</small>
            <h3>{current.name}</h3>
            <div>
              <strong>{formatPrice(current.current_price) || "Ver preço na Shopee"}</strong>
              <b>Ver produto <Icon name="arrow" size={17} /></b>
            </div>
          </div>
        </Link>
      </article>

      {items.length > 1 ? (
        <button type="button" className="slider-side-card slider-side-right" onClick={() => setActive((active + 1) % items.length)} aria-label="Próximo produto">
          <img src={next.image_url || ""} alt="" />
        </button>
      ) : null}

      {items.length > 1 ? (
        <div className="slider-dots" aria-label="Escolher produto">
          {items.map((item, index) => <button key={item.id} type="button" className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Abrir produto ${index + 1}`} />)}
        </div>
      ) : null}
    </div>
  );
}

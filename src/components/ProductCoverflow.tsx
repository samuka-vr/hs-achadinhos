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

export default function ProductCoverflow({ products }: { products: Product[] }) {
  const base = useMemo(() => products.filter((item) => item.image_url).slice(0, 12), [products]);
  const [items, setItems] = useState(base);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => { setItems(shuffle(base)); setActive(0); }, [base]);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 4200);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (!items.length) return null;

  function relative(index: number) {
    let distance = index - active;
    const half = items.length / 2;
    if (distance > half) distance -= items.length;
    if (distance < -half) distance += items.length;
    return distance;
  }

  return (
    <div className="coverflow" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="coverflow-stage">
        {items.map((product, index) => {
          const distance = relative(index);
          const hidden = Math.abs(distance) > 2;
          return <article
            key={product.id}
            className={`coverflow-card ${distance === 0 ? "is-active" : ""}`}
            style={{
              transform: `translateX(${distance * 61}%) scale(${1 - Math.min(Math.abs(distance), 2) * .14}) rotateY(${distance * -14}deg)`,
              opacity: hidden ? 0 : Math.max(.28, 1 - Math.abs(distance) * .25),
              zIndex: 10 - Math.abs(distance),
              pointerEvents: hidden ? "none" : "auto",
            }}
            onClick={() => distance !== 0 && setActive(index)}
          >
            <Link href={distance === 0 ? `/produto/${product.slug}` : "#"} onClick={(event) => distance !== 0 && event.preventDefault()}>
              <div className="coverflow-image-wrap">
                <img src={product.image_url || ""} alt={product.name} />
                {product.badge ? <span className="coverflow-badge">{product.badge}</span> : null}
              </div>
              <div className="coverflow-content">
                <small>{product.categories?.name || "Achadinho"}</small>
                <h3>{product.name}</h3>
                <div><strong>{formatPrice(product.current_price) || "Confira o preço"}</strong><span><Icon name="arrow" size={18} /></span></div>
              </div>
            </Link>
          </article>;
        })}
      </div>
      <div className="coverflow-controls">
        <button type="button" onClick={() => setActive((active - 1 + items.length) % items.length)} aria-label="Produto anterior">‹</button>
        <div className="coverflow-dots">{items.map((item, index) => <button key={item.id} type="button" className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-label={`Abrir produto ${index + 1}`} />)}</div>
        <button type="button" onClick={() => setActive((active + 1) % items.length)} aria-label="Próximo produto">›</button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Icon from "./Icon";

export default function ProductRail({ products, autoplay = true, interval = 4600 }: { products: Product[]; autoplay?: boolean; interval?: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const move = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.82, 300), behavior: reducedMotion ? "auto" : "smooth" });
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setPageVisible(document.visibilityState === "visible");
    syncMotion();
    syncVisibility();
    media.addEventListener?.("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      media.removeEventListener?.("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || paused || reducedMotion || !pageVisible || products.length < 3) return;
    const timer = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail) return;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 24;
      atEnd ? rail.scrollTo({ left: 0, behavior: "smooth" }) : move(1);
    }, Math.max(3800, interval));
    return () => window.clearInterval(timer);
  }, [autoplay, interval, pageVisible, paused, products.length, reducedMotion]);

  return <div
    className="hs-product-rail-shell"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={() => setPaused(false)}
    onPointerDown={() => setPaused(true)}
    onPointerUp={() => window.setTimeout(() => setPaused(false), 3600)}
  >
    <button className="hs-product-rail__arrow is-prev" onClick={() => move(-1)} aria-label="Produtos anteriores"><Icon name="arrow" /></button>
    <div className="hs-product-rail" ref={railRef}>{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    <button className="hs-product-rail__arrow is-next" onClick={() => move(1)} aria-label="Próximos produtos"><Icon name="arrow" /></button>
  </div>;
}

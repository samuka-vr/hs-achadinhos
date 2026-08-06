"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Icon from "./Icon";

export default function ProductRail({ products, autoplay = true, interval = 4600 }: { products: Product[]; autoplay?: boolean; interval?: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const pauseBriefly = () => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setPaused(false), 3600);
  };

  const move = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const firstCard = rail.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap || window.getComputedStyle(rail).gap || "12") || 12;
    const distance = firstCard ? firstCard.offsetWidth + gap : Math.max(rail.clientWidth * 0.82, 280);
    rail.scrollBy({ left: direction * distance, behavior: reducedMotion ? "auto" : "smooth" });
    pauseBriefly();
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

  useEffect(() => () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || reducedMotion || !pageVisible || products.length < 3) return;
    const timer = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail) return;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 24;
      if (atEnd) rail.scrollTo({ left: 0, behavior: "smooth" });
      else {
        const firstCard = rail.firstElementChild as HTMLElement | null;
        const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap || window.getComputedStyle(rail).gap || "12") || 12;
        rail.scrollBy({ left: firstCard ? firstCard.offsetWidth + gap : rail.clientWidth * 0.82, behavior: "smooth" });
      }
    }, Math.max(3800, interval));
    return () => window.clearInterval(timer);
  }, [autoplay, interval, pageVisible, paused, products.length, reducedMotion]);

  return <div
    className="hs-product-rail-shell"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={pauseBriefly}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={pauseBriefly}
    onTouchStart={pauseBriefly}
    onTouchEnd={pauseBriefly}
  >
    <button type="button" className="hs-product-rail__arrow is-prev" onClick={() => move(-1)} aria-label="Produtos anteriores"><Icon name="arrow" /></button>
    <div className="hs-product-rail" ref={railRef}>{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    <button type="button" className="hs-product-rail__arrow is-next" onClick={() => move(1)} aria-label="Próximos produtos"><Icon name="arrow" /></button>
  </div>;
}

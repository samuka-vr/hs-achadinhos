"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Product } from "@/lib/types";
import { getProductPriceDisplay } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

const PAUSE_AFTER_INTERACTION = 4200;

export default function HeroProductCarousel({ products, interval = 5200 }: { products: Product[]; interval?: number }) {
  const slides = useMemo(() => products.filter((item) => Boolean(item.image_url?.trim())).slice(0, 40), [products]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => { if (index >= slides.length) setIndex(0); }, [index, slides.length]);
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(media.matches);
    onVisibility(); onMotion();
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener?.("change", onMotion);
    return () => { document.removeEventListener("visibilitychange", onVisibility); media.removeEventListener?.("change", onMotion); };
  }, []);
  useEffect(() => () => { if (resumeTimer.current) window.clearTimeout(resumeTimer.current); }, []);

  const pauseBriefly = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), PAUSE_AFTER_INTERACTION);
  }, []);
  const go = useCallback((next: number) => {
    if (!slides.length) return;
    setIndex((next + slides.length) % slides.length);
    setDragX(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused || dragging || reducedMotion || !visible || slides.length < 2) return;
    const timer = window.setTimeout(() => go(index + 1), Math.max(3800, interval));
    return () => window.clearTimeout(timer);
  }, [dragging, go, index, interval, paused, reducedMotion, slides.length, visible]);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (slides.length < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    setDragging(true);
    pauseBriefly();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      suppressClick.current = true;
      const width = event.currentTarget.getBoundingClientRect().width || 1;
      setDragX(Math.max(-width * 0.32, Math.min(width * 0.32, dx)));
    }
  }
  function finish(event: ReactPointerEvent<HTMLElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    const dx = event.clientX - pointer.current.x;
    const width = event.currentTarget.getBoundingClientRect().width || 1;
    pointer.current = null;
    setDragging(false);
    if (Math.abs(dx) > Math.max(54, width * 0.12)) go(index + (dx < 0 ? 1 : -1));
    else setDragX(0);
  }
  function preventClick(event: ReactMouseEvent<HTMLElement>) {
    if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
  }

  if (!slides.length) {
    return <div className="hs-spotlight hs-spotlight--empty"><span><Icon name="sparkles" /></span><strong>Novos destaques em breve</strong><p>Os produtos com imagem aparecem aqui automaticamente.</p></div>;
  }

  const product = slides[index];
  const price = getProductPriceDisplay(product);
  return (
    <section
      className={`hs-spotlight ${dragging ? "is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={preventClick}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => pauseBriefly()}
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
    >
      <article className="hs-spotlight__card" style={{ transform: `translate3d(${dragX}px,0,0)` }}>
        <Link href={`/produto/${product.slug}`} className="hs-spotlight__media" aria-label={`Abrir ${product.name}`}>
          <SafeProductImage src={product.image_url} alt={product.name} />
          <span>{product.is_video_product ? "Visto no vídeo" : "Achado em destaque"}</span>
        </Link>
        <div className="hs-spotlight__content">
          <div className="hs-spotlight__meta"><span>{product.categories?.name || "Achadinho"}</span>{product.product_code ? <b>{product.product_code}</b> : null}</div>
          <h2>{product.name}</h2>
          <div className="hs-spotlight__price"><strong>{price.main}</strong>{price.secondary ? <del>{price.secondary}</del> : null}</div>
          <div className="hs-spotlight__actions"><Link href={`/produto/${product.slug}`}>Ver detalhes</Link><a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener">Abrir na Shopee <Icon name="external" size={16} /></a></div>
        </div>
      </article>
      {slides.length > 1 ? <div className="hs-spotlight__controls">
        <button onClick={() => { pauseBriefly(); go(index - 1); }} aria-label="Produto anterior"><Icon name="arrow" /></button>
        <div className="hs-spotlight__progress"><span style={{ width: `${((index + 1) / slides.length) * 100}%` }} /><small>{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</small></div>
        <button onClick={() => { pauseBriefly(); go(index + 1); }} aria-label="Próximo produto"><Icon name="arrow" /></button>
      </div> : null}
    </section>
  );
}

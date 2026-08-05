"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

const MAX_SLIDES = 50;
const RESTART_DELAY = 1800;

function productPrice(product: Product) {
  const current = formatPrice(product.current_price);
  const secondary = formatPrice(product.old_price);
  const promotional = /oferta|desconto|promo/i.test(product.badge || "");

  if (!current) return { main: "Confira o preço", secondary: "" };
  if (secondary && product.old_price && product.current_price && product.old_price > product.current_price) {
    if (promotional) return { main: current, secondary };
    return { main: `${current} a ${secondary}`, secondary: "" };
  }
  if (/a partir/i.test(product.badge || "")) return { main: `A partir de ${current}`, secondary: "" };
  return { main: current, secondary: "" };
}

function stableSessionOrder(products: Product[]) {
  if (typeof window === "undefined") return products;
  const key = `hs-hero-order:${products.map((item) => item.id).join("|")}`;
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      const order = JSON.parse(stored) as string[];
      const position = new Map(order.map((id, index) => [id, index]));
      return [...products].sort((a, b) => (position.get(a.id) ?? 9999) - (position.get(b.id) ?? 9999));
    }

    const shuffled = [...products];
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    let seed = values[0] || Date.now();
    const random = () => {
      seed += 0x6d2b79f5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    window.sessionStorage.setItem(key, JSON.stringify(shuffled.map((item) => item.id)));
    return shuffled;
  } catch {
    return products;
  }
}

export default function HeroProductCarousel({
  products,
  interval = 5200,
}: {
  products: Product[];
  interval?: number;
}) {
  const eligible = useMemo(
    () => products.filter((product) => Boolean(product.image_url?.trim())).slice(0, MAX_SLIDES),
    [products],
  );

  const [slides, setSlides] = useState<Product[]>(eligible);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const pointerRef = useRef<{ id: number; x: number; y: number; startedAt: number } | null>(null);
  const didSwipeRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  const signature = useMemo(() => eligible.map((product) => product.id).join("|"), [eligible]);

  useEffect(() => {
    const ordered = stableSessionOrder(eligible);
    setSlides(ordered);
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }, []);

  const pauseBriefly = useCallback(() => {
    setInteractionPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setInteractionPaused(false), RESTART_DELAY);
  }, []);

  const jumpTo = useCallback((target: number) => {
    if (!slides.length) return;
    const normalized = (target + slides.length) % slides.length;
    const wrapping = target < 0 || target >= slides.length;

    if (wrapping) {
      setTransitionEnabled(false);
      setIndex(normalized);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)));
    } else {
      setTransitionEnabled(true);
      setIndex(normalized);
    }
  }, [index, slides.length]);

  const previous = useCallback(() => {
    pauseBriefly();
    jumpTo(index - 1);
  }, [index, jumpTo, pauseBriefly]);

  const next = useCallback(() => {
    pauseBriefly();
    jumpTo(index + 1);
  }, [index, jumpTo, pauseBriefly]);

  const autoplayPaused = dragging || interactionPaused || !pageVisible || reducedMotion || slides.length < 2;
  const safeInterval = Math.max(3600, interval);

  useEffect(() => {
    if (autoplayPaused) return;
    const timer = window.setTimeout(() => jumpTo(index + 1), safeInterval);
    return () => window.clearTimeout(timer);
  }, [autoplayPaused, index, jumpTo, safeInterval]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (slides.length < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest(".hs-hero-carousel-controls")) return;

    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startedAt: performance.now(),
    };
    didSwipeRef.current = false;
    setDragging(true);
    setTransitionEnabled(false);
    pauseBriefly();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;

    if (Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      didSwipeRef.current = true;
      const width = event.currentTarget.getBoundingClientRect().width || 1;
      setDragOffset(Math.max(-width * 0.9, Math.min(width * 0.9, deltaX)));
    }
  };

  const finishPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;

    const deltaX = event.clientX - pointer.x;
    const elapsed = Math.max(1, performance.now() - pointer.startedAt);
    const velocity = Math.abs(deltaX) / elapsed;
    const width = event.currentTarget.getBoundingClientRect().width || 1;
    const threshold = Math.max(48, width * 0.14);
    const shouldChange = didSwipeRef.current && (Math.abs(deltaX) >= threshold || velocity > 0.5);

    pointerRef.current = null;
    setDragging(false);
    setDragOffset(0);
    setTransitionEnabled(true);

    if (shouldChange) jumpTo(index + (deltaX < 0 ? 1 : -1));

    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 220);

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // A captura pode ter sido liberada automaticamente pelo navegador.
    }
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  if (!slides.length) return null;

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(-${index * 100}% + ${dragOffset}px), 0, 0)`,
  };

  return (
    <section
      className={`hs-hero-carousel ${dragging ? "is-dragging" : ""}`}
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onPointerLeave={() => {
        if (!dragging) setInteractionPaused(false);
      }}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={() => pauseBriefly()}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => pauseBriefly()}
      onClickCapture={handleClickCapture}
    >
      <div className="hs-hero-viewport">
        <div className={`hs-hero-track ${transitionEnabled && !dragging ? "is-animated" : ""}`} style={trackStyle}>
          {slides.map((product, slideIndex) => {
            const active = slideIndex === index;
            const price = productPrice(product);

            return (
              <article
                className={`hs-hero-slide ${active ? "is-active" : ""}`}
                aria-hidden={!active}
                aria-roledescription="slide"
                aria-label={`${slideIndex + 1} de ${slides.length}`}
                key={product.id}
              >
                <Link className="hs-hero-product-image" href={`/produto/${product.slug}`} tabIndex={active ? 0 : -1} draggable={false}>
                  <SafeProductImage src={product.image_url} alt={product.name} eager={active} />
                  <span className="hs-hero-product-label">{product.is_video_product ? "Visto no vídeo" : "Achadinho recente"}</span>
                </Link>

                <div className="hs-hero-product-copy">
                  <span className="hs-hero-product-category">{product.categories?.name || "Achadinho"}</span>
                  <h2>{product.name}</h2>
                  <div className="hs-hero-product-price">
                    <strong>{price.main}</strong>
                    {price.secondary ? <del>{price.secondary}</del> : null}
                  </div>
                  {product.product_code ? <small>Código {product.product_code}</small> : null}
                  <div className="hs-hero-product-actions">
                    <Link href={`/produto/${product.slug}`} tabIndex={active ? 0 : -1}>Ver detalhes</Link>
                    <a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener" tabIndex={active ? 0 : -1}>
                      Ver na Shopee <Icon name="external" size={14} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="hs-hero-carousel-footer">
          <div className="hs-hero-carousel-dots" aria-label="Escolher produto em destaque">
            {slides.slice(0, 8).map((product, dotIndex) => (
              <button
                key={product.id}
                type="button"
                className={dotIndex === index ? "is-active" : ""}
                onClick={() => {
                  pauseBriefly();
                  jumpTo(dotIndex);
                }}
                aria-label={`Mostrar produto ${dotIndex + 1}`}
                aria-current={dotIndex === index ? "true" : undefined}
              />
            ))}
          </div>

          <div className="hs-hero-carousel-progress" aria-hidden="true" key={`${slides[index]?.id}-${index}`}>
            <span className={autoplayPaused ? "is-paused" : ""} style={{ animationDuration: `${safeInterval}ms` }} />
          </div>

          <div className="hs-hero-carousel-controls">
            <button type="button" onClick={previous} aria-label="Produto anterior"><Icon name="arrow" size={17} /></button>
            <span className="hs-hero-carousel-count" aria-live="polite">{index + 1}/{slides.length}</span>
            <button type="button" onClick={next} aria-label="Próximo produto"><Icon name="arrow" size={17} /></button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Product } from "@/lib/types";
import { getProductPriceDisplay } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage, { preloadProductImage } from "./SafeProductImage";

const MIN_AUTOPLAY_INTERVAL = 4200;
const RESUME_DELAY = 4200;
const SCROLL_SETTLE_DELAY = 140;
const MAX_FEATURED_PRODUCTS = 12;

type RenderedSlide = {
  product: Product;
  realIndex: number;
  clone: "start" | "end" | null;
  key: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function HeroProductCarousel({
  products,
  interval = 5200,
}: {
  products: Product[];
  interval?: number;
}) {
  const slides = useMemo(
    () =>
      products
        .filter((product) => Boolean(product.image_url?.trim()))
        .slice(0, MAX_FEATURED_PRODUCTS),
    [products],
  );

  const renderedSlides = useMemo<RenderedSlide[]>(() => {
    if (slides.length < 2) {
      return slides.map((product, realIndex) => ({
        product,
        realIndex,
        clone: null,
        key: product.id,
      }));
    }

    const first = slides[0];
    const last = slides[slides.length - 1];
    return [
      { product: last, realIndex: slides.length - 1, clone: "start", key: `${last.id}-clone-start` },
      ...slides.map((product, realIndex) => ({ product, realIndex, clone: null, key: product.id })),
      { product: first, realIndex: 0, clone: "end", key: `${first.id}-clone-end` },
    ];
  }, [slides]);

  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualIndexRef = useRef(slides.length > 1 ? 1 : 0);
  const scrollTimerRef = useRef<number | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [virtualIndex, setVirtualIndex] = useState(slides.length > 1 ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [inViewport, setInViewport] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const getStep = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return 1;
    const firstSlide = viewport.querySelector<HTMLElement>("[data-carousel-slide]");
    const styles = window.getComputedStyle(viewport);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return Math.max(1, (firstSlide?.offsetWidth || viewport.clientWidth) + gap);
  }, []);

  const updateActiveFromVirtual = useCallback(
    (virtualIndex: number) => {
      if (!slides.length) return;
      let realIndex = virtualIndex;
      if (slides.length > 1) {
        if (virtualIndex <= 0) realIndex = slides.length - 1;
        else if (virtualIndex >= slides.length + 1) realIndex = 0;
        else realIndex = virtualIndex - 1;
      }
      setActiveIndex(clamp(realIndex, 0, slides.length - 1));
    },
    [slides.length],
  );

  const jumpToVirtual = useCallback(
    (virtualIndex: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      virtualIndexRef.current = virtualIndex;
      setVirtualIndex(virtualIndex);
      viewport.scrollTo({ left: virtualIndex * getStep(), behavior: "auto" });
      updateActiveFromVirtual(virtualIndex);
    },
    [getStep, updateActiveFromVirtual],
  );

  const settleLoopBoundary = useCallback(() => {
    if (slides.length < 2) return;
    const current = virtualIndexRef.current;
    if (current === 0) jumpToVirtual(slides.length);
    if (current === slides.length + 1) jumpToVirtual(1);
  }, [jumpToVirtual, slides.length]);

  const pauseTemporarily = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setPaused(false), RESUME_DELAY);
  }, []);

  const goToVirtual = useCallback(
    (target: number, userInitiated = true) => {
      const viewport = viewportRef.current;
      if (!viewport || slides.length < 2) return;
      if (userInitiated) pauseTemporarily();
      virtualIndexRef.current = clamp(target, 0, slides.length + 1);
      setVirtualIndex(virtualIndexRef.current);
      updateActiveFromVirtual(virtualIndexRef.current);
      viewport.scrollTo({
        left: virtualIndexRef.current * getStep(),
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [getStep, pauseTemporarily, reducedMotion, slides.length, updateActiveFromVirtual],
  );

  const move = useCallback(
    (direction: -1 | 1, userInitiated = true) => {
      goToVirtual(virtualIndexRef.current + direction, userInitiated);
    },
    [goToVirtual],
  );

  useLayoutEffect(() => {
    virtualIndexRef.current = slides.length > 1 ? 1 : 0;
    setActiveIndex(0);
    setVirtualIndex(slides.length > 1 ? 1 : 0);
    const frame = window.requestAnimationFrame(() => jumpToVirtual(virtualIndexRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [jumpToVirtual, slides.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (typeof ResizeObserver === "undefined") return;
    const resize = new ResizeObserver(() => jumpToVirtual(virtualIndexRef.current));
    resize.observe(viewport);
    return () => resize.disconnect();
  }, [jumpToVirtual]);

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
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.7] },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const indexes = [activeIndex - 1, activeIndex, activeIndex + 1]
      .map((index) => (index + slides.length) % slides.length);
    indexes.forEach((index) => {
      void preloadProductImage(slides[index]?.image_url);
    });
  }, [activeIndex, slides]);

  useEffect(() => {
    if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
    if (
      paused ||
      reducedMotion ||
      !pageVisible ||
      !inViewport ||
      isPointerDownRef.current ||
      slides.length < 2
    ) {
      return;
    }

    autoplayTimerRef.current = window.setTimeout(
      () => move(1, false),
      Math.max(MIN_AUTOPLAY_INTERVAL, interval),
    );

    return () => {
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
    };
  }, [activeIndex, inViewport, interval, move, pageVisible, paused, reducedMotion, slides.length]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  function handleScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nearest = clamp(
      Math.round(viewport.scrollLeft / getStep()),
      0,
      Math.max(0, renderedSlides.length - 1),
    );
    virtualIndexRef.current = nearest;
    setVirtualIndex(nearest);
    updateActiveFromVirtual(nearest);

    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(settleLoopBoundary, SCROLL_SETTLE_DELAY);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isPointerDownRef.current = true;
    suppressClickRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    setPaused(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPointerDownRef.current) return;
    const movedX = Math.abs(event.clientX - pointerStartRef.current.x);
    const movedY = Math.abs(event.clientY - pointerStartRef.current.y);
    if (movedX > 8 && movedX > movedY) suppressClickRef.current = true;
  }

  function handlePointerEnd() {
    isPointerDownRef.current = false;
    pauseTemporarily();
  }

  function preventAccidentalClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  if (!slides.length) {
    return (
      <div className="hs-spotlight hs-spotlight--empty">
        <span><Icon name="sparkles" /></span>
        <strong>Novos destaques em breve</strong>
        <p>Os produtos com imagem aparecem aqui automaticamente.</p>
      </div>
    );
  }

  return (
    <section
      ref={rootRef}
      className="hs-spotlight"
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={pauseTemporarily}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={pauseTemporarily}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
    >
      <div
        ref={viewportRef}
        className="hs-spotlight__viewport"
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={preventAccidentalClick}
      >
        {renderedSlides.map(({ product, realIndex, clone, key }, renderedIndex) => {
          const price = getProductPriceDisplay(product);
          const isActive = renderedIndex === virtualIndex;
          return (
            <article
              data-carousel-slide
              className={`hs-spotlight__slide ${isActive ? "is-active" : ""}`}
              key={key}
              aria-hidden={clone ? true : undefined}
            >
              <div className="hs-spotlight__card">
                <Link
                  href={`/produto/${product.slug}`}
                  className="hs-spotlight__media"
                  aria-label={`Abrir ${product.name}`}
                  draggable={false}
                  tabIndex={isActive && !clone ? 0 : -1}
                >
                  <SafeProductImage
                    src={product.image_url}
                    alt={product.name}
                    eager={realIndex === activeIndex || Math.abs(realIndex - activeIndex) === 1}
                    fade={false}
                    sizes="(max-width: 760px) calc(100vw - 60px), 520px"
                  />
                  <span>{product.is_video_product ? "Visto no vídeo" : "Achado em destaque"}</span>
                </Link>

                <div className="hs-spotlight__content">
                  <div className="hs-spotlight__meta">
                    <span>{product.categories?.name || "Achadinho"}</span>
                    {product.product_code ? <b>{product.product_code}</b> : null}
                  </div>
                  <h2>{product.name}</h2>
                  <div className={`hs-spotlight__price is-${price.mode}`}>
                    <strong>{price.main}</strong>
                    {price.secondary ? <del>{price.secondary}</del> : null}
                  </div>
                  <div className="hs-spotlight__actions">
                    <Link href={`/produto/${product.slug}`} tabIndex={isActive && !clone ? 0 : -1}>Ver detalhes</Link>
                    <a
                      href={`/go/${product.id}`}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      tabIndex={isActive && !clone ? 0 : -1}
                    >
                      Abrir na Shopee <Icon name="external" size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <div className="hs-spotlight__controls">
          <button type="button" onClick={() => move(-1)} aria-label="Produto anterior"><Icon name="arrow" /></button>
          <div className="hs-spotlight__progress" aria-hidden="true">
            <span style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }} />
            <small>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</small>
          </div>
          <button type="button" onClick={() => move(1)} aria-label="Próximo produto"><Icon name="arrow" /></button>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">Produto {activeIndex + 1} de {slides.length}: {slides[activeIndex]?.name}</p>
    </section>
  );
}

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
  TransitionEvent as ReactTransitionEvent,
} from "react";
import type { Product } from "@/lib/types";
import { discountPercentage, formatPrice } from "@/lib/utils";
import Icon from "./Icon";

const SESSION_SEED_KEY = "hs-hero-carousel-seed-v1";
const MAX_SLIDES = 8;

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleProducts(items: Product[], seed: number) {
  const random = seededRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function getSessionSeed() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_SEED_KEY);
    if (stored) return Number(stored) || 1;

    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    const seed = values[0] || Date.now();
    window.sessionStorage.setItem(SESSION_SEED_KEY, String(seed));
    return seed;
  } catch {
    return Date.now();
  }
}

export default function HeroProductCarousel({
  products,
  interval = 5200,
}: {
  products: Product[];
  interval?: number;
}) {
  const initialProducts = useMemo(() => {
    const withImages = products.filter((product) => Boolean(product.image_url));
    return (withImages.length ? withImages : products).slice(0, MAX_SLIDES);
  }, [products]);

  const [slides, setSlides] = useState<Product[]>(initialProducts);
  const [trackIndex, setTrackIndex] = useState(initialProducts.length > 1 ? 1 : 0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const resumeTimerRef = useRef<number | null>(null);
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    time: number;
    active: boolean;
  } | null>(null);
  const didSwipeRef = useRef(false);

  const productSignature = useMemo(
    () => products.map((product) => product.id).join("|"),
    [products],
  );

  useEffect(() => {
    const withImages = products.filter((product) => Boolean(product.image_url));
    const eligible = withImages.length ? withImages : products;
    const seed = getSessionSeed() ^ hashText(productSignature);
    const randomized = shuffleProducts(eligible, seed).slice(0, MAX_SLIDES);

    setTransitionEnabled(false);
    setSlides(randomized);
    setTrackIndex(randomized.length > 1 ? 1 : 0);
    setDragOffset(0);

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [productSignature, products]);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(document.visibilityState === "visible");
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
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

  const slideCount = slides.length;
  const activeIndex = slideCount > 1
    ? ((trackIndex - 1) % slideCount + slideCount) % slideCount
    : 0;

  const displaySlides = useMemo(() => {
    if (slides.length < 2) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const paused =
    manualPaused ||
    hovered ||
    focused ||
    interactionPaused ||
    dragging ||
    !pageVisible ||
    reducedMotion ||
    slideCount < 2;

  const safeInterval = Math.max(3200, interval);

  const pauseBriefly = useCallback((duration = 1600) => {
    setInteractionPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      setInteractionPaused(false);
      resumeTimerRef.current = null;
    }, duration);
  }, []);

  const previous = useCallback(() => {
    if (slideCount < 2) return;
    setTransitionEnabled(true);
    setTrackIndex((current) => current - 1);
    pauseBriefly();
  }, [pauseBriefly, slideCount]);

  const next = useCallback(() => {
    if (slideCount < 2) return;
    setTransitionEnabled(true);
    setTrackIndex((current) => current + 1);
    pauseBriefly();
  }, [pauseBriefly, slideCount]);

  const select = useCallback((index: number) => {
    if (slideCount < 2) return;
    const normalized = (index + slideCount) % slideCount;
    setTransitionEnabled(true);
    setTrackIndex(normalized + 1);
    pauseBriefly();
  }, [pauseBriefly, slideCount]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setTransitionEnabled(true);
      setTrackIndex((current) => current + 1);
    }, safeInterval);
    return () => window.clearTimeout(timer);
  }, [paused, safeInterval, trackIndex]);

  const handleTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    if (slideCount < 2 || dragging) return;

    if (trackIndex === 0) {
      setTransitionEnabled(false);
      setTrackIndex(slideCount);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setTransitionEnabled(true));
      });
    } else if (trackIndex === slideCount + 1) {
      setTransitionEnabled(false);
      setTrackIndex(1);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setTransitionEnabled(true));
      });
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (slideCount < 2 || event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".hs-hero-carousel-controls")) return;

    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      active: true,
    };
    didSwipeRef.current = false;
    setDragging(true);
    setInteractionPaused(true);
    setTransitionEnabled(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    if (!pointer?.active || pointer.id !== event.pointerId) return;

    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;

    if (Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      didSwipeRef.current = true;
      const width = event.currentTarget.getBoundingClientRect().width || 1;
      const limited = Math.max(-width * 0.82, Math.min(width * 0.82, deltaX));
      setDragOffset(limited);
    }
  };

  const finishPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    if (!pointer?.active || pointer.id !== event.pointerId) return;

    const deltaX = event.clientX - pointer.x;
    const elapsed = Math.max(1, performance.now() - pointer.time);
    const velocity = Math.abs(deltaX) / elapsed;
    const width = event.currentTarget.getBoundingClientRect().width || 1;
    const threshold = Math.max(46, width * 0.1);
    const shouldChange = Math.abs(deltaX) >= threshold || velocity > 0.5;

    pointerRef.current = null;
    setDragging(false);
    setDragOffset(0);
    setTransitionEnabled(true);

    if (shouldChange && didSwipeRef.current) {
      if (deltaX < 0) {
        setTrackIndex((current) => current + 1);
      } else {
        setTrackIndex((current) => current - 1);
      }
    }

    pauseBriefly(1900);
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 240);

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // O navegador pode liberar a captura automaticamente.
    }
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  if (!slides.length) return null;

  const trackWidth = displaySlides.length * 100;
  const oneSlidePercent = 100 / displaySlides.length;
  const trackStyle: CSSProperties = {
    width: `${trackWidth}%`,
    transform: `translate3d(calc(-${trackIndex * oneSlidePercent}% + ${dragOffset}px), 0, 0)`,
  };
  const slideStyle: CSSProperties = {
    flexBasis: `${oneSlidePercent}%`,
    width: `${oneSlidePercent}%`,
  };

  return (
    <section
      className={`hs-hero-carousel ${dragging ? "is-dragging" : ""}`}
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onClickCapture={handleClickCapture}
    >
      <div className="hs-hero-viewport">
        <div
          className={`hs-hero-track ${transitionEnabled && !dragging ? "is-animated" : ""}`}
          style={trackStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {displaySlides.map((product, index) => {
            const discount = discountPercentage(product.current_price, product.old_price);
            const isActive = index === trackIndex;
            const isClone = slideCount > 1 && (index === 0 || index === displaySlides.length - 1);

            return (
              <article
                className={`hs-hero-slide ${isActive ? "is-active" : ""}`}
                style={slideStyle}
                aria-hidden={!isActive}
                aria-roledescription="slide"
                aria-label={`${activeIndex + 1} de ${slideCount}`}
                key={`${product.id}-${index}-${isClone ? "clone" : "slide"}`}
              >
                <Link
                  className="hs-hero-product-image"
                  href={`/produto/${product.slug}`}
                  tabIndex={isActive ? 0 : -1}
                  draggable={false}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} draggable={false} />
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
                    <Link href={`/produto/${product.slug}`} tabIndex={isActive ? 0 : -1}>Ver detalhes</Link>
                    <a href={`/go/${product.id}`} target="_blank" rel="nofollow sponsored noopener" tabIndex={isActive ? 0 : -1}>
                      Ver na Shopee <Icon name="external" size={14} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {slideCount > 1 ? (
        <>
          <div className="hs-hero-carousel-progress" aria-hidden="true" key={slides[activeIndex]?.id}>
            <span
              className={paused ? "is-paused" : ""}
              style={{ animationDuration: `${safeInterval}ms` }}
            />
          </div>

          <div className="hs-hero-carousel-controls">
            <button type="button" onClick={previous} aria-label="Produto anterior"><Icon name="arrow" size={17} /></button>
            <button
              type="button"
              className="hs-hero-autoplay-toggle"
              onClick={() => setManualPaused((current) => !current)}
              aria-label={manualPaused ? "Continuar reprodução automática" : "Pausar reprodução automática"}
              aria-pressed={manualPaused}
            >
              <span className={manualPaused ? "is-play" : "is-pause"} />
            </button>
            <div className="hs-hero-carousel-dots" aria-label="Escolher produto">
              {slides.map((product, index) => (
                <button
                  type="button"
                  className={index === activeIndex ? "is-active" : ""}
                  onClick={() => select(index)}
                  aria-label={`Mostrar ${product.name}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  key={product.id}
                />
              ))}
            </div>
            <span className="hs-hero-carousel-count" aria-live="polite">{activeIndex + 1}/{slideCount}</span>
            <button type="button" onClick={next} aria-label="Próximo produto"><Icon name="arrow" size={17} /></button>
          </div>

          <span className="hs-hero-swipe-hint" aria-hidden="true">Deslize para ver mais</span>
        </>
      ) : null}
    </section>
  );
}

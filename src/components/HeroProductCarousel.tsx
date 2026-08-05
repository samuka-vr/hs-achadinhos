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
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TransitionEvent as ReactTransitionEvent,
} from "react";
import type { Product } from "@/lib/types";
import { getProductPriceDisplay } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

const PAUSE_AFTER_INTERACTION = 4600;
const SWIPE_DISTANCE_RATIO = 0.16;
const SWIPE_MIN_DISTANCE = 48;
const SWIPE_MIN_VELOCITY = 0.34;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  axis: "x" | "y" | null;
  moved: boolean;
};

function normalizeIndex(index: number, length: number) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

export default function HeroProductCarousel({
  products,
  interval = 5200,
}: {
  products: Product[];
  interval?: number;
}) {
  const slides = useMemo(
    () => products.filter((item) => Boolean(item.image_url?.trim())).slice(0, 40),
    [products],
  );

  const displaySlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(slides.length > 1 ? 1 : 0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scheduleResume = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(
      () => setPaused(false),
      PAUSE_AFTER_INTERACTION,
    );
  }, []);

  const jumpWithoutAnimation = useCallback((nextPosition: number) => {
    setTransitionEnabled(false);
    setPosition(nextPosition);
    setDragOffset(0);

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });
  }, []);

  const moveBy = useCallback(
    (direction: -1 | 1) => {
      if (slides.length < 2 || dragging || transitioning) return;
      setTransitionEnabled(true);
      setTransitioning(true);
      setDragOffset(0);
      setPosition((current) => current + direction);
      setIndex((current) => normalizeIndex(current + direction, slides.length));
    },
    [dragging, slides.length, transitioning],
  );

  useEffect(() => {
    setIndex(0);
    setDragOffset(0);
    setTransitioning(false);
    setTransitionEnabled(false);
    setPosition(slides.length > 1 ? 1 : 0);

    const frame = window.requestAnimationFrame(() => setTransitionEnabled(true));
    return () => window.cancelAnimationFrame(frame);
  }, [slides.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () =>
      setPageVisible(document.visibilityState === "visible");

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
    if (!slides.length) return;

    const candidates = [-1, 0, 1, 2]
      .map((offset) => slides[normalizeIndex(index + offset, slides.length)]?.image_url?.trim())
      .filter((source): source is string => Boolean(source));

    const preloaders = candidates.map((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
      void image.decode?.().catch(() => undefined);
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [index, slides]);

  useEffect(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    if (
      paused ||
      reducedMotion ||
      !pageVisible ||
      dragging ||
      transitioning ||
      slides.length < 2
    ) {
      return;
    }

    autoplayTimerRef.current = window.setTimeout(
      () => moveBy(1),
      Math.max(4000, interval),
    );

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [dragging, interval, moveBy, pageVisible, paused, reducedMotion, slides.length, transitioning]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (slides.length < 2) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    scheduleResume();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      axis: null,
      moved: false,
    };

    setDragging(true);
    setTransitionEnabled(false);
    setTransitioning(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 7) {
      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.08 ? "x" : "y";
    }

    if (drag.axis !== "x") return;

    event.preventDefault();
    drag.lastX = event.clientX;
    drag.lastTime = performance.now();

    if (Math.abs(deltaX) > 8) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    const viewportWidth = Math.max(1, viewportRef.current?.clientWidth || 1);
    const resistance = Math.max(-viewportWidth, Math.min(viewportWidth, deltaX));
    setDragOffset(resistance);
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (drag.axis !== "x") {
      setTransitionEnabled(true);
      setDragOffset(0);
      return;
    }

    const viewportWidth = Math.max(1, viewportRef.current?.clientWidth || 1);
    const distance = event.clientX - drag.startX;
    const elapsed = Math.max(1, performance.now() - drag.lastTime);
    const finalStep = event.clientX - drag.lastX;
    const velocity = Math.abs(finalStep / elapsed);
    const threshold = Math.max(SWIPE_MIN_DISTANCE, viewportWidth * SWIPE_DISTANCE_RATIO);
    const shouldChange = Math.abs(distance) >= threshold || velocity >= SWIPE_MIN_VELOCITY;

    setTransitionEnabled(true);
    setDragOffset(0);

    if (!shouldChange) return;

    setTransitioning(true);
    const direction: -1 | 1 = distance < 0 ? 1 : -1;
    setPosition((current) => current + direction);
    setIndex((current) => normalizeIndex(current + direction, slides.length));
  }

  function onTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    setTransitioning(false);

    if (slides.length <= 1) return;
    if (position === 0) {
      jumpWithoutAnimation(slides.length);
      return;
    }
    if (position === slides.length + 1) {
      jumpWithoutAnimation(1);
    }
  }

  function preventClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  function getOriginalIndex(displayIndex: number) {
    if (slides.length <= 1) return displayIndex;
    if (displayIndex === 0) return slides.length - 1;
    if (displayIndex === displaySlides.length - 1) return 0;
    return displayIndex - 1;
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

  const displayCount = Math.max(1, displaySlides.length);
  const translatePercent = -(position * (100 / displayCount));
  const trackStyle = {
    width: `${displayCount * 100}%`,
    transform: `translate3d(calc(${translatePercent}% + ${dragOffset}px), 0, 0)`,
    transition:
      transitionEnabled && !dragging && !reducedMotion
        ? "transform 460ms cubic-bezier(0.22, 0.78, 0.22, 1)"
        : "none",
  };
  const slideStyle = {
    flexBasis: `${100 / displayCount}%`,
    width: `${100 / displayCount}%`,
    maxWidth: `${100 / displayCount}%`,
  };

  return (
    <section
      className={`hs-spotlight ${dragging ? "is-dragging" : ""}`}
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={scheduleResume}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={scheduleResume}
    >
      <div
        ref={viewportRef}
        className="hs-spotlight__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onClickCapture={preventClick}
      >
        <div
          className="hs-spotlight__track"
          style={trackStyle}
          onTransitionEnd={onTransitionEnd}
        >
          {displaySlides.map((product, displayIndex) => {
            const originalIndex = getOriginalIndex(displayIndex);
            const isCurrentProduct = originalIndex === index;
            const isActive = displayIndex === position;
            const previousIndex = normalizeIndex(index - 1, slides.length);
            const nextIndex = normalizeIndex(index + 1, slides.length);
            const shouldEagerLoad =
              isCurrentProduct || originalIndex === previousIndex || originalIndex === nextIndex;
            const price = getProductPriceDisplay(product);

            return (
              <article
                className="hs-spotlight__slide"
                key={`${product.id}-${displayIndex}`}
                aria-hidden={!isActive}
                style={slideStyle}
              >
                <div className="hs-spotlight__card">
                  <Link
                    href={`/produto/${product.slug}`}
                    className="hs-spotlight__media"
                    aria-label={`Abrir ${product.name}`}
                    tabIndex={isActive ? 0 : -1}
                    draggable={false}
                  >
                    <SafeProductImage
                      src={product.image_url}
                      alt={product.name}
                      eager={shouldEagerLoad}
                    />
                    <span>
                      {product.is_video_product ? "Visto no vídeo" : "Achado em destaque"}
                    </span>
                  </Link>

                  <div className="hs-spotlight__content">
                    <div className="hs-spotlight__meta">
                      <span>{product.categories?.name || "Achadinho"}</span>
                      {product.product_code ? <b>{product.product_code}</b> : null}
                    </div>
                    <h2>{product.name}</h2>
                    <div className="hs-spotlight__price">
                      <strong>{price.main}</strong>
                      {price.secondary ? <del>{price.secondary}</del> : null}
                    </div>
                    <div className="hs-spotlight__actions">
                      <Link
                        href={`/produto/${product.slug}`}
                        tabIndex={isActive ? 0 : -1}
                        draggable={false}
                      >
                        Ver detalhes
                      </Link>
                      <a
                        href={`/go/${product.id}`}
                        target="_blank"
                        rel="nofollow sponsored noopener"
                        tabIndex={isActive ? 0 : -1}
                        draggable={false}
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
      </div>

      {slides.length > 1 ? (
        <div className="hs-spotlight__controls">
          <button
            type="button"
            onClick={() => {
              scheduleResume();
              moveBy(-1);
            }}
            aria-label="Produto anterior"
          >
            <Icon name="arrow" />
          </button>

          <div className="hs-spotlight__progress">
            <span style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
            <small>
              {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </small>
          </div>

          <button
            type="button"
            onClick={() => {
              scheduleResume();
              moveBy(1);
            }}
            aria-label="Próximo produto"
          >
            <Icon name="arrow" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

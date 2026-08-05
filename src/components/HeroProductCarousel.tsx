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
import { getProductPriceDisplay } from "@/lib/utils";
import Icon from "./Icon";
import SafeProductImage from "./SafeProductImage";

const CARD_GAP = 14;
const PAUSE_AFTER_INTERACTION = 4800;
const SWIPE_DISTANCE_RATIO = 0.18;
const SWIPE_MIN_DISTANCE = 52;
const SWIPE_MIN_VELOCITY = 0.42;

type CarouselPhase = "idle" | "dragging" | "settling";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  axis: "x" | "y" | null;
  moved: boolean;
};

type SlideSlot = -1 | 0 | 1;

function normalizeIndex(index: number, length: number) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

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
    () => products.filter((item) => Boolean(item.image_url?.trim())).slice(0, 40),
    [products],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<CarouselPhase>("idle");
  const [dragOffset, setDragOffset] = useState(0);
  const [settleDirection, setSettleDirection] = useState<-1 | 0 | 1>(0);
  const [viewportWidth, setViewportWidth] = useState(360);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const distance = Math.max(1, viewportWidth + CARD_GAP);
  const effectiveOffset =
    phase === "settling" && settleDirection !== 0
      ? -settleDirection * distance
      : dragOffset;

  const scheduleResume = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(
      () => setPaused(false),
      PAUSE_AFTER_INTERACTION,
    );
  }, []);

  const settleTo = useCallback(
    (direction: -1 | 1, pauseForInteraction = true) => {
      if (slides.length < 2 || phase === "settling") return;
      if (pauseForInteraction) scheduleResume();
      setSettleDirection(direction);
      setPhase("settling");
      setDragOffset(0);
    },
    [phase, scheduleResume, slides.length],
  );

  useEffect(() => {
    setActiveIndex(0);
    setPhase("idle");
    setDragOffset(0);
    setSettleDirection(0);
  }, [slides.length]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const syncSize = () => {
      const nextWidth = Math.max(1, Math.round(node.getBoundingClientRect().width));
      setViewportWidth(nextWidth);
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(node);
    window.addEventListener("orientationchange", syncSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", syncSize);
    };
  }, []);

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

    const sources = [-2, -1, 0, 1, 2]
      .map((offset) => slides[normalizeIndex(activeIndex + offset, slides.length)]?.image_url?.trim())
      .filter((source): source is string => Boolean(source));

    const preloaders = [...new Set(sources)].map((source) => {
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
  }, [activeIndex, slides]);

  useEffect(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current);
    }

    if (
      paused ||
      reducedMotion ||
      !pageVisible ||
      phase !== "idle" ||
      slides.length < 2
    ) {
      return;
    }

    autoplayTimerRef.current = window.setTimeout(
      () => settleTo(1, false),
      Math.max(4000, interval),
    );

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [interval, pageVisible, paused, phase, reducedMotion, settleTo, slides.length]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current);
    },
    [],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (slides.length < 2 || phase === "settling") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    scheduleResume();
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocityX: 0,
      axis: null,
      moved: false,
    };

    setPhase("dragging");
    setSettleDirection(0);
    setDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 7) {
      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.12 ? "x" : "y";
    }

    if (drag.axis === "y") return;
    if (drag.axis !== "x") return;

    event.preventDefault();

    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocityX = (event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = now;

    if (Math.abs(deltaX) > 8) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    const resistance = clamp(deltaX, -distance * 0.98, distance * 0.98);
    setDragOffset(resistance);
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (drag.axis !== "x") {
      setPhase("idle");
      setDragOffset(0);
      return;
    }

    const distanceMoved = event.clientX - drag.startX;
    const threshold = Math.max(SWIPE_MIN_DISTANCE, viewportWidth * SWIPE_DISTANCE_RATIO);
    const shouldChange =
      Math.abs(distanceMoved) >= threshold ||
      Math.abs(drag.velocityX) >= SWIPE_MIN_VELOCITY;

    if (!shouldChange) {
      setSettleDirection(0);
      setPhase("settling");
      setDragOffset(0);
      return;
    }

    const direction: -1 | 1 = distanceMoved < 0 ? 1 : -1;
    setSettleDirection(direction);
    setPhase("settling");
    setDragOffset(0);
  }

  function onCurrentTransitionEnd(event: ReactTransitionEvent<HTMLElement>) {
    if (event.propertyName !== "transform" || phase !== "settling") return;

    if (settleDirection !== 0) {
      setActiveIndex((current) =>
        normalizeIndex(current + settleDirection, slides.length),
      );
    }

    setSettleDirection(0);
    setDragOffset(0);
    setPhase("idle");
  }

  function preventClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  function getSlideStyle(slot: SlideSlot): CSSProperties {
    const normalizedProgress = effectiveOffset / distance;
    const visualPosition = slot + normalizedProgress;
    const absolutePosition = Math.abs(visualPosition);
    const scale = 1 - Math.min(absolutePosition * 0.045, 0.07);
    const opacity = 1 - Math.min(absolutePosition * 0.2, 0.38);
    const translatePercent = slot * 100;
    const translatePixels = slot * CARD_GAP + effectiveOffset;

    return {
      zIndex: Math.max(1, 10 - Math.round(absolutePosition * 4)),
      opacity,
      transform: `translate3d(calc(${translatePercent}% + ${translatePixels}px), 0, 0) scale(${scale})`,
      pointerEvents: slot === 0 && phase !== "settling" ? "auto" : "none",
    };
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

  const slots: SlideSlot[] = slides.length > 1 ? [-1, 0, 1] : [0];

  return (
    <section
      className={`hs-spotlight is-${phase}`}
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
        <div className="hs-spotlight__stage">
          {slots.map((slot) => {
            const productIndex = normalizeIndex(activeIndex + slot, slides.length);
            const product = slides[productIndex];
            const price = getProductPriceDisplay(product);
            const isCurrent = slot === 0;
            const key = slides.length === 2 ? `${product.id}-${slot}` : product.id;

            return (
              <article
                key={key}
                className={`hs-spotlight__slide ${isCurrent ? "is-current" : ""}`}
                style={getSlideStyle(slot)}
                aria-hidden={!isCurrent}
                onTransitionEnd={isCurrent ? onCurrentTransitionEnd : undefined}
              >
                <div className="hs-spotlight__card">
                  <Link
                    href={`/produto/${product.slug}`}
                    className="hs-spotlight__media"
                    aria-label={`Abrir ${product.name}`}
                    tabIndex={isCurrent && phase !== "settling" ? 0 : -1}
                    draggable={false}
                  >
                    <SafeProductImage
                      src={product.image_url}
                      alt={product.name}
                      eager
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
                        tabIndex={isCurrent && phase !== "settling" ? 0 : -1}
                        draggable={false}
                      >
                        Ver detalhes
                      </Link>
                      <a
                        href={`/go/${product.id}`}
                        target="_blank"
                        rel="nofollow sponsored noopener"
                        tabIndex={isCurrent && phase !== "settling" ? 0 : -1}
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
            onClick={() => settleTo(-1)}
            disabled={phase === "settling"}
            aria-label="Produto anterior"
          >
            <Icon name="arrow" />
          </button>

          <div className="hs-spotlight__progress">
            <span style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }} />
            <small>
              {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </small>
          </div>

          <button
            type="button"
            onClick={() => settleTo(1)}
            disabled={phase === "settling"}
            aria-label="Próximo produto"
          >
            <Icon name="arrow" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

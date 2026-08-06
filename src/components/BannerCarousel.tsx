"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Banner } from "@/lib/types";
import Icon from "./Icon";
import { safePublicHref } from "@/lib/security";

export default function BannerCarousel({
  banners,
  autoplay = true,
  interval = 5000,
  height = "medium",
}: {
  banners: Banner[];
  autoplay?: boolean;
  interval?: number;
  height?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const timerRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, banners.length - 1)));
    for (const banner of banners.slice(0, 4)) {
      for (const source of [banner.mobile_image_url, banner.image_url]) {
        if (!source) continue;
        const image = new Image();
        image.decoding = "async";
        image.src = source;
      }
    }
  }, [banners]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const syncPage = () => setVisible(document.visibilityState === "visible");
    syncMotion();
    syncPage();
    media.addEventListener?.("change", syncMotion);
    document.addEventListener("visibilitychange", syncPage);
    return () => {
      media.removeEventListener?.("change", syncMotion);
      document.removeEventListener("visibilitychange", syncPage);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!autoplay || paused || reducedMotion || !visible || banners.length < 2) return;
    timerRef.current = window.setTimeout(
      () => setActive((value) => (value + 1) % banners.length),
      Math.max(3200, interval),
    );
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active, autoplay, banners.length, interval, paused, reducedMotion, visible]);

  if (!banners.length) return null;
  const item = banners[Math.min(active, banners.length - 1)];
  const move = (direction: -1 | 1) => {
    setPaused(true);
    setActive((current) => (current + direction + banners.length) % banners.length);
    window.setTimeout(() => setPaused(false), 3600);
  };

  return (
    <section
      ref={rootRef}
      className={`hs-banner hs-banner--${height}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      style={{ "--banner-text": item.text_color } as CSSProperties}
      aria-roledescription="carrossel"
      aria-label="Banners em destaque"
    >
      <picture key={item.id} className="hs-banner__picture">
        {item.mobile_image_url ? <source media="(max-width: 640px)" srcSet={item.mobile_image_url} /> : null}
        {item.image_url ? <img src={item.image_url} alt="" decoding="async" /> : <span className="hs-banner__fallback" />}
      </picture>
      <span className="hs-banner__overlay" style={{ opacity: Math.min(0.78, item.overlay_strength / 100) }} />
      <div className={`hs-banner__copy align-${item.text_position}`}>
        <h2>{item.title}</h2>
        {item.subtitle ? <p>{item.subtitle}</p> : null}
        {item.button_text ? <a href={safePublicHref(item.button_url, "#produtos")}>{item.button_text}<Icon name="arrow" size={16} /></a> : null}
      </div>
      {banners.length > 1 ? (
        <div className="hs-banner__controls">
          <button type="button" onClick={() => move(-1)} aria-label="Banner anterior"><Icon name="arrow" /></button>
          <div>{banners.map((banner, index) => <button type="button" key={banner.id} className={index === active ? "active" : ""} onClick={() => { setActive(index); setPaused(true); window.setTimeout(() => setPaused(false), 3600); }} aria-label={`Banner ${index + 1}`} aria-current={index === active ? "true" : undefined} />)}</div>
          <button type="button" onClick={() => move(1)} aria-label="Próximo banner"><Icon name="arrow" /></button>
        </div>
      ) : null}
    </section>
  );
}

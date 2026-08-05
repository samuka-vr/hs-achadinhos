"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Banner } from "@/lib/types";
import Icon from "./Icon";
import { safePublicHref } from "@/lib/security";

export default function BannerCarousel({ banners, autoplay = true, interval = 5000, height = "medium" }: { banners: Banner[]; autoplay?: boolean; interval?: number; height?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!autoplay || paused || banners.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % banners.length), Math.max(3200, interval));
    return () => window.clearInterval(timer);
  }, [autoplay, banners.length, interval, paused]);
  if (!banners.length) return null;
  const item = banners[Math.min(active, banners.length - 1)];
  return <section className={`hs-banner hs-banner--${height}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} style={{ "--banner-text": item.text_color } as CSSProperties}>
    <picture>{item.mobile_image_url ? <source media="(max-width: 640px)" srcSet={item.mobile_image_url} /> : null}{item.image_url ? <img src={item.image_url} alt="" /> : <span className="hs-banner__fallback" />}</picture>
    <span className="hs-banner__overlay" style={{ opacity: Math.min(0.78, item.overlay_strength / 100) }} />
    <div className={`hs-banner__copy align-${item.text_position}`}><h2>{item.title}</h2>{item.subtitle ? <p>{item.subtitle}</p> : null}{item.button_text ? <a href={safePublicHref(item.button_url, "#produtos")}>{item.button_text}<Icon name="arrow" size={16} /></a> : null}</div>
    {banners.length > 1 ? <div className="hs-banner__controls"><button onClick={() => setActive((active - 1 + banners.length) % banners.length)} aria-label="Banner anterior"><Icon name="arrow" /></button><div>{banners.map((banner, index) => <button key={banner.id} className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Banner ${index + 1}`} />)}</div><button onClick={() => setActive((active + 1) % banners.length)} aria-label="Próximo banner"><Icon name="arrow" /></button></div> : null}
  </section>;
}

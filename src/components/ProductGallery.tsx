"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductImage } from "@/lib/types";
import Icon from "./Icon";

export default function ProductGallery({ name, cover, images = [] }: { name: string; cover: string | null; images?: ProductImage[] }) {
  const gallery = useMemo(() => {
    const urls = [cover, ...[...images].sort((a, b) => a.sort_order - b.sort_order).map((item) => item.image_url)].filter(Boolean) as string[];
    return [...new Set(urls)];
  }, [cover, images]);
  const [active, setActive] = useState(gallery[0] || "");
  const [failed, setFailed] = useState(false);
  useEffect(() => { setActive(gallery[0] || ""); setFailed(false); }, [gallery]);

  if (!active || failed) return <div className="hs-product-gallery__empty"><Icon name="image" size={38} /><strong>Imagem em breve</strong><small>Confira as informações do produto.</small></div>;
  return <div className="hs-product-gallery">
    <div className="hs-product-gallery__main"><img src={active} alt={name} onError={() => setFailed(true)} /></div>
    {gallery.length > 1 ? <div className="hs-product-gallery__thumbs">{gallery.map((url, index) => <button type="button" className={active === url ? "active" : ""} onClick={() => { setActive(url); setFailed(false); }} key={url}><img src={url} alt={`${name} - imagem ${index + 1}`} /></button>)}</div> : null}
  </div>;
}

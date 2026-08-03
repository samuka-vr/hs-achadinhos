"use client";

import { useMemo, useState } from "react";
import type { ProductImage } from "@/lib/types";
import Icon from "./Icon";

export default function ProductGallery({ name, cover, images = [] }: { name: string; cover: string | null; images?: ProductImage[] }) {
  const gallery = useMemo(() => {
    const urls = [cover, ...images.sort((a, b) => a.sort_order - b.sort_order).map((item) => item.image_url)].filter(Boolean) as string[];
    return [...new Set(urls)];
  }, [cover, images]);
  const [active, setActive] = useState(gallery[0] || "");

  if (!active) return <div className="product-detail-media-pro"><div className="product-placeholder"><Icon name="image" size={38} /><span>Sem imagem</span></div></div>;

  return (
    <div className="product-gallery">
      <div className="product-gallery-main"><img src={active} alt={name} /></div>
      {gallery.length > 1 ? <div className="product-gallery-thumbs">{gallery.map((url, index) => <button type="button" className={active === url ? "active" : ""} onClick={() => setActive(url)} key={url}><img src={url} alt={`${name} - imagem ${index + 1}`} /></button>)}</div> : null}
    </div>
  );
}

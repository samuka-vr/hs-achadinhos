"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function SafeProductImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const source = src?.trim() || "";

  useEffect(() => setFailed(false), [source]);

  if (!source || failed) {
    return (
      <span className={`hs-safe-image-fallback ${className || ""}`} role="img" aria-label={`${alt}: imagem em breve`}>
        <Icon name="image" size={28} />
        <small>Imagem em breve</small>
      </span>
    );
  }

  return (
    <img
      className={className}
      src={source}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

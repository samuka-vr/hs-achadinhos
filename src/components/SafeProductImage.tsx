"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const loadedImageSources = new Set<string>();

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
  const imageRef = useRef<HTMLImageElement>(null);
  const source = src?.trim() || "";
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(() => loadedImageSources.has(source));

  useEffect(() => {
    setFailed(false);
    setLoaded(loadedImageSources.has(source));

    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      loadedImageSources.add(source);
      setLoaded(true);
    }
  }, [source]);

  if (!source || failed) {
    return (
      <span
        className={`hs-safe-image-fallback ${className || ""}`}
        role="img"
        aria-label={`${alt}: imagem em breve`}
      >
        <Icon name="image" size={28} />
        <small>Imagem em breve</small>
      </span>
    );
  }

  return (
    <img
      ref={imageRef}
      className={`hs-safe-image ${loaded ? "is-loaded" : "is-loading"} ${className || ""}`.trim()}
      src={source}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onLoad={(event) => {
        loadedImageSources.add(source);
        void event.currentTarget.decode?.().catch(() => undefined);
        setLoaded(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}

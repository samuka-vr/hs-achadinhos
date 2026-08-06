"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const loadedImageSources = new Set<string>();
const pendingImageSources = new Map<string, Promise<void>>();

export function preloadProductImage(source?: string | null) {
  const normalized = source?.trim() || "";
  if (!normalized || loadedImageSources.has(normalized)) return Promise.resolve();
  const pending = pendingImageSources.get(normalized);
  if (pending) return pending;

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      loadedImageSources.add(normalized);
      pendingImageSources.delete(normalized);
      resolve();
    };
    image.onerror = () => {
      pendingImageSources.delete(normalized);
      resolve();
    };
    image.src = normalized;
  });

  pendingImageSources.set(normalized, promise);
  return promise;
}

export default function SafeProductImage({
  src,
  alt,
  className,
  eager = false,
  fade = true,
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
  fade?: boolean;
  sizes?: string;
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
        className={`hs-safe-image-fallback ${className || ""}`.trim()}
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
      className={`hs-safe-image ${loaded ? "is-loaded" : "is-loading"} ${fade ? "with-fade" : "without-fade"} ${className || ""}`.trim()}
      src={source}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      sizes={sizes}
      onLoad={(event) => {
        loadedImageSources.add(source);
        setLoaded(true);
        void event.currentTarget.decode?.().catch(() => undefined);
      }}
      onError={() => setFailed(true)}
    />
  );
}

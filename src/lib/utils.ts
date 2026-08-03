import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  hero_title: "Achadinhos que valem a pena",
  hero_subtitle: "Uma seleção prática de produtos para facilitar sua busca na Shopee.",
  whatsapp: "",
  instagram: "",
  products_per_page: 24,
};

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseSettings(rows: Array<{ key: string; value: unknown }> | null) {
  const settings = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const row of rows ?? []) settings[row.key] = row.value;
  return settings as unknown as SiteSettings;
}

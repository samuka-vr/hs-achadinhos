import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  logo_url: "/brand/hs-logo.png",
  favicon_url: "/brand/hs-logo.png",
  hero_eyebrow: "Curadoria feita para você",
  hero_title: "Achadinhos que combinam com a sua rotina",
  hero_subtitle: "Produtos selecionados, organizados e prontos para você conferir com segurança na Shopee.",
  hero_button_text: "Explorar achadinhos",
  hero_image_url: "/brand/hs-logo.png",
  announcement_enabled: true,
  announcement_text: "Novos achadinhos adicionados toda semana",
  announcement_url: "#novidades",
  coverflow_enabled: true,
  coverflow_title: "Descubra algo novo",
  coverflow_subtitle: "Uma vitrine dinâmica com produtos escolhidos em ordem diferente a cada visita.",
  footer_description: "Uma curadoria independente de produtos encontrados na Shopee para facilitar suas escolhas.",
  primary_color: "#e98791",
  secondary_color: "#f7cfd2",
  whatsapp: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  facebook: "",
  telegram: "",
  email: "",
  products_per_page: 24,
};

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function parseSettings(rows: Array<{ key: string; value: unknown }> | null) {
  const settings = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const row of rows ?? []) settings[row.key] = row.value;
  return settings as unknown as SiteSettings;
}

export function discountPercentage(currentPrice: number | null, oldPrice: number | null) {
  if (!currentPrice || !oldPrice || oldPrice <= currentPrice) return null;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
}

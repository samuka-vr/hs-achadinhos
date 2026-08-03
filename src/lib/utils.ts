import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  header_tagline: "Achadinhos da Shopee",
  logo_url: "/brand/hs-logo.png",
  favicon_url: "/brand/hs-logo.png",
  hero_eyebrow: "Escolhas da semana",
  hero_title: "Produtos legais, sem enrolação",
  hero_subtitle: "A gente organiza os links para você encontrar rápido o que procura.",
  hero_button_text: "Ver produtos",
  hero_image_url: "/brand/hs-logo.png",
  announcement_enabled: false,
  announcement_text: "Novos produtos entrando por aqui",
  announcement_url: "#novidades",
  coverflow_enabled: true,
  coverflow_title: "Dá uma olhada nesses",
  coverflow_subtitle: "Os produtos mudam de ordem a cada visita.",
  footer_description: "Links organizados para facilitar sua busca na Shopee.",
  primary_color: "#ef5b67",
  secondary_color: "#fff0f1",
  whatsapp: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  facebook: "",
  telegram: "",
  email: "",
  products_per_page: 24,
  show_categories: true,
  show_trending: true,
  show_newest: true,
  show_catalog: true,
  carousel_speed: 4200,
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

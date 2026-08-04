import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  header_tagline: "Achou no vídeo. Encontrou aqui.",
  logo_url: "/brand/hs-monogram.svg",
  favicon_url: "/brand/hs-monogram.svg",
  hero_eyebrow: "LINK DA BIO",
  hero_title: "Achou no vídeo? Está aqui.",
  hero_subtitle: "Pesquise pelo nome ou pelo código que apareceu no vídeo.",
  hero_button_text: "Ver últimos produtos",
  hero_image_url: "/brand/hs-monogram.svg",
  announcement_enabled: false,
  announcement_text: "Novos produtos por aqui",
  announcement_url: "#produtos-dos-videos",
  coverflow_enabled: true,
  coverflow_title: "Produtos dos últimos vídeos",
  coverflow_subtitle: "Os links mais recentes ficam primeiro.",
  footer_description: "",
  footer_title: "",
  footer_note: "",
  primary_color: "#c96f78",
  secondary_color: "#f8efec",
  accent_color: "#f5dfe1",
  background_color: "#fffdfc",
  surface_color: "#ffffff",
  text_color: "#242122",
  muted_text_color: "#756e70",
  border_color: "#eae2e0",
  button_text_color: "#ffffff",
  font_family: "Manrope",
  heading_font_family: "Manrope",
  container_width: 1240,
  corner_radius: 20,
  card_style: "soft",
  header_style: "compact",
  sticky_header: true,
  show_header_search: true,
  show_prices: true,
  show_product_codes: true,
  show_click_count: false,
  product_columns_mobile: 2,
  product_columns_desktop: 4,
  seo_title: "H&S Achadinhos | Produtos encontrados na Shopee",
  seo_description: "Encontre os produtos divulgados nos nossos vídeos e acesse os links direto na Shopee.",
  og_image_url: "/brand/hs-monogram.svg",
  custom_css: "",
  whatsapp: "",
  instagram: "",
  shopee_showcase: "",
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
  carousel_speed: 5000,
};

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

export function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

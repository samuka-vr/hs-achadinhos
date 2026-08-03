import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  header_tagline: "Achadinhos da Shopee",
  logo_url: "/brand/hs-logo.png",
  favicon_url: "/brand/hs-logo.png",
  hero_eyebrow: "Link da bio",
  hero_title: "Encontre o produto do vídeo",
  hero_subtitle: "Digite o nome ou o código que apareceu no conteúdo.",
  hero_button_text: "Ver últimos produtos",
  hero_image_url: "/brand/hs-logo.png",
  announcement_enabled: false,
  announcement_text: "Novos produtos por aqui",
  announcement_url: "#produtos-dos-videos",
  coverflow_enabled: true,
  coverflow_title: "Produtos dos últimos vídeos",
  coverflow_subtitle: "Os links mais recentes ficam primeiro.",
  footer_description: "Produtos divulgados nos nossos vídeos, organizados para você encontrar rápido.",
  footer_title: "Seus achadinhos em um só lugar",
  footer_note: "Alguns links podem gerar comissão de afiliado, sem custo extra para você.",
  primary_color: "#e87378",
  secondary_color: "#fff5f2",
  accent_color: "#f4b5b3",
  background_color: "#fffdfc",
  surface_color: "#ffffff",
  text_color: "#242223",
  muted_text_color: "#746d70",
  border_color: "#eee5e3",
  button_text_color: "#ffffff",
  font_family: "Inter",
  heading_font_family: "Inter",
  container_width: 1200,
  corner_radius: 18,
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
  og_image_url: "/brand/hs-logo.png",
  custom_css: "",
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

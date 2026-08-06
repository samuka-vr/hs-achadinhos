import type { SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "H&S Achadinhos",
  header_tagline: "Achou no vídeo. Encontrou aqui.",
  logo_url: "/brand/hs-monogram.svg",
  favicon_url: "/brand/hs-monogram.svg",
  hero_eyebrow: "H&S ACHADINHOS",
  hero_title: "Viu no vídeo? Encontre aqui.",
  hero_subtitle: "Busque pelo nome ou pelo código e chegue direto ao produto certo.",
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
  primary_color: "#d96c78",
  secondary_color: "#f3b29f",
  accent_color: "#b7a6ca",
  background_color: "#f6efea",
  surface_color: "#fff9f5",
  text_color: "#2a2224",
  muted_text_color: "#726568",
  border_color: "#e8d9d3",
  button_text_color: "#ffffff",
  button_primary_color: "#8f394d",
  button_primary_hover_color: "#742d3f",
  button_secondary_color: "#fff3f0",
  button_secondary_text_color: "#8f394d",
  link_color: "#9f4357",
  success_color: "#2f7d5b",
  danger_color: "#b5475a",
  font_family: "Inter",
  heading_font_family: "Georgia",
  container_width: 1240,
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
  maintenance_mode: false,
  maintenance_title: "Estamos organizando novos achadinhos",
  maintenance_message: "Voltamos em breve. Acompanhe nossas redes sociais para novidades.",
  catalog_empty_title: "Nenhum produto encontrado",
  catalog_empty_message: "Tente outra busca ou escolha uma categoria.",
  footer_social_title: "Acompanhe os próximos achados",
  footer_social_subtitle: "Vídeos novos, produtos novos e links organizados.",
  admin_notes: "",
  button_style: "rounded",
  product_image_ratio: "square",
  section_spacing: 72,
  animations_enabled: true,
  shadow_strength: 7,
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

export function getProductPriceDisplay(product: {
  current_price: number | null;
  old_price: number | null;
  badge?: string | null;
}) {
  const current = formatPrice(product.current_price);
  const secondary = formatPrice(product.old_price);
  const badge = product.badge || "";
  const promotional = /oferta|desconto|promo/i.test(badge);

  if (!current) return { main: "Ver preço na Shopee", secondary: "", mode: "hidden" as const };
  if (secondary && product.old_price && product.current_price && product.old_price > product.current_price) {
    if (promotional) return { main: current, secondary, mode: "promotion" as const };
    return { main: `${current} a ${secondary}`, secondary: "", mode: "range" as const };
  }
  if (/a partir/i.test(badge)) return { main: `A partir de ${current}`, secondary: "", mode: "from" as const };
  return { main: current, secondary: "", mode: "fixed" as const };
}

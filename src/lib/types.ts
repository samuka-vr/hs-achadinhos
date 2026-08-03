export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  description: string | null;
  accent_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  product_code: string | null;
  affiliate_url: string;
  image_url: string | null;
  current_price: number | null;
  old_price: number | null;
  short_description: string | null;
  tags: string[];
  badge: string | null;
  is_featured: boolean;
  is_video_product: boolean;
  is_pinned: boolean;
  video_url: string | null;
  video_posted_at: string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
  product_images?: ProductImage[];
};

export type SiteSettings = {
  site_name: string;
  header_tagline: string;
  logo_url: string;
  favicon_url: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_image_url: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_url: string;
  coverflow_enabled: boolean;
  coverflow_title: string;
  coverflow_subtitle: string;
  footer_description: string;
  footer_title: string;
  footer_note: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  muted_text_color: string;
  border_color: string;
  button_text_color: string;
  font_family: string;
  heading_font_family: string;
  container_width: number;
  corner_radius: number;
  card_style: "flat" | "soft" | "outlined";
  header_style: "compact" | "centered" | "minimal";
  sticky_header: boolean;
  show_header_search: boolean;
  show_prices: boolean;
  show_product_codes: boolean;
  show_click_count: boolean;
  product_columns_mobile: number;
  product_columns_desktop: number;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  custom_css: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  facebook: string;
  telegram: string;
  email: string;
  products_per_page: number;
  show_categories: boolean;
  show_trending: boolean;
  show_newest: boolean;
  show_catalog: boolean;
  carousel_speed: number;
};

export type HomeSection = {
  id: string;
  section_key: string;
  section_type: "hero" | "banners" | "video_products" | "categories" | "newest" | "trending" | "catalog" | "custom_text";
  title: string;
  subtitle: string;
  eyebrow: string;
  is_enabled: boolean;
  sort_order: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  mobile_image_url: string | null;
  button_text: string;
  button_url: string;
  text_position: "left" | "center" | "right";
  text_color: string;
  overlay_strength: number;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NavigationItem = {
  id: string;
  label: string;
  url: string;
  location: "header" | "mobile" | "footer";
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  open_new_tab: boolean;
  created_at: string;
  updated_at: string;
};

export type SearchEvent = {
  id: string;
  query: string;
  results_count: number;
  searched_at: string;
  referrer: string | null;
  user_agent: string | null;
};

export type ProductClick = {
  id: string;
  product_id: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
};

export type ContentPage = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  image_url: string | null;
  button_text: string;
  button_url: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

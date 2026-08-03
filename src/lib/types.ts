export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  affiliate_url: string;
  image_url: string | null;
  current_price: number | null;
  old_price: number | null;
  short_description: string | null;
  tags: string[];
  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type SiteSettings = {
  site_name: string;
  hero_title: string;
  hero_subtitle: string;
  whatsapp: string;
  instagram: string;
  products_per_page: number;
};

export type ProductClick = {
  id: string;
  product_id: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
};

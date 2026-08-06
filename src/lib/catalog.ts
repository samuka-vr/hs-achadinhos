import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product } from "./types";


export const PUBLIC_PRODUCT_SELECT = "id,category_id,name,slug,product_code,affiliate_url,image_url,current_price,old_price,short_description,tags,badge,is_featured,is_video_product,is_pinned,video_url,video_posted_at,sort_order,seo_title,seo_description,publish_at,unpublish_at,is_active,click_count,created_at,updated_at,categories(id,name,slug)";

export const PUBLIC_PRODUCT_DETAIL_SELECT = "id,category_id,name,slug,product_code,affiliate_url,image_url,current_price,old_price,short_description,tags,badge,is_featured,is_video_product,is_pinned,video_url,video_posted_at,sort_order,seo_title,seo_description,publish_at,unpublish_at,is_active,click_count,created_at,updated_at,categories(id,name,slug),product_images(id,product_id,image_url,sort_order,is_cover,created_at)";


type ProductRelation = Pick<Category, "id" | "name" | "slug">;

type ProductRecord = Omit<Product, "categories"> & {
  categories?: ProductRelation | ProductRelation[] | null;
};

export function normalizeProduct(record: unknown): Product {
  const raw = record as ProductRecord;

  const category = Array.isArray(raw.categories)
    ? raw.categories[0] ?? null
    : raw.categories ?? null;

  return {
    ...raw,
    categories: category,
  };
}

export function normalizeProducts(
  records: unknown[] | null | undefined,
): Product[] {
  return (records ?? []).map(normalizeProduct);
}

export type CatalogSort =
  | "recent"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "price-low"
  | "price-high"
  | "popular";

export type CatalogQuery = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  term?: string;
  sort?: CatalogSort;
};

export type CatalogResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function sanitizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function getCatalogPage(
  supabase: SupabaseClient,
  options: CatalogQuery = {},
): Promise<CatalogResult> {
  const pageSize = Math.min(Math.max(Number(options.pageSize) || 6, 1), 24);
  const page = Math.max(Number(options.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const categoryId = options.categoryId?.trim() || "";
  const term = sanitizeSearch(options.term || "");
  const sort = options.sort || "recent";

  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  if (term) {
    const pattern = `%${term}%`;
    query = query.or(`name.ilike.${pattern},product_code.ilike.${pattern},short_description.ilike.${pattern}`);
  }

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    case "price-low":
      query = query.order("current_price", { ascending: true, nullsFirst: false });
      break;
    case "price-high":
      query = query.order("current_price", { ascending: false, nullsFirst: false });
      break;
    case "popular":
      query = query.order("click_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + pageSize - 1);
  if (error) throw new Error("Não foi possível carregar o catálogo.");

  const total = count || 0;
  return {
    products: normalizeProducts(data),
    total,
    page,
    pageSize,
    hasMore: offset + (data?.length || 0) < total,
  };
}

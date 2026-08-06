import { NextRequest, NextResponse } from "next/server";
import { getCatalogPage, type CatalogSort } from "@/lib/catalog";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedSorts = new Set<CatalogSort>([
  "recent",
  "oldest",
  "name-asc",
  "name-desc",
  "price-low",
  "price-high",
  "popular",
]);

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Catálogo temporariamente indisponível." },
      { status: 503 },
    );
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const pageSize = Math.min(Math.max(Number(params.get("pageSize")) || 6, 1), 24);
  const categoryId = (params.get("category") || "all").slice(0, 80);
  const term = (params.get("q") || "").slice(0, 80);
  const requestedSort = (params.get("sort") || "recent") as CatalogSort;
  const sort = allowedSorts.has(requestedSort) ? requestedSort : "recent";

  try {
    const result = await getCatalogPage(supabase, {
      page,
      pageSize,
      categoryId,
      term,
      sort,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os produtos agora." },
      { status: 500 },
    );
  }
}

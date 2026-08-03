import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = getServerSupabase();
  const fallback = new URL("/", request.url);
  if (!supabase) return NextResponse.redirect(fallback);

  const { data: product } = await supabase.from("products").select("id,affiliate_url,is_active").eq("id", id).eq("is_active", true).maybeSingle();
  if (!product?.affiliate_url) return NextResponse.redirect(fallback);

  let destination: URL;
  try {
    destination = new URL(product.affiliate_url);
    if (destination.protocol !== "https:") throw new Error("URL insegura");
  } catch {
    return NextResponse.redirect(fallback);
  }

  const cookieName = `hs_click_${id.slice(0, 12)}`;
  const recentlyTracked = request.cookies.get(cookieName)?.value === "1";
  if (!recentlyTracked) {
    await supabase.rpc("register_product_click", {
      p_product_id: id,
      p_referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
      p_user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(cookieName, "1", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 4, path: "/" });
  return response;
}

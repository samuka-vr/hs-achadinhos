import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isAllowedAffiliateUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const fallback = new URL("/?link=indisponivel", request.url);
  const supabase = getServerSupabase();
  if (!supabase || !id) return NextResponse.redirect(fallback);

  const { data: product, error } = await supabase
    .from("products")
    .select("id,affiliate_url,is_active")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product?.affiliate_url || !isAllowedAffiliateUrl(product.affiliate_url)) {
    return NextResponse.redirect(fallback);
  }

  const cookieName = `hs_click_${id.slice(0, 12)}`;
  const recentlyTracked = request.cookies.get(cookieName)?.value === "1";
  if (!recentlyTracked) {
    await supabase.rpc("register_product_click", {
      p_product_id: id,
      p_referrer: request.headers.get("referer")?.slice(0, 300) ?? null,
      p_user_agent: request.headers.get("user-agent")?.slice(0, 180) ?? null,
    });
  }

  const response = NextResponse.redirect(new URL(product.affiliate_url));
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 15 * 60,
    path: "/",
  });
  return response;
}

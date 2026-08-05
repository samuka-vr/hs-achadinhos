import type { MetadataRoute } from "next";
import { safeSiteUrl } from "@/lib/security";

export default function robots(): MetadataRoute.Robots {
  const site = safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL).toString().replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/go/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}

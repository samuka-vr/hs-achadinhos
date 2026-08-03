import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSettings } from "@/lib/utils";
import "./globals.css";
export async function generateMetadata():Promise<Metadata>{const supabase=getServerSupabase();const result=supabase?await supabase.from("site_settings").select("key,value"):{data:null};const settings=parseSettings(result.data);const icon=settings.favicon_url||settings.logo_url||"/brand/hs-logo.png";return{title:{default:settings.seo_title||settings.site_name,template:`%s | ${settings.site_name}`},description:settings.seo_description||settings.hero_subtitle,metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),icons:{icon,apple:icon},openGraph:{title:settings.seo_title||settings.site_name,description:settings.seo_description,images:settings.og_image_url?[settings.og_image_url]:[]},twitter:{card:"summary_large_image",title:settings.seo_title||settings.site_name,description:settings.seo_description,images:settings.og_image_url?[settings.og_image_url]:[]}}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}

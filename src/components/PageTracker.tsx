"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
export default function PageTracker(){const pathname=usePathname();useEffect(()=>{const supabase=getBrowserSupabase();if(!supabase)return;void supabase.rpc("register_page_view",{p_path:pathname,p_referrer:document.referrer||null,p_user_agent:navigator.userAgent});},[pathname]);return null;}

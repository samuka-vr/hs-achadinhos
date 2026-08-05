"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !pathname || pathname.startsWith("/admin")) return;

    const storageKey = `hs_page_view:${pathname}`;
    const previous = Number(sessionStorage.getItem(storageKey) || 0);
    if (Date.now() - previous < DEDUPE_WINDOW_MS) return;
    sessionStorage.setItem(storageKey, String(Date.now()));

    void supabase.rpc("register_page_view", {
      p_path: pathname.slice(0, 240),
      p_referrer: document.referrer?.slice(0, 300) || null,
      p_user_agent: navigator.userAgent.slice(0, 180),
    });
  }, [pathname]);

  return null;
}

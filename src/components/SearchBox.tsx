"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatPrice, normalizeSearch } from "@/lib/utils";
import Icon from "./Icon";

type SearchItem = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  current_price: number | null;
  product_code: string | null;
  type: "product" | "category";
};

export default function SearchBox({ variant = "header" }: { variant?: "header" | "hero" }) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTerm(""); setOpen(false); setResults([]); }, [pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const query = term.trim();
    const requestId = ++requestRef.current;
    if (query.length < 2) { setResults([]); setLoading(false); return; }

    const timer = window.setTimeout(async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) { setLoading(false); return; }
      const pattern = `%${query.replace(/[,%()]/g, " ")}%`;
      setLoading(true);
      try {
        const [byName, byCode, categories] = await Promise.all([
          supabase.from("products").select("id,name,slug,image_url,current_price,product_code").eq("is_active", true).ilike("name", pattern).limit(6),
          supabase.from("products").select("id,name,slug,image_url,current_price,product_code").eq("is_active", true).ilike("product_code", pattern).limit(4),
          supabase.from("categories").select("id,name,slug,image_url").eq("is_active", true).ilike("name", pattern).limit(3),
        ]);
        if (requestId !== requestRef.current) return;
        const productMap = new Map<string, SearchItem>();
        [...(byCode.data ?? []), ...(byName.data ?? [])].forEach((item) => productMap.set(item.id, { ...item, type: "product" }));
        const categoryItems: SearchItem[] = (categories.data ?? []).map((item) => ({ ...item, current_price: null, product_code: null, type: "category" }));
        setResults([...productMap.values(), ...categoryItems].slice(0, 8));
        setOpen(true);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [term]);

  const normalizedCount = useMemo(() => results.filter((item) => item.type === "product").length, [results]);

  async function track(value: string, count: number) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.rpc("register_search_event", {
      p_query: value.slice(0, 120),
      p_results_count: count,
      p_referrer: document.referrer?.slice(0, 300) || null,
      p_user_agent: navigator.userAgent.slice(0, 180),
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = term.trim();
    if (!value) return;
    void track(value, normalizedCount);
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className={`hs-search hs-search--${variant}`} ref={rootRef}>
      <form role="search" onSubmit={submit}>
        <span className="hs-search__icon"><Icon name="search" size={21} /></span>
        <label className="sr-only" htmlFor={`hs-search-${variant}`}>Buscar produto</label>
        <input
          id={`hs-search-${variant}`}
          value={term}
          onChange={(event) => { setTerm(event.target.value); setOpen(true); }}
          onFocus={() => term.trim().length >= 2 && setOpen(true)}
          placeholder={variant === "hero" ? "Digite o nome ou o código A001" : "Nome ou código"}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit"><span>Buscar</span><Icon name="arrow" size={17} /></button>
      </form>

      {open && term.trim().length >= 2 ? (
        <div className="hs-search__popover" role="region" aria-live="polite" aria-label="Sugestões de busca">
          <div className="hs-search__popover-head"><span>{loading ? "Buscando" : "Sugestões"}</span><small>{results.length}</small></div>
          {loading ? <div className="hs-search__loading"><i /><span>Procurando no catálogo...</span></div> : null}
          {!loading && results.map((item) => (
            <Link key={`${item.type}-${item.id}`} href={item.type === "product" ? `/produto/${item.slug}` : `/categoria/${item.slug}`} onClick={() => { void track(term, normalizedCount); setOpen(false); }}>
              <span className="hs-search__thumb">{item.image_url ? <img src={item.image_url} alt="" /> : <Icon name={item.type === "product" ? "products" : "categories"} />}</span>
              <span className="hs-search__copy"><strong>{item.name}</strong><small>{item.type === "product" ? `${item.product_code ? `${item.product_code} · ` : ""}${formatPrice(item.current_price) || "Ver produto"}` : "Abrir categoria"}</small></span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
          {!loading && !results.length ? <div className="hs-search__empty"><Icon name="search" /><strong>Nenhum resultado</strong><small>Tente outro nome ou confira o código.</small></div> : null}
          {!loading ? <button className="hs-search__all" type="button" onClick={() => router.push(`/busca?q=${encodeURIComponent(term.trim())}`)}>Ver todos os resultados</button> : null}
        </div>
      ) : null}
    </div>
  );
}

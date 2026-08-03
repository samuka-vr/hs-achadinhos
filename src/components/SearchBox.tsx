"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatPrice, normalizeSearch } from "@/lib/utils";

type SearchItem = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  current_price: number | null;
  type: "product" | "category";
};

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState("");
  const [catalog, setCatalog] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTerm("");
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function loadCatalog() {
    if (loaded) return;
    setLoaded(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("id,name,slug,image_url,current_price").eq("is_active", true).limit(1000),
      supabase.from("categories").select("id,name,slug,image_url").eq("is_active", true).order("sort_order").limit(200),
    ]);
    const products: SearchItem[] = (productsResult.data ?? []).map((item) => ({ ...item, type: "product" as const }));
    const categories: SearchItem[] = (categoriesResult.data ?? []).map((item) => ({ ...item, current_price: null, type: "category" as const }));
    setCatalog([...products, ...categories]);
  }

  const results = useMemo(() => {
    const normalized = normalizeSearch(term);
    if (normalized.length < 2) return [];
    return catalog
      .filter((item) => normalizeSearch(item.name).includes(normalized))
      .slice(0, 7);
  }, [catalog, term]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = term.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="search-wrap" ref={boxRef}>
      <form role="search" onSubmit={submit}>
        <input
          className="search-input"
          value={term}
          onChange={(event) => { setTerm(event.target.value); setOpen(true); }}
          onFocus={() => { void loadCatalog(); setOpen(true); }}
          placeholder="Buscar produtos..."
          aria-label="Buscar produtos"
          autoComplete="off"
        />
        <button className="search-submit" type="submit" aria-label="Pesquisar">⌕</button>
      </form>
      {open && term.trim().length >= 2 ? (
        <div className="suggestions" role="listbox">
          {results.length ? results.map((item) => (
            <Link
              className="suggestion"
              key={`${item.type}-${item.id}`}
              href={item.type === "product" ? `/produto/${item.slug}` : `/categoria/${item.slug}`}
              onClick={() => setOpen(false)}
            >
              {item.image_url ? <img className="suggestion-thumb" src={item.image_url} alt="" /> : <div className="suggestion-thumb" />}
              <span className="suggestion-meta">
                <strong>{item.name}</strong>
                <small>{item.type === "product" ? formatPrice(item.current_price) ?? "Produto" : "Categoria"}</small>
              </span>
            </Link>
          )) : <div className="suggestion"><span className="suggestion-meta"><strong>Nenhum resultado</strong><small>Tente outra palavra.</small></span></div>}
        </div>
      ) : null}
    </div>
  );
}

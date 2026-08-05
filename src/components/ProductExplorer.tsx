"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { normalizeSearch } from "@/lib/utils";
import ProductGrid from "./ProductGrid";
import Icon from "./Icon";

export default function ProductExplorer({ products, categories, pageSize, showSearch = true }: { products: Product[]; categories: Category[]; pageSize: number; showSearch?: boolean }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [term, setTerm] = useState("");
  const [visible, setVisible] = useState(pageSize);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(term);
    const list = products.filter((product) => {
      const categoryMatch = category === "all" || product.category_id === category;
      const text = normalizeSearch([product.name, product.product_code || "", product.short_description || "", product.categories?.name || "", ...(product.tags || [])].join(" "));
      return categoryMatch && (!normalized || text.includes(normalized));
    });
    if (sort === "popular") return [...list].sort((a, b) => b.click_count - a.click_count);
    if (sort === "price-low") return [...list].sort((a, b) => (a.current_price ?? Number.MAX_SAFE_INTEGER) - (b.current_price ?? Number.MAX_SAFE_INTEGER));
    if (sort === "price-high") return [...list].sort((a, b) => (b.current_price ?? -1) - (a.current_price ?? -1));
    return [...list].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [category, products, sort, term]);

  const resetVisible = () => setVisible(pageSize);
  return <div className="hs-catalog">
    <div className={`hs-catalog__toolbar ${showSearch ? "" : "without-search"}`}>
      {showSearch ? <label className="hs-catalog__search"><span className="sr-only">Filtrar produtos</span><Icon name="search" /><input value={term} onChange={(event) => { setTerm(event.target.value); resetVisible(); }} placeholder="Filtrar por nome ou código" /></label> : null}
      <button className="hs-catalog__filter-button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><Icon name="filter" />Categorias</button>
      <label className="hs-catalog__sort"><span className="sr-only">Ordenar produtos</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Mais recentes</option><option value="popular">Mais acessados</option><option value="price-low">Menor preço</option><option value="price-high">Maior preço</option></select><Icon name="down" size={16} /></label>
    </div>

    <div className={`hs-catalog__filters ${filtersOpen ? "is-open" : ""}`}>
      <button className={category === "all" ? "active" : ""} onClick={() => { setCategory("all"); resetVisible(); setFiltersOpen(false); }}>Todos</button>
      {categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => { setCategory(item.id); resetVisible(); setFiltersOpen(false); }}>{item.name}</button>)}
    </div>

    <div className="hs-catalog__summary"><span><strong>{filtered.length}</strong> produto(s)</span>{term || category !== "all" ? <button onClick={() => { setTerm(""); setCategory("all"); resetVisible(); }}>Limpar filtros</button> : null}</div>
    <ProductGrid products={filtered.slice(0, visible)} />
    {visible < filtered.length ? <div className="hs-catalog__more"><button onClick={() => setVisible((value) => value + pageSize)}>Mostrar mais <Icon name="down" size={16} /></button></div> : null}
  </div>;
}

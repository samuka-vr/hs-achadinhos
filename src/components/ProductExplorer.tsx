"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { normalizeSearch } from "@/lib/utils";
import ProductGrid from "./ProductGrid";
import Icon from "./Icon";

export default function ProductExplorer({ products, categories, pageSize }: { products: Product[]; categories: Category[]; pageSize: number }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [term, setTerm] = useState("");
  const [visible, setVisible] = useState(pageSize);

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(term);
    const list = products.filter((product) => {
      const matchesCategory = category === "all" || product.category_id === category;
      const haystack = normalizeSearch([product.name, product.short_description || "", product.categories?.name || "", ...(product.tags || [])].join(" "));
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
    switch (sort) {
      case "popular": return list.sort((a, b) => b.click_count - a.click_count);
      case "price-low": return list.sort((a, b) => (a.current_price ?? Number.MAX_SAFE_INTEGER) - (b.current_price ?? Number.MAX_SAFE_INTEGER));
      case "price-high": return list.sort((a, b) => (b.current_price ?? -1) - (a.current_price ?? -1));
      default: return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, category, sort, term]);

  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-search"><Icon name="search" size={18} /><input value={term} onChange={(event) => { setTerm(event.target.value); setVisible(pageSize); }} placeholder="Filtrar nesta vitrine" /></div>
        <select className="select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar produtos">
          <option value="recent">Mais recentes</option><option value="popular">Mais clicados</option><option value="price-low">Menor preço</option><option value="price-high">Maior preço</option>
        </select>
      </div>
      <div className="catalog-category-tabs">
        <button className={category === "all" ? "active" : ""} onClick={() => { setCategory("all"); setVisible(pageSize); }}>Todos</button>
        {categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => { setCategory(item.id); setVisible(pageSize); }}>{item.icon ? <span>{item.icon}</span> : null}{item.name}</button>)}
      </div>
      <div className="catalog-result-line"><strong>{filtered.length}</strong> produto(s) encontrados</div>
      <ProductGrid products={filtered.slice(0, visible)} />
      {visible < filtered.length ? <div className="load-more-wrap"><button className="button secondary" onClick={() => setVisible((value) => value + pageSize)}>Carregar mais produtos</button></div> : null}
    </>
  );
}

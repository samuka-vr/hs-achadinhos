"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";

export default function ProductExplorer({ products, categories, pageSize }: { products: Product[]; categories: Category[]; pageSize: number }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [visible, setVisible] = useState(pageSize);

  const filtered = useMemo(() => {
    const list = category === "all" ? [...products] : products.filter((product) => product.category_id === category);
    switch (sort) {
      case "popular": return list.sort((a, b) => b.click_count - a.click_count);
      case "price-low": return list.sort((a, b) => (a.current_price ?? Number.MAX_SAFE_INTEGER) - (b.current_price ?? Number.MAX_SAFE_INTEGER));
      case "price-high": return list.sort((a, b) => (b.current_price ?? -1) - (a.current_price ?? -1));
      default: return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, category, sort]);

  return (
    <>
      <div className="filters">
        <select className="select" value={category} onChange={(e) => { setCategory(e.target.value); setVisible(pageSize); }} aria-label="Filtrar por categoria">
          <option value="all">Todas as categorias</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar produtos">
          <option value="recent">Mais recentes</option>
          <option value="popular">Mais clicados</option>
          <option value="price-low">Menor preço</option>
          <option value="price-high">Maior preço</option>
        </select>
      </div>
      <ProductGrid products={filtered.slice(0, visible)} />
      {visible < filtered.length ? <div style={{ textAlign: "center", marginTop: 22 }}><button className="button secondary" onClick={() => setVisible((value) => value + pageSize)}>Carregar mais</button></div> : null}
    </>
  );
}

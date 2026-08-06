"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";
import Icon from "./Icon";

type CatalogResponse = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
};

export default function ProductExplorer({
  initialProducts,
  initialTotal,
  categories,
  pageSize = 6,
  showSearch = true,
  fixedCategoryId,
  initialTerm = "",
}: {
  initialProducts: Product[];
  initialTotal: number;
  categories: Category[];
  pageSize?: number;
  showSearch?: boolean;
  fixedCategoryId?: string;
  initialTerm?: string;
}) {
  const initialRenderRef = useRef(true);
  const activeRequestRef = useRef<AbortController | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(fixedCategoryId || "all");
  const [sort, setSort] = useState("recent");
  const [term, setTerm] = useState(initialTerm);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean, signal?: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
        category,
        sort,
      });
      if (term.trim()) params.set("q", term.trim());

      const response = await fetch(`/api/catalog?${params.toString()}`, {
        signal,
        cache: "no-store",
      });
      const payload = (await response.json()) as CatalogResponse;
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os produtos.");

      setProducts((current) => (append ? [...current, ...payload.products] : payload.products));
      setTotal(payload.total);
      setPage(payload.page);
      return payload;
    },
    [category, pageSize, sort, term],
  );

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        await fetchPage(1, false, controller.signal);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os produtos.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, term.trim() ? 280 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, fetchPage, sort, term]);

  async function loadMore() {
    if (loadingMore || products.length >= total) return;
    setLoadingMore(true);
    setError("");
    try {
      await fetchPage(page + 1, true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar mais produtos.");
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setTerm("");
    if (!fixedCategoryId) setCategory("all");
    setSort("recent");
    setFiltersOpen(false);
  }

  const hasActiveFilters = Boolean(term.trim()) || (!fixedCategoryId && category !== "all") || sort !== "recent";
  const hasMore = products.length < total;

  return (
    <div className="hs-catalog">
      <div className={`hs-catalog__toolbar ${showSearch ? "" : "without-search"} ${fixedCategoryId ? "fixed-category" : ""}`}>
        {showSearch ? (
          <label className="hs-catalog__search">
            <span className="sr-only">Filtrar produtos</span>
            <Icon name="search" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nome ou código"
              enterKeyHint="search"
            />
            {term ? (
              <button type="button" onClick={() => setTerm("")} aria-label="Limpar busca">
                <Icon name="close" size={16} />
              </button>
            ) : null}
          </label>
        ) : null}

        {!fixedCategoryId ? (
          <button
            type="button"
            className="hs-catalog__filter-button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            aria-controls="catalog-category-filters"
          >
            <Icon name="filter" />
            <span>Categorias</span>
            {category !== "all" ? <b>1</b> : null}
          </button>
        ) : null}

        <label className="hs-catalog__sort">
          <span className="sr-only">Ordenar produtos</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name-asc">Nome A–Z</option>
            <option value="name-desc">Nome Z–A</option>
            <option value="popular">Mais acessados</option>
            <option value="price-low">Menor preço</option>
            <option value="price-high">Maior preço</option>
          </select>
          <Icon name="down" size={16} />
        </label>
      </div>

      {!fixedCategoryId ? <div
        className={`hs-catalog__filters ${filtersOpen ? "is-open" : ""}`}
        id="catalog-category-filters"
      >
        <button
          type="button"
          className={category === "all" ? "active" : ""}
          onClick={() => {
            if (!fixedCategoryId) setCategory("all");
            setFiltersOpen(false);
          }}
        >
          Todas
        </button>
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => {
              setCategory(item.id);
              setFiltersOpen(false);
            }}
          >
            {item.name}
          </button>
        ))}
      </div> : null}

      <div className="hs-catalog__summary" aria-live="polite">
        <span>
          Exibindo <strong>{products.length}</strong> de <strong>{total}</strong> produto(s)
        </span>
        {hasActiveFilters ? <button type="button" onClick={clearFilters}>Limpar filtros</button> : null}
      </div>

      {error ? (
        <div className="hs-inline-error" role="alert">
          <Icon name="warning" />
          <div><strong>Não foi possível atualizar o catálogo</strong><p>{error}</p></div>
          <button type="button" onClick={() => void fetchPage(1, false)}>Tentar novamente</button>
        </div>
      ) : null}

      {loading ? (
        <div className="hs-product-grid hs-product-grid--loading" aria-label="Carregando produtos">
          {Array.from({ length: pageSize }, (_, index) => <span className="hs-product-skeleton" key={index} />)}
        </div>
      ) : (
        <ProductGrid products={products} emptyTitle="Nenhum produto encontrado" />
      )}

      {!loading && hasMore ? (
        <div className="hs-catalog__more">
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? <><span className="hs-button-spinner" />Carregando...</> : <>Ver mais produtos <Icon name="down" size={16} /></>}
          </button>
        </div>
      ) : null}

      {!loading && products.length > 0 && !hasMore ? (
        <p className="hs-catalog__end">Você chegou ao fim do catálogo.</p>
      ) : null}
    </div>
  );
}

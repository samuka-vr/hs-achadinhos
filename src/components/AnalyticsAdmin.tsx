"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import ClicksChart, { type ChartPoint } from "./ClicksChart";
import Icon from "./Icon";

type ProductRow = { id: string; name: string; image_url: string | null; click_count: number; product_code: string | null; categories: { name: string } | null };
type ClickRow = { clicked_at: string; product_id: string };
type SearchRow = { query: string; results_count: number; searched_at: string };
type ViewRow = { path: string; viewed_at: string; referrer: string | null };

export default function AnalyticsAdmin() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 89);
      const [p, c, s, v] = await Promise.all([
        supabase.from("products").select("id,name,image_url,click_count,product_code,categories(name)").order("click_count", { ascending: false }).limit(100),
        supabase.from("product_clicks").select("clicked_at,product_id").gte("clicked_at", since.toISOString()).limit(10000),
        supabase.from("search_events").select("query,results_count,searched_at").gte("searched_at", since.toISOString()).limit(10000),
        supabase.from("page_views").select("path,viewed_at,referrer").gte("viewed_at", since.toISOString()).limit(10000),
      ]);
      if (p.error || c.error || s.error || v.error) setError("Algumas métricas não puderam ser carregadas.");
      setProducts((p.data ?? []) as unknown as ProductRow[]);
      setClicks((c.data ?? []) as ClickRow[]);
      setSearches((s.data ?? []) as SearchRow[]);
      setViews((v.data ?? []) as ViewRow[]);
      setLoading(false);
    })();
  }, []);

  const data = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - (range - 1));
    since.setHours(0, 0, 0, 0);
    const filteredClicks = clicks.filter((item) => new Date(item.clicked_at) >= since);
    const filteredViews = views.filter((item) => new Date(item.viewed_at) >= since);
    const filteredSearches = searches.filter((item) => new Date(item.searched_at) >= since);
    const points: ChartPoint[] = [];
    for (let index = range - 1; index >= 0; index -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - index);
      const key = day.toISOString().slice(0, 10);
      points.push({ date: key, clicks: filteredClicks.filter((item) => item.clicked_at.slice(0, 10) === key).length });
    }
    const queryMap = new Map<string, { label: string; count: number; zero: number }>();
    filteredSearches.forEach((item) => {
      const key = item.query.trim().toLowerCase();
      if (!key) return;
      const current = queryMap.get(key) || { label: item.query.trim(), count: 0, zero: 0 };
      current.count += 1;
      if (item.results_count === 0) current.zero += 1;
      queryMap.set(key, current);
    });
    const topQueries = [...queryMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);
    const sources = new Map<string, number>();
    filteredViews.forEach((item) => {
      let source = "Direto";
      try { if (item.referrer) source = new URL(item.referrer).hostname.replace("www.", ""); } catch {}
      sources.set(source, (sources.get(source) || 0) + 1);
    });
    return {
      filteredClicks,
      filteredViews,
      filteredSearches,
      zeroCount: filteredSearches.filter((item) => item.results_count === 0).length,
      points,
      topQueries,
      sources: [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [clicks, range, searches, views]);

  if (loading) return <div className="admin-loading-inline">Carregando analytics...</div>;

  return <>
    <div className="admin-page-heading-ui">
      <div><span>RESULTADOS</span><h1>Analytics</h1><p>Entenda visitas, cliques, produtos e pesquisas sem complicação.</p></div>
      <div className="product-heading-actions"><Link className="admin-button-ui secondary" href="/admin/buscas"><Icon name="search" />Buscas sem resultado</Link><select className="range-select-ui" value={range} onChange={(event) => setRange(Number(event.target.value))}><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select></div>
    </div>
    {error ? <div className="admin-alert-ui error">{error}</div> : null}
    <div className="analytics-stats-ui">
      <article><Icon name="eye" /><span><small>Visualizações</small><strong>{data.filteredViews.length}</strong></span></article>
      <article><Icon name="click" /><span><small>Cliques na Shopee</small><strong>{data.filteredClicks.length}</strong></span></article>
      <article><Icon name="search" /><span><small>Pesquisas</small><strong>{data.filteredSearches.length}</strong></span></article>
      <Link href="/admin/buscas"><Icon name="warning" /><span><small>Sem resultado</small><strong>{data.zeroCount}</strong></span><Icon name="arrow" size={16} /></Link>
    </div>
    <div className="analytics-grid-ui">
      <section className="admin-card-ui span-2"><div className="admin-card-head-ui"><div><small>DESEMPENHO</small><h2>Cliques por dia</h2></div></div><ClicksChart data={data.points} /></section>
      <section className="admin-card-ui"><div className="admin-card-head-ui"><div><small>PRODUTOS</small><h2>Mais clicados</h2></div></div><div className="ranking-ui">{products.slice(0, 8).map((product, index) => <div key={product.id}><b>{index + 1}</b>{product.image_url ? <img src={product.image_url} alt="" /> : <span />}<div><strong>{product.name}</strong><small>{product.product_code ? `Código ${product.product_code} • ` : ""}{product.categories?.name}</small></div><em>{product.click_count}</em></div>)}</div></section>
      <section className="admin-card-ui"><div className="admin-card-head-ui"><div><small>BUSCA</small><h2>Termos pesquisados</h2></div><Link href="/admin/buscas">Gerenciar</Link></div><div className="query-list-ui">{data.topQueries.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.count} busca(s)</span>{item.zero ? <em>{item.zero} sem resultado</em> : <em className="ok">Encontrado</em>}</div>)}</div></section>
      <section className="admin-card-ui"><div className="admin-card-head-ui"><div><small>ORIGEM</small><h2>De onde vieram</h2></div></div><div className="source-list-ui">{data.sources.map(([source, count]) => <div key={source}><span>{source}</span><strong>{count}</strong></div>)}</div></section>
    </div>
  </>;
}

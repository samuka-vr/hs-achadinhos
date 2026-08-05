"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ClicksChart, { type ChartPoint } from "@/components/ClicksChart";
import Icon from "@/components/Icon";
import { getBrowserSupabase } from "@/lib/supabase/client";

type ProductRow = { id: string; name: string; image_url: string | null; click_count: number; is_active: boolean; is_video_product: boolean; product_code: string | null; affiliate_url: string; categories: { name: string } | null };
type ClickRow = { clicked_at: string };
type SearchRow = { query: string; results_count: number; searched_at: string };
type ViewRow = { viewed_at: string };

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const since = new Date(); since.setDate(since.getDate() - 29);
      const [p, c, cl, s, v] = await Promise.all([
        supabase.from("products").select("id,name,image_url,click_count,is_active,is_video_product,product_code,affiliate_url,categories(name)").order("click_count", { ascending: false }),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("product_clicks").select("clicked_at").gte("clicked_at", since.toISOString()),
        supabase.from("search_events").select("query,results_count,searched_at").gte("searched_at", since.toISOString()),
        supabase.from("page_views").select("viewed_at").gte("viewed_at", since.toISOString()),
      ]);
      if (p.error) setError("Alguns dados não puderam ser carregados.");
      setProducts((p.data ?? []) as unknown as ProductRow[]);
      setCategoryCount(c.count ?? 0);
      setClicks((cl.data ?? []) as ClickRow[]);
      setSearches((s.data ?? []) as SearchRow[]);
      setViews((v.data ?? []) as ViewRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seven = new Date(today); seven.setDate(seven.getDate() - 6);
    const points: ChartPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(today); day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      points.push({ date: key, clicks: clicks.filter((item) => item.clicked_at.slice(0, 10) === key).length });
    }
    const queries = new Map<string, number>();
    searches.forEach((item) => queries.set(item.query.toLowerCase(), (queries.get(item.query.toLowerCase()) || 0) + 1));
    return {
      todayClicks: clicks.filter((item) => new Date(item.clicked_at) >= today).length,
      sevenClicks: clicks.filter((item) => new Date(item.clicked_at) >= seven).length,
      todayViews: views.filter((item) => new Date(item.viewed_at) >= today).length,
      zeroSearches: searches.filter((item) => item.results_count === 0).length,
      points,
      topQueries: [...queries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [clicks, searches, views]);

  if (loading) return <div className="studio-inline-loading"><span /><strong>Organizando seus dados...</strong></div>;

  const published = products.filter((product) => product.is_active).length;
  const videoProducts = products.filter((product) => product.is_video_product).length;
  const problems = products.filter((product) => !product.image_url || !product.affiliate_url || !product.product_code);

  return <>
    <section className="studio-welcome">
      <div><span>VISÃO GERAL</span><h1>Seu site, em um só lugar.</h1><p>Acompanhe o que está funcionando e publique novos achadinhos sem perder tempo.</p></div>
      <div><Link href="/admin/editor" className="studio-button secondary"><Icon name="layout" />Editar página</Link><Link href="/admin/produtos" className="studio-button"><Icon name="plus" />Novo produto</Link></div>
    </section>

    {error ? <div className="studio-alert error">{error}</div> : null}

    <section className="studio-metrics">
      <article><span className="metric-icon rose"><Icon name="products" /></span><div><small>Produtos publicados</small><strong>{published}</strong><em>{videoProducts} dos vídeos</em></div></article>
      <article><span className="metric-icon ink"><Icon name="eye" /></span><div><small>Visitas hoje</small><strong>{stats.todayViews}</strong><em>acessos ao site</em></div></article>
      <article><span className="metric-icon sage"><Icon name="click" /></span><div><small>Cliques hoje</small><strong>{stats.todayClicks}</strong><em>{stats.sevenClicks} nos últimos 7 dias</em></div></article>
      <article><span className="metric-icon amber"><Icon name="search" /></span><div><small>Sem resultado</small><strong>{stats.zeroSearches}</strong><em>buscas para revisar</em></div></article>
    </section>

    <section className="studio-dashboard-grid">
      <article className="studio-panel studio-chart-panel">
        <header><div><span>DESEMPENHO</span><h2>Cliques para a Shopee</h2></div><Link href="/admin/analytics">Abrir analytics <Icon name="arrow" size={15} /></Link></header>
        <ClicksChart data={stats.points} />
      </article>

      <article className="studio-panel studio-quick-panel">
        <header><div><span>ATALHOS</span><h2>O que deseja editar?</h2></div></header>
        <div>
          <Link href="/admin/produtos"><span><Icon name="products" /></span><div><strong>Produtos</strong><small>Links, imagens e códigos</small></div><Icon name="arrow" size={16} /></Link>
          <Link href="/admin/produtos/importar"><span><Icon name="code" /></span><div><strong>Importar lista</strong><small>Cadastre vários produtos de uma vez</small></div><Icon name="arrow" size={16} /></Link>
          <Link href="/admin/editor"><span><Icon name="layout" /></span><div><strong>Página inicial</strong><small>Blocos, títulos e ordem</small></div><Icon name="arrow" size={16} /></Link>
          <Link href="/admin/aparencia"><span><Icon name="palette" /></span><div><strong>Identidade visual</strong><small>Cores, cards e tipografia</small></div><Icon name="arrow" size={16} /></Link>
          <Link href="/admin/navegacao"><span><Icon name="navigation" /></span><div><strong>Menus e redes</strong><small>Links do site e do footer</small></div><Icon name="arrow" size={16} /></Link>
        </div>
      </article>
    </section>

    <section className="studio-dashboard-lower">
      <article className="studio-panel">
        <header><div><span>MAIS ACESSADOS</span><h2>Produtos em destaque</h2></div><Link href="/admin/produtos">Ver produtos</Link></header>
        <div className="studio-ranking">{products.slice(0, 6).map((product, index) => <div key={product.id}><b>{String(index + 1).padStart(2, "0")}</b>{product.image_url ? <img src={product.image_url} alt="" /> : <span className="ranking-placeholder"><Icon name="image" size={17} /></span>}<div><strong>{product.name}</strong><small>{product.product_code ? `Código ${product.product_code}` : product.categories?.name || "Sem categoria"}</small></div><em>{product.click_count}</em></div>)}</div>
      </article>

      <article className="studio-panel">
        <header><div><span>REVISÃO</span><h2>Precisa da sua atenção</h2></div><b className="studio-count-badge">{problems.length}</b></header>
        <div className="studio-review-list">{problems.slice(0, 6).map((product) => <Link href="/admin/produtos" key={product.id}><span><Icon name={!product.image_url ? "image" : !product.product_code ? "code" : "link"} /></span><div><strong>{product.name}</strong><small>{!product.image_url ? "Adicione uma imagem" : !product.product_code ? "Adicione o código do vídeo" : "Confira o link"}</small></div><Icon name="arrow" size={16} /></Link>)}</div>
        {!problems.length ? <div className="studio-all-good"><Icon name="check" /><strong>Todos os cadastros estão completos.</strong></div> : null}
      </article>

      <article className="studio-panel">
        <header><div><span>PESQUISAS</span><h2>O que procuram</h2></div><Link href="/admin/analytics">Detalhes</Link></header>
        <div className="studio-query-list">{stats.topQueries.map(([query, count]) => <div key={query}><strong>{query}</strong><span>{count}</span></div>)}</div>
        {!stats.topQueries.length ? <div className="studio-empty-mini">Ainda não há pesquisas registradas.</div> : null}
      </article>
    </section>

    <footer className="studio-dashboard-note"><span><Icon name="categories" />{categoryCount} categorias ativas</span><span><Icon name="products" />{products.length} produtos cadastrados</span></footer>
  </>;
}

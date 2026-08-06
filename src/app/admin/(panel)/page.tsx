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
    if (!supabase) { setLoading(false); setError("Supabase não configurado."); return; }
    void (async () => {
      const since = new Date(); since.setDate(since.getDate() - 29);
      const [productResult, categoryResult, clickResult, searchResult, viewResult] = await Promise.all([
        supabase.from("products").select("id,name,image_url,click_count,is_active,is_video_product,product_code,affiliate_url,categories(name)").order("click_count", { ascending: false }).limit(300),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("product_clicks").select("clicked_at").gte("clicked_at", since.toISOString()).limit(5000),
        supabase.from("search_events").select("query,results_count,searched_at").gte("searched_at", since.toISOString()).limit(5000),
        supabase.from("page_views").select("viewed_at").gte("viewed_at", since.toISOString()).limit(5000),
      ]);
      if (productResult.error || categoryResult.error) setError("Alguns dados não puderam ser carregados.");
      setProducts((productResult.data ?? []) as unknown as ProductRow[]);
      setCategoryCount(categoryResult.count ?? 0);
      setClicks((clickResult.data ?? []) as ClickRow[]);
      setSearches((searchResult.data ?? []) as SearchRow[]);
      setViews((viewResult.data ?? []) as ViewRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seven = new Date(today); seven.setDate(seven.getDate() - 6);
    const points: ChartPoint[] = [];
    for (let offset = 29; offset >= 0; offset -= 1) { const day = new Date(today); day.setDate(day.getDate() - offset); const key = day.toISOString().slice(0, 10); points.push({ date: key, clicks: clicks.filter((item) => item.clicked_at.slice(0, 10) === key).length }); }
    const queries = new Map<string, number>();
    searches.forEach((item) => { const key = item.query.trim().toLowerCase(); if (key) queries.set(key, (queries.get(key) || 0) + 1); });
    return { todayClicks: clicks.filter((item) => new Date(item.clicked_at) >= today).length, sevenClicks: clicks.filter((item) => new Date(item.clicked_at) >= seven).length, todayViews: views.filter((item) => new Date(item.viewed_at) >= today).length, zeroSearches: searches.filter((item) => item.results_count === 0).length, points, topQueries: [...queries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6) };
  }, [clicks, searches, views]);

  if (loading) return <div className="ha-inline-loading"><span /><strong>Organizando seus dados...</strong></div>;
  const published = products.filter((item) => item.is_active).length;
  const drafts = products.length - published;
  const missingImages = products.filter((item) => !item.image_url);
  const linkProblems = products.filter((item) => !item.affiliate_url);
  const problems = products.filter((item) => !item.image_url || !item.affiliate_url || !item.product_code);

  return <div className="ha-dashboard">
    <section className="ha-dashboard__welcome"><div><span>VISÃO GERAL</span><h1>Seu catálogo, sem complicação.</h1><p>Veja o que precisa de atenção e continue de onde parou.</p></div><div><Link href="/admin/produtos/importar"><Icon name="code" />Importar lista</Link><Link href="/admin/produtos"><Icon name="plus" />Adicionar produto</Link></div></section>
    {error ? <div className="ha-alert is-error">{error}</div> : null}

    <section className="ha-attention-grid">
      <Link href="/admin/produtos" className={missingImages.length ? "warning" : "ok"}><span><Icon name="image" /></span><div><small>Sem imagem</small><strong>{missingImages.length}</strong><em>Corrigir agora</em></div><Icon name="arrow" size={16} /></Link>
      <Link href="/admin/produtos" className={drafts ? "soft" : "ok"}><span><Icon name="text" /></span><div><small>Rascunhos</small><strong>{drafts}</strong><em>Continuar edição</em></div><Icon name="arrow" size={16} /></Link>
      <Link href="/admin/produtos" className={linkProblems.length ? "danger" : "ok"}><span><Icon name="link" /></span><div><small>Links incompletos</small><strong>{linkProblems.length}</strong><em>Revisar catálogo</em></div><Icon name="arrow" size={16} /></Link>
    </section>

    <section className="ha-metric-grid">
      <article><span><Icon name="products" /></span><div><small>Produtos publicados</small><strong>{published}</strong><em>{products.length} cadastrados</em></div></article>
      <article><span><Icon name="eye" /></span><div><small>Visitas hoje</small><strong>{stats.todayViews}</strong><em>acessos públicos</em></div></article>
      <article><span><Icon name="click" /></span><div><small>Cliques hoje</small><strong>{stats.todayClicks}</strong><em>{stats.sevenClicks} em 7 dias</em></div></article>
      <Link href="/admin/buscas" className="ha-metric-link"><span><Icon name="search" /></span><div><small>Buscas sem resultado</small><strong>{stats.zeroSearches}</strong><em>Revisar e limpar termos</em></div><Icon name="arrow" size={16} /></Link>
    </section>

    <section className="ha-dashboard-grid">
      <article className="ha-panel ha-tasks"><header><div><span>PENDÊNCIAS</span><h2>O que precisa ser feito</h2></div><b>{problems.length}</b></header><div>{problems.slice(0, 6).map((product) => <Link href="/admin/produtos" key={product.id}><span><Icon name={!product.image_url ? "image" : !product.product_code ? "code" : "link"} /></span><div><strong>{product.name}</strong><small>{!product.image_url ? "Adicionar uma imagem" : !product.product_code ? "Adicionar o código" : "Revisar o link"}</small></div><Icon name="arrow" size={16} /></Link>)}{!problems.length ? <div className="ha-all-good"><Icon name="check" /><div><strong>Tudo em ordem.</strong><small>Nenhuma pendência no catálogo.</small></div></div> : null}</div></article>
      <article className="ha-panel ha-shortcuts"><header><div><span>ATALHOS</span><h2>Ações frequentes</h2></div></header><div><Link href="/admin/produtos"><span><Icon name="products" /></span><strong>Produtos</strong><small>Fotos, preços e links</small></Link><Link href="/admin/editor"><span><Icon name="layout" /></span><strong>Página inicial</strong><small>Seções e ordem</small></Link><Link href="/admin/aparencia"><span><Icon name="palette" /></span><strong>Aparência</strong><small>Marca e componentes</small></Link><Link href="/admin/navegacao"><span><Icon name="navigation" /></span><strong>Redes e menus</strong><small>Links públicos</small></Link></div></article>
      <article className="ha-panel ha-chart"><header><div><span>ÚLTIMOS 30 DIAS</span><h2>Cliques para a Shopee</h2></div><Link href="/admin/analytics">Detalhes <Icon name="arrow" size={15} /></Link></header><ClicksChart data={stats.points} /></article>
    </section>

    <section className="ha-dashboard-grid ha-dashboard-grid--bottom">
      <article className="ha-panel"><header><div><span>MAIS ACESSADOS</span><h2>Produtos em destaque</h2></div><Link href="/admin/produtos">Ver produtos</Link></header><div className="ha-ranking">{products.slice(0, 6).map((product, index) => <div key={product.id}><b>{String(index + 1).padStart(2, "0")}</b>{product.image_url ? <img src={product.image_url} alt="" /> : <span><Icon name="image" size={17} /></span>}<div><strong>{product.name}</strong><small>{product.product_code || product.categories?.name || "Sem categoria"}</small></div><em>{product.click_count}</em></div>)}</div></article>
      <article className="ha-panel"><header><div><span>PESQUISAS</span><h2>O que estão procurando</h2></div><Link href="/admin/buscas">Gerenciar termos</Link></header><div className="ha-query-list">{stats.topQueries.map(([query, count]) => <div key={query}><strong>{query}</strong><span>{count}</span></div>)}</div>{!stats.topQueries.length ? <div className="ha-empty-mini">Ainda não há pesquisas registradas.</div> : null}</article>
    </section>
    <footer className="ha-dashboard__footer"><span><Icon name="categories" />{categoryCount} categorias</span><span><Icon name="products" />{products.length} produtos</span></footer>
  </div>;
}

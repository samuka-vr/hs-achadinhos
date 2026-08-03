"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ClicksChart, { type ChartPoint } from "@/components/ClicksChart";
import Icon from "@/components/Icon";
import { getBrowserSupabase } from "@/lib/supabase/client";

 type ProductStat = { id: string; name: string; click_count: number; category_id: string; image_url: string | null; is_active: boolean; categories: { name: string } | null };
type ClickRow = { clicked_at: string };
function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    void (async () => {
      const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0);
      const [productsResult, categoriesResult, clicksResult] = await Promise.all([
        supabase.from("products").select("id,name,click_count,category_id,image_url,is_active,categories(name)").order("click_count", { ascending: false }),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("product_clicks").select("clicked_at").gte("clicked_at", since.toISOString()).order("clicked_at"),
      ]);
      if (productsResult.error || categoriesResult.error || clicksResult.error) setError("Não foi possível carregar todas as estatísticas.");
      setProducts((productsResult.data ?? []) as unknown as ProductStat[]); setCategoryCount(categoriesResult.count ?? 0); setClicks((clicksResult.data ?? []) as ClickRow[]); setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date(); const today = startOfDay(now); const seven = new Date(today); seven.setDate(seven.getDate() - 6); const thirty = new Date(today); thirty.setDate(thirty.getDate() - 29);
    const todayCount = clicks.filter((item) => new Date(item.clicked_at) >= today).length;
    const sevenCount = clicks.filter((item) => new Date(item.clicked_at) >= seven).length;
    const thirtyCount = clicks.filter((item) => new Date(item.clicked_at) >= thirty).length;
    const points: ChartPoint[] = [];
    for (let index = 29; index >= 0; index--) { const date = new Date(today); date.setDate(date.getDate() - index); const key = date.toISOString().slice(0, 10); points.push({ date: key, clicks: clicks.filter((item) => item.clicked_at.slice(0, 10) === key).length }); }
    const categories = new Map<string, number>();
    for (const product of products) { const name = product.categories?.name || "Sem categoria"; categories.set(name, (categories.get(name) || 0) + Number(product.click_count || 0)); }
    const totalClicks = products.reduce((sum, item) => sum + Number(item.click_count || 0), 0);
    return { todayCount, sevenCount, thirtyCount, totalClicks, points, topCategories: [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6) };
  }, [clicks, products]);

  if (loading) return <div className="admin-loading-inline">Carregando visão geral...</div>;
  const activeProducts = products.filter((item) => item.is_active);

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">PAINEL</span><h1>Visão geral</h1><p>Produtos, categorias e cliques em um só lugar.</p></div><div className="admin-heading-actions"><Link className="admin-button secondary" href="/" target="_blank">Ver site <Icon name="external" /></Link><Link className="admin-button" href="/admin/produtos"><Icon name="plus" />Novo produto</Link></div></div>
      {error ? <div className="error">{error}</div> : null}
      <div className="admin-stat-grid">
        <div className="admin-stat-card tone-pink"><span className="admin-stat-icon"><Icon name="products" /></span><div><small>Produtos ativos</small><strong>{activeProducts.length}</strong><em>{products.length - activeProducts.length} inativo(s)</em></div></div>
        <div className="admin-stat-card tone-purple"><span className="admin-stat-icon"><Icon name="categories" /></span><div><small>Categorias</small><strong>{categoryCount}</strong><em>categorias ativas</em></div></div>
        <div className="admin-stat-card tone-blue"><span className="admin-stat-icon"><Icon name="click" /></span><div><small>Cliques hoje</small><strong>{stats.todayCount}</strong><em>{stats.sevenCount} nos últimos 7 dias</em></div></div>
        <div className="admin-stat-card tone-dark"><span className="admin-stat-icon"><Icon name="chart" /></span><div><small>Cliques totais</small><strong>{stats.totalClicks}</strong><em>{stats.thirtyCount} nos últimos 30 dias</em></div></div>
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-chart-panel"><div className="admin-panel-head"><div><small>DESEMPENHO</small><h2>Cliques nos últimos 30 dias</h2></div><span className="admin-panel-badge"><Icon name="chart" size={16} />30 dias</span></div><ClicksChart data={stats.points} /></section>
        <section className="admin-panel admin-quick-panel"><div className="admin-panel-head"><div><small>ATALHOS</small><h2>Ações rápidas</h2></div></div><div className="admin-quick-links"><Link href="/admin/produtos"><span><Icon name="plus" /></span><div><strong>Adicionar produto</strong><small>Nome, link, preços e imagens</small></div><Icon name="arrow" /></Link><Link href="/admin/categorias"><span><Icon name="categories" /></span><div><strong>Organizar categorias</strong><small>Imagem, emoji, ordem e status</small></div><Icon name="arrow" /></Link><Link href="/admin/configuracoes"><span><Icon name="settings" /></span><div><strong>Personalizar site</strong><small>Marca, seções, cores e redes</small></div><Icon name="arrow" /></Link></div></section>
      </div>
      <div className="admin-dashboard-grid admin-lists-grid">
        <section className="admin-panel"><div className="admin-panel-head"><div><small>PRODUTOS</small><h2>Mais clicados</h2></div><Link href="/admin/produtos">Ver todos <Icon name="arrow" size={16} /></Link></div><div className="admin-ranking-list">{products.slice(0, 6).map((product, index) => <div key={product.id}><span className="rank-number">{String(index + 1).padStart(2, "0")}</span>{product.image_url ? <img src={product.image_url} alt="" /> : <span className="rank-placeholder"><Icon name="products" size={17} /></span>}<div><strong>{product.name}</strong><small>{product.categories?.name || "Sem categoria"}</small></div><b>{product.click_count}<small> cliques</small></b></div>)}</div></section>
        <section className="admin-panel"><div className="admin-panel-head"><div><small>CATEGORIAS</small><h2>Mais procuradas</h2></div></div><div className="admin-category-ranking">{stats.topCategories.map(([name, count], index) => { const max = stats.topCategories[0]?.[1] || 1; return <div key={name}><div><strong>{name}</strong><span>{count} cliques</span></div><div className="ranking-track"><span style={{ width: `${Math.max(5, (count / max) * 100)}%` }} /></div><small>#{index + 1}</small></div>; })}</div></section>
      </div>
    </>
  );
}

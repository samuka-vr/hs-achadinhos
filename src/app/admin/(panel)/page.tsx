"use client";

import { useEffect, useMemo, useState } from "react";
import ClicksChart, { type ChartPoint } from "@/components/ClicksChart";
import { getBrowserSupabase } from "@/lib/supabase/client";

type ProductStat = { id: string; name: string; click_count: number; category_id: string; categories: { name: string } | null };
type ClickRow = { clicked_at: string };

function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0);
      const [productsResult, categoriesResult, clicksResult] = await Promise.all([
        supabase.from("products").select("id,name,click_count,category_id,categories(name)").eq("is_active", true).order("click_count", { ascending: false }),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("product_clicks").select("clicked_at").gte("clicked_at", since.toISOString()).order("clicked_at"),
      ]);
      if (productsResult.error || categoriesResult.error || clicksResult.error) setError("Não foi possível carregar todas as estatísticas.");
      setProducts((productsResult.data ?? []) as unknown as ProductStat[]);
      setCategoryCount(categoriesResult.count ?? 0);
      setClicks((clicksResult.data ?? []) as ClickRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const seven = new Date(today); seven.setDate(seven.getDate() - 6);
    const thirty = new Date(today); thirty.setDate(thirty.getDate() - 29);
    const todayCount = clicks.filter((item) => new Date(item.clicked_at) >= today).length;
    const sevenCount = clicks.filter((item) => new Date(item.clicked_at) >= seven).length;
    const thirtyCount = clicks.filter((item) => new Date(item.clicked_at) >= thirty).length;
    const points: ChartPoint[] = [];
    for (let index = 29; index >= 0; index--) {
      const date = new Date(today); date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      points.push({ date: key, clicks: clicks.filter((item) => item.clicked_at.slice(0, 10) === key).length });
    }
    const categories = new Map<string, number>();
    for (const product of products) {
      const name = product.categories?.name || "Sem categoria";
      categories.set(name, (categories.get(name) || 0) + Number(product.click_count || 0));
    }
    return { todayCount, sevenCount, thirtyCount, points, topCategories: [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) };
  }, [clicks, products]);

  if (loading) return <div className="loading">Carregando dashboard...</div>;

  return (
    <>
      <div className="section-head"><div><h1>Dashboard</h1><p>Acompanhe os cliques e o desempenho do catálogo.</p></div></div>
      {error ? <div className="error">{error}</div> : null}
      <div className="stats-grid">
        <div className="stat-card"><span>Produtos ativos</span><strong>{products.length}</strong></div>
        <div className="stat-card"><span>Categorias ativas</span><strong>{categoryCount}</strong></div>
        <div className="stat-card"><span>Cliques hoje</span><strong>{stats.todayCount}</strong></div>
        <div className="stat-card"><span>Cliques em 30 dias</span><strong>{stats.thirtyCount}</strong><small>{stats.sevenCount} nos últimos 7 dias</small></div>
      </div>
      <section className="panel"><div className="panel-head"><h2>Cliques nos últimos 30 dias</h2></div><ClicksChart data={stats.points} /></section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px,1fr))", gap: 18 }}>
        <section className="panel"><div className="panel-head"><h2>Produtos mais clicados</h2></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Cliques</th></tr></thead><tbody>{products.slice(0, 8).map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.click_count}</td></tr>)}</tbody></table></div></section>
        <section className="panel"><div className="panel-head"><h2>Categorias mais clicadas</h2></div><div className="table-wrap"><table><thead><tr><th>Categoria</th><th>Cliques</th></tr></thead><tbody>{stats.topCategories.map(([name, count]) => <tr key={name}><td>{name}</td><td>{count}</td></tr>)}</tbody></table></div></section>
      </div>
    </>
  );
}

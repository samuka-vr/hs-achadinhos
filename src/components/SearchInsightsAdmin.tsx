"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon from "./Icon";

type SearchRow = {
  id: string;
  query: string;
  results_count: number;
  searched_at: string;
};

type GroupedSearch = {
  key: string;
  query: string;
  count: number;
  lastSearchedAt: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export default function SearchInsightsAdmin() {
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase não configurado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("search_events")
      .select("id,query,results_count,searched_at")
      .eq("results_count", 0)
      .order("searched_at", { ascending: false })
      .limit(5000);
    if (loadError) setError(loadError.message);
    else setRows((data ?? []) as SearchRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo<GroupedSearch[]>(() => {
    const map = new Map<string, GroupedSearch>();
    for (const row of rows) {
      const key = normalize(row.query);
      if (!key) continue;
      const current = map.get(key);
      if (current) {
        current.count += 1;
        if (new Date(row.searched_at) > new Date(current.lastSearchedAt)) current.lastSearchedAt = row.searched_at;
      } else {
        map.set(key, { key, query: row.query.trim(), count: 1, lastSearchedAt: row.searched_at });
      }
    }
    const query = normalize(filter);
    return [...map.values()]
      .filter((item) => !query || normalize(item.query).includes(query))
      .sort((a, b) => b.count - a.count || new Date(b.lastSearchedAt).getTime() - new Date(a.lastSearchedAt).getTime());
  }, [filter, rows]);

  async function deleteTerm(term: string) {
    if (!confirm(`Excluir todas as buscas sem resultado por “${term}”?`)) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setDeleting(term);
    setError("");
    setMessage("");
    const { data, error: rpcError } = await supabase.rpc("delete_zero_result_searches", { p_query: term });
    if (rpcError) {
      setError("Não foi possível excluir. Execute a migration 003_admin_studio_reset.sql no Supabase.");
    } else {
      setMessage(`${Number(data || 0)} registro(s) removido(s).`);
      await load();
    }
    setDeleting(null);
  }

  async function deleteAll() {
    if (!rows.length) return;
    if (!confirm("Excluir todas as pesquisas sem resultado? Esta ação limpa somente os termos sem resultado e não apaga produtos nem outras estatísticas.")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setDeleting("__all__");
    setError("");
    setMessage("");
    const { data, error: rpcError } = await supabase.rpc("delete_zero_result_searches", { p_query: null });
    if (rpcError) setError("Não foi possível limpar as buscas. Execute a migration 003_admin_studio_reset.sql no Supabase.");
    else {
      setMessage(`${Number(data || 0)} registro(s) sem resultado removido(s).`);
      await load();
    }
    setDeleting(null);
  }

  if (loading) return <div className="admin-loading-inline">Carregando pesquisas sem resultado...</div>;

  return <>
    <div className="admin-page-heading-ui hs-search-insights-heading">
      <div>
        <span>INTELIGÊNCIA DE BUSCA</span>
        <h1>Buscas sem resultado</h1>
        <p>Descubra o que as pessoas tentaram encontrar, crie produtos para essas oportunidades e limpe termos que não precisam mais aparecer.</p>
      </div>
      <div className="product-heading-actions">
        <Link className="admin-button-ui secondary" href="/admin/analytics"><Icon name="chart" />Abrir analytics</Link>
        <button className="admin-button-ui danger" type="button" onClick={() => void deleteAll()} disabled={!rows.length || deleting === "__all__"}><Icon name="trash" />{deleting === "__all__" ? "Limpando..." : "Limpar tudo"}</button>
      </div>
    </div>

    {error ? <div className="admin-alert-ui error">{error}</div> : null}
    {message ? <div className="admin-alert-ui success">{message}</div> : null}

    <section className="hs-search-summary-grid">
      <article><span><Icon name="search" /></span><div><small>Termos diferentes</small><strong>{new Set(rows.map((row) => normalize(row.query))).size}</strong></div></article>
      <article><span><Icon name="warning" /></span><div><small>Total de tentativas</small><strong>{rows.length}</strong></div></article>
      <article><span><Icon name="sparkles" /></span><div><small>Oportunidades</small><strong>{grouped.filter((item) => item.count >= 2).length}</strong></div></article>
    </section>

    <section className="admin-card-ui hs-search-insights-card">
      <div className="admin-card-head-ui">
        <div><small>TERMOS REGISTRADOS</small><h2>O que ainda não existe no catálogo</h2><p>Os termos com mais tentativas aparecem primeiro.</p></div>
        <label className="hs-search-insights-filter"><Icon name="search" size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar palavras..." />{filter ? <button type="button" onClick={() => setFilter("")} aria-label="Limpar filtro"><Icon name="close" size={16} /></button> : null}</label>
      </div>

      <div className="hs-search-insights-list">
        {grouped.map((item) => <article key={item.key}>
          <div className="hs-search-insights-rank"><strong>{item.count}</strong><small>busca{item.count === 1 ? "" : "s"}</small></div>
          <div className="hs-search-insights-copy"><strong>{item.query}</strong><small>Última tentativa em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.lastSearchedAt))}</small></div>
          <div className="hs-search-insights-actions">
            <Link href={`/admin/produtos?busca=${encodeURIComponent(item.query)}`}><Icon name="products" size={17} />Ver produtos</Link>
            <button type="button" className="danger" onClick={() => void deleteTerm(item.query)} disabled={deleting === item.query}><Icon name="trash" size={17} />{deleting === item.query ? "Excluindo..." : "Excluir"}</button>
          </div>
        </article>)}
      </div>

      {!grouped.length ? <div className="empty-ui"><Icon name="check" size={36} /><h3>{filter ? "Nenhum termo encontrado" : "Nenhuma busca sem resultado"}</h3><p>{filter ? "Tente outra palavra." : "As buscas dos visitantes estão encontrando produtos no catálogo."}</p></div> : null}
    </section>
  </>;
}

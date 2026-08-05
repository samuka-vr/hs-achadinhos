"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { AdminActivity } from "@/lib/types";
import Icon from "./Icon";

const actionLabels: Record<string, string> = { insert: "Criado", update: "Atualizado", delete: "Excluído", reset: "Redefinido" };
const entityLabels: Record<string, string> = {
  products: "Produto", categories: "Categoria", site_settings: "Configuração", home_sections: "Bloco da home",
  banners: "Banner", navigation_items: "Item de menu", content_pages: "Página", category_aliases: "Nome alternativo", catalog: "Catálogo",
};

export default function ActivityAdmin() {
  const [rows, setRows] = useState<AdminActivity[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    void supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(500).then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message); else setRows((data ?? []) as AdminActivity[]);
      setLoading(false);
    });
  }, []);

  const types = useMemo(() => Array.from(new Set(rows.map((row) => row.entity_type))).sort(), [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    const text = `${row.summary || ""} ${row.entity_type} ${row.action}`.toLowerCase();
    return (type === "all" || row.entity_type === type) && text.includes(query.toLowerCase());
  }), [rows, query, type]);

  if (loading) return <div className="studio-inline-loading"><span /><strong>Carregando histórico...</strong></div>;

  return <>
    <div className="admin-page-heading-v5"><div><span>SEGURANÇA</span><h1>Histórico de alterações</h1><p>Acompanhe o que foi criado, alterado ou excluído pelo painel.</p></div></div>
    {error ? <div className="admin-alert-v5 error">{error}</div> : null}
    <section className="admin-card-v5 activity-admin-v8">
      <div className="activity-toolbar-v8"><label><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no histórico" /></label><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Todas as áreas</option>{types.map((item) => <option key={item} value={item}>{entityLabels[item] || item}</option>)}</select><span>{visible.length} registro(s)</span></div>
      <div className="activity-list-v8">{visible.map((item) => <article key={item.id}><span className={`activity-icon-v8 ${item.action}`}><Icon name={item.action === "delete" ? "trash" : item.action === "insert" ? "plus" : item.action === "reset" ? "shield" : "edit"} size={17} /></span><div><strong>{item.summary || entityLabels[item.entity_type] || item.entity_type}</strong><small>{actionLabels[item.action] || item.action} em {entityLabels[item.entity_type] || item.entity_type}</small></div><time>{new Date(item.created_at).toLocaleString("pt-BR")}</time></article>)}{!visible.length ? <div className="studio-empty-mini">Nenhuma alteração encontrada.</div> : null}</div>
    </section>
  </>;
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, CategoryAlias } from "@/lib/types";
import Icon from "./Icon";

export default function CategoryAliasesAdmin({ categories: initialCategories }: { categories?: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [aliases, setAliases] = useState<CategoryAlias[]>([]);
  const [alias, setAlias] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const [a, c] = await Promise.all([
      supabase.from("category_aliases").select("*,categories(id,name,slug)").order("alias"),
      initialCategories?.length ? Promise.resolve({ data: initialCategories, error: null }) : supabase.from("categories").select("*").order("sort_order"),
    ]);
    if (a.error) setError(a.error.message);
    setAliases((a.data ?? []) as CategoryAlias[]);
    setCategories((c.data ?? []) as Category[]);
    setCategoryId((current) => current || (c.data?.[0] as Category | undefined)?.id || "");
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return aliases;
    return aliases.filter((item) => item.alias.toLowerCase().includes(value) || item.categories?.name.toLowerCase().includes(value));
  }, [aliases, query]);

  async function addAlias(event: FormEvent) {
    event.preventDefault();
    if (!alias.trim() || !categoryId) return;
    setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error: insertError } = await supabase.from("category_aliases").insert({ alias: alias.trim(), category_id: categoryId });
    if (insertError) setError(insertError.code === "23505" ? "Esse nome alternativo já está cadastrado." : insertError.message);
    else { setAlias(""); setMessage("Nome alternativo adicionado ao importador."); await load(); }
    setSaving(false);
  }

  async function updateCategory(item: CategoryAlias, nextCategoryId: string) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: updateError } = await supabase.from("category_aliases").update({ category_id: nextCategoryId }).eq("id", item.id);
    if (updateError) setError(updateError.message); else { setMessage("Mapeamento atualizado."); await load(); }
  }

  async function remove(item: CategoryAlias) {
    if (!confirm(`Remover o nome alternativo “${item.alias}”?`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: deleteError } = await supabase.from("category_aliases").delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Nome alternativo removido."); await load(); }
  }

  return <section className="admin-card-ui alias-manager-ops">
    <div className="admin-card-head-ui">
      <div><small>IMPORTADOR</small><h2>Nomes alternativos</h2><p>Defina como categorias detalhadas da sua lista serão agrupadas nas categorias principais.</p></div>
      <span className="studio-count-badge">{aliases.length}</span>
    </div>
    {error ? <div className="admin-alert-ui error">{error}</div> : null}
    {message ? <div className="admin-alert-ui success">{message}</div> : null}
    <form onSubmit={addAlias} className="alias-create-ops">
      <label><span>Nome recebido na lista</span><input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Ex.: Eletrônicos e Áudio" /></label>
      <label><span>Categoria principal</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <button className="admin-button-ui" disabled={saving || !alias.trim() || !categoryId}><Icon name="plus" />{saving ? "Adicionando..." : "Adicionar"}</button>
    </form>
    <div className="alias-toolbar-ops"><label><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou categoria" /></label><small>{visible.length} resultado(s)</small></div>
    <div className="alias-list-ops">
      {visible.map((item) => <article key={item.id}>
        <div><strong>{item.alias}</strong><small>Quando aparecer no importador</small></div>
        <Icon name="arrow" size={16} />
        <select value={item.category_id} onChange={(event) => void updateCategory(item, event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <button className="danger" onClick={() => void remove(item)} aria-label={`Remover ${item.alias}`}><Icon name="trash" size={17} /></button>
      </article>)}
      {!visible.length ? <div className="studio-empty-mini">Nenhum nome alternativo encontrado.</div> : null}
    </div>
  </section>;
}

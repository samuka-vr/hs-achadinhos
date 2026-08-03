"use client";

import { FormEvent, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

type FormState = { name: string; slug: string; icon: string; image_url: string; sort_order: string; is_active: boolean };
const EMPTY: FormState = { name: "", slug: "", icon: "", image_url: "", sort_order: "0", is_active: true };

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { data, error: loadError } = await supabase.from("categories").select("*").order("sort_order").order("name");
    if (loadError) setError(loadError.message);
    setCategories((data ?? []) as Category[]);
  }
  useEffect(() => { void load(); }, []);

  function createNew() { setEditingId(null); setForm(EMPTY); setShowForm(true); setError(""); setMessage(""); }
  function edit(item: Category) { setEditingId(item.id); setForm({ name: item.name, slug: item.slug, icon: item.icon || "", image_url: item.image_url || "", sort_order: String(item.sort_order), is_active: item.is_active }); setShowForm(true); }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    const payload = { name: form.name.trim(), slug: slugify(form.slug || form.name), icon: form.icon.trim() || null, image_url: form.image_url.trim() || null, sort_order: Number(form.sort_order) || 0, is_active: form.is_active };
    const result = editingId ? await supabase.from("categories").update(payload).eq("id", editingId) : await supabase.from("categories").insert(payload);
    if (result.error) setError(result.error.message); else { setMessage(editingId ? "Categoria atualizada." : "Categoria criada."); setShowForm(false); await load(); }
    setSaving(false);
  }

  async function toggle(item: Category) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: toggleError } = await supabase.from("categories").update({ is_active: !item.is_active }).eq("id", item.id);
    if (toggleError) setError(toggleError.message); else await load();
  }

  async function remove(item: Category) {
    if (!window.confirm(`Excluir a categoria “${item.name}”?`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", item.id);
    if ((count ?? 0) > 0) { setError("Esta categoria possui produtos. Mova ou exclua os produtos antes."); return; }
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Categoria excluída."); await load(); }
  }

  return (
    <>
      <div className="section-head"><div><h1>Categorias</h1><p>Organize os produtos por tipo.</p></div><button className="button" onClick={createNew}>+ Nova categoria</button></div>
      {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}{message ? <div className="success" style={{ marginBottom: 14 }}>{message}</div> : null}
      {showForm ? <section className="panel" style={{ marginTop: 0 }}><div className="panel-head"><h2>{editingId ? "Editar categoria" : "Nova categoria"}</h2><button className="button ghost small" onClick={() => setShowForm(false)}>Fechar</button></div><form className="form-grid" onSubmit={save}>
        <label className="label">Nome<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })} required /></label>
        <label className="label">Slug<input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} required /></label>
        <label className="label">Ícone ou emoji<input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎮" /></label>
        <label className="label">Posição<input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></label>
        <label className="label full">URL da imagem<input className="input" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Categoria ativa</label>
        <div className="full"><button className="button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar categoria"}</button></div>
      </form></section> : null}
      <section className="panel"><div className="panel-head"><h2>Categorias cadastradas</h2></div><div className="table-wrap"><table><thead><tr><th>Categoria</th><th>Slug</th><th>Posição</th><th>Status</th><th>Ações</th></tr></thead><tbody>{categories.map((item) => <tr key={item.id}><td><strong>{item.icon} {item.name}</strong></td><td>{item.slug}</td><td>{item.sort_order}</td><td>{item.is_active ? "Ativa" : "Inativa"}</td><td><div className="row-actions"><button className="button secondary small" onClick={() => edit(item)}>Editar</button><button className="button ghost small" onClick={() => void toggle(item)}>{item.is_active ? "Desativar" : "Ativar"}</button><button className="button danger small" onClick={() => void remove(item)}>Excluir</button></div></td></tr>)}</tbody></table></div>{!categories.length ? <div className="empty"><h3>Nenhuma categoria</h3><p>Crie a primeira categoria.</p></div> : null}</section>
    </>
  );
}

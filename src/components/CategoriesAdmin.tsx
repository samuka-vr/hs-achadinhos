"use client";

import { FormEvent, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";
import Icon from "./Icon";

type FormState = { name: string; slug: string; icon: string; image_url: string; sort_order: string; is_active: boolean };
const EMPTY: FormState = { name: "", slug: "", icon: "", image_url: "", sort_order: "0", is_active: true };

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("name"),
      supabase.from("products").select("category_id"),
    ]);
    if (categoriesResult.error) setError(categoriesResult.error.message);
    setCategories((categoriesResult.data ?? []) as Category[]);
    const nextCounts: Record<string, number> = {};
    for (const product of productsResult.data ?? []) nextCounts[product.category_id] = (nextCounts[product.category_id] || 0) + 1;
    setCounts(nextCounts);
  }
  useEffect(() => { void load(); }, []);

  function createNew() { setEditingId(null); setForm({ ...EMPTY, sort_order: String(categories.length + 1) }); setFile(null); setShowForm(true); setError(""); setMessage(""); }
  function edit(item: Category) { setEditingId(item.id); setForm({ name: item.name, slug: item.slug, icon: item.icon || "", image_url: item.image_url || "", sort_order: String(item.sort_order), is_active: item.is_active }); setFile(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function uploadImage(slug: string) {
    if (!file) return form.image_url.trim() || null;
    const supabase = getBrowserSupabase(); if (!supabase) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `categories/${slug}-${Date.now()}.${extension}`;
    const result = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type });
    if (result.error) throw result.error;
    return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase(); if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    try {
      const slug = slugify(form.slug || form.name);
      const imageUrl = await uploadImage(slug);
      const payload = { name: form.name.trim(), slug, icon: form.icon.trim() || null, image_url: imageUrl, sort_order: Number(form.sort_order) || 0, is_active: form.is_active };
      const result = editingId ? await supabase.from("categories").update(payload).eq("id", editingId) : await supabase.from("categories").insert(payload);
      if (result.error) throw result.error;
      setMessage(editingId ? "Categoria atualizada." : "Categoria criada."); setShowForm(false); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao salvar categoria."); } finally { setSaving(false); }
  }

  async function toggle(item: Category) { const supabase = getBrowserSupabase(); if (!supabase) return; const { error: toggleError } = await supabase.from("categories").update({ is_active: !item.is_active }).eq("id", item.id); if (toggleError) setError(toggleError.message); else await load(); }
  async function remove(item: Category) { if (!window.confirm(`Excluir a categoria “${item.name}”?`)) return; if ((counts[item.id] || 0) > 0) { setError("Esta categoria possui produtos. Mova ou exclua os produtos antes."); return; } const supabase = getBrowserSupabase(); if (!supabase) return; const { error: deleteError } = await supabase.from("categories").delete().eq("id", item.id); if (deleteError) setError(deleteError.message); else { setMessage("Categoria excluída."); await load(); } }

  const preview = file ? URL.createObjectURL(file) : form.image_url;
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">ORGANIZAÇÃO</span><h1>Categorias</h1><p>Cadastre imagem, emoji, ordem e status de cada categoria.</p></div><button className="admin-button" onClick={createNew}><Icon name="plus" />Nova categoria</button></div>
      {error ? <div className="error admin-alert">{error}</div> : null}{message ? <div className="success admin-alert">{message}</div> : null}
      {showForm ? <section className="admin-panel admin-form-panel"><div className="admin-panel-head"><div><small>{editingId ? "EDIÇÃO" : "NOVA CATEGORIA"}</small><h2>{editingId ? "Editar categoria" : "Criar categoria"}</h2></div><button className="admin-icon-close" onClick={() => setShowForm(false)}><Icon name="close" /></button></div><form className="category-admin-form" onSubmit={save}>
        <div className="category-admin-preview">{preview ? <img src={preview} alt="Prévia" /> : <span>{form.icon || "✦"}</span>}</div>
        <div className="admin-form-grid"><label className="admin-label">Nome<input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })} required /></label><label className="admin-label">Identificador (slug)<input className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} required /></label><label className="admin-label">Emoji (opcional)<input className="admin-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎮" /></label><label className="admin-label">Ordem de exibição<input className="admin-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></label><label className="admin-label full">URL da imagem (opcional)<input className="admin-input" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></label><label className="admin-upload-button full"><Icon name="image" />Escolher imagem<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><label className="admin-toggle-row full"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><span><strong>Categoria ativa</strong><small>Visível no site e nos filtros</small></span></label><div className="admin-form-actions full"><button type="button" className="admin-button secondary" onClick={() => setShowForm(false)}>Cancelar</button><button className="admin-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar categoria"}</button></div></div>
      </form></section> : null}
      <div className="admin-category-grid">{categories.map((item, index) => <article className="admin-category-card" key={item.id}><div className={`admin-category-cover tone-${(index % 4) + 1}`}>{item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{item.icon || "✦"}</span>}<b>#{item.sort_order}</b></div><div className="admin-category-body"><div><strong>{item.name}</strong><span className={`admin-pill ${item.is_active ? "active" : "inactive"}`}>{item.is_active ? "Ativa" : "Inativa"}</span></div><small>{counts[item.id] || 0} produto(s) • /{item.slug}</small><div className="admin-category-actions"><button onClick={() => edit(item)}>Editar</button><button onClick={() => void toggle(item)}>{item.is_active ? "Desativar" : "Ativar"}</button><button className="danger" onClick={() => void remove(item)}>Excluir</button></div></div></article>)}</div>
      {!categories.length ? <div className="empty"><Icon name="categories" size={32} /><h3>Nenhuma categoria criada</h3><p>Crie a primeira categoria para organizar seus produtos.</p></div> : null}
    </>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { formatPrice, slugify } from "@/lib/utils";

type ProductForm = {
  name: string; slug: string; category_id: string; affiliate_url: string; image_url: string;
  current_price: string; old_price: string; short_description: string; tags: string; badge: string;
  is_featured: boolean; is_active: boolean;
};

const EMPTY: ProductForm = { name: "", slug: "", category_id: "", affiliate_url: "", image_url: "", current_price: "", old_price: "", short_description: "", tags: "", badge: "", is_featured: false, is_active: true };

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]);
    if (productsResult.error || categoriesResult.error) setError("Erro ao carregar produtos ou categorias.");
    setProducts((productsResult.data ?? []) as Product[]);
    setCategories((categoriesResult.data ?? []) as Category[]);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function newProduct() { setEditingId(null); setForm({ ...EMPTY, category_id: categories[0]?.id || "" }); setFile(null); setShowForm(true); setError(""); setMessage(""); }
  function edit(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, slug: product.slug, category_id: product.category_id, affiliate_url: product.affiliate_url, image_url: product.image_url || "", current_price: product.current_price?.toString() || "", old_price: product.old_price?.toString() || "", short_description: product.short_description || "", tags: (product.tags || []).join(", "), badge: product.badge || "", is_featured: product.is_featured, is_active: product.is_active });
    setFile(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(productSlug: string) {
    if (!file) return form.image_url.trim() || null;
    const supabase = getBrowserSupabase(); if (!supabase) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
    if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem válido.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${productSlug}-${Date.now()}.${extension}`;
    const result = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    if (result.error) throw result.error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    try {
      const slug = slugify(form.slug || form.name);
      if (!slug) throw new Error("Informe um nome válido.");
      const url = new URL(form.affiliate_url);
      if (url.protocol !== "https:") throw new Error("O link de afiliado deve começar com https://");
      const imageUrl = await uploadImage(slug);
      const payload = {
        name: form.name.trim(), slug, category_id: form.category_id, affiliate_url: url.toString(), image_url: imageUrl,
        current_price: form.current_price ? Number(form.current_price.replace(",", ".")) : null,
        old_price: form.old_price ? Number(form.old_price.replace(",", ".")) : null,
        short_description: form.short_description.trim() || null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        badge: form.badge.trim() || null, is_featured: form.is_featured, is_active: form.is_active,
      };
      const result = editingId ? await supabase.from("products").update(payload).eq("id", editingId) : await supabase.from("products").insert(payload);
      if (result.error) throw result.error;
      setMessage(editingId ? "Produto atualizado." : "Produto cadastrado."); setShowForm(false); setForm(EMPTY); setEditingId(null); setFile(null); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao salvar produto."); }
    finally { setSaving(false); }
  }

  async function duplicate(product: Product) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    setError("");
    const copy = { category_id: product.category_id, name: `${product.name} (cópia)`, slug: `${product.slug}-copia-${Date.now().toString().slice(-5)}`, affiliate_url: product.affiliate_url, image_url: product.image_url, current_price: product.current_price, old_price: product.old_price, short_description: product.short_description, tags: product.tags, badge: product.badge, is_featured: false, is_active: false };
    const { error: copyError } = await supabase.from("products").insert(copy);
    if (copyError) setError(copyError.message); else { setMessage("Cópia criada como inativa."); await load(); }
  }

  async function toggle(product: Product) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: toggleError } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (toggleError) setError(toggleError.message); else await load();
  }

  async function remove(product: Product) {
    if (!window.confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Produto excluído."); await load(); }
  }

  return (
    <>
      <div className="section-head"><div><h1>Produtos</h1><p>Cadastre e gerencie os links divulgados.</p></div><button className="button" onClick={newProduct}>+ Novo produto</button></div>
      {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}{message ? <div className="success" style={{ marginBottom: 14 }}>{message}</div> : null}
      {showForm ? <section className="panel" style={{ marginTop: 0 }}><div className="panel-head"><h2>{editingId ? "Editar produto" : "Novo produto"}</h2><button className="button ghost small" onClick={() => setShowForm(false)}>Fechar</button></div><form className="form-grid" onSubmit={save}>
        <label className="label">Nome<input className="input" value={form.name} onChange={(e) => { update("name", e.target.value); if (!editingId) update("slug", slugify(e.target.value)); }} required /></label>
        <label className="label">Slug<input className="input" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} required /></label>
        <label className="label">Categoria<select className="select" style={{ width: "100%" }} value={form.category_id} onChange={(e) => update("category_id", e.target.value)} required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="label">Link de afiliado<input className="input" type="url" value={form.affiliate_url} onChange={(e) => update("affiliate_url", e.target.value)} placeholder="https://..." required /></label>
        <label className="label">Preço atual<input className="input" inputMode="decimal" value={form.current_price} onChange={(e) => update("current_price", e.target.value)} placeholder="39,90" /></label>
        <label className="label">Preço anterior<input className="input" inputMode="decimal" value={form.old_price} onChange={(e) => update("old_price", e.target.value)} placeholder="59,90" /></label>
        <label className="label">URL da imagem<input className="input" type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." /></label>
        <label className="label">Ou enviar imagem<input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <label className="label">Selo<input className="input" value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Oferta" /></label>
        <label className="label">Palavras-chave<input className="input" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="fone, bluetooth, eletrônico" /></label>
        <label className="label full">Descrição curta<textarea className="textarea" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} /> Produto em destaque</label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /> Produto ativo</label>
        <div className="full"><button className="button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</button></div>
      </form></section> : null}
      <section className="panel"><div className="panel-head"><h2>Produtos cadastrados</h2><input className="input" style={{ maxWidth: 300 }} placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Preço</th><th>Cliques</th><th>Status</th><th>Ações</th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><div className="table-product">{product.image_url ? <img className="table-thumb" src={product.image_url} alt="" /> : <div className="table-thumb" />}<div><strong>{product.name}</strong><small style={{ display: "block", color: "var(--muted)" }}>{product.categories?.name}</small></div></div></td><td>{formatPrice(product.current_price) || "—"}</td><td>{product.click_count}</td><td>{product.is_active ? "Ativo" : "Inativo"}</td><td><div className="row-actions"><button className="button secondary small" onClick={() => edit(product)}>Editar</button><button className="button ghost small" onClick={() => void duplicate(product)}>Duplicar</button><button className="button ghost small" onClick={() => void toggle(product)}>{product.is_active ? "Desativar" : "Ativar"}</button><button className="button danger small" onClick={() => void remove(product)}>Excluir</button></div></td></tr>)}</tbody></table></div>{!visible.length ? <div className="empty"><h3>Nenhum produto</h3><p>Cadastre o primeiro produto para começar.</p></div> : null}</section>
    </>
  );
}

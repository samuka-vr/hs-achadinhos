"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";
import { formatPrice, slugify } from "@/lib/utils";
import Icon from "./Icon";

type ProductForm = { name: string; slug: string; category_id: string; affiliate_url: string; image_url: string; current_price: string; old_price: string; short_description: string; tags: string; badge: string; is_featured: boolean; is_active: boolean };
const EMPTY: ProductForm = { name: "", slug: "", category_id: "", affiliate_url: "", image_url: "", current_price: "", old_price: "", short_description: "", tags: "", badge: "", is_featured: false, is_active: true };

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
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
    setProducts((productsResult.data ?? []) as Product[]); setCategories((categoriesResult.data ?? []) as Category[]);
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.categories?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || (status === "active" ? item.is_active : !item.is_active);
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }), [products, search, status, categoryFilter]);

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function newProduct() { setEditingId(null); setForm({ ...EMPTY, category_id: categories[0]?.id || "" }); setFile(null); setShowForm(true); setError(""); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function edit(product: Product) { setEditingId(product.id); setForm({ name: product.name, slug: product.slug, category_id: product.category_id, affiliate_url: product.affiliate_url, image_url: product.image_url || "", current_price: product.current_price?.toString() || "", old_price: product.old_price?.toString() || "", short_description: product.short_description || "", tags: (product.tags || []).join(", "), badge: product.badge || "", is_featured: product.is_featured, is_active: product.is_active }); setFile(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }

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
    const supabase = getBrowserSupabase(); if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    try {
      const slug = slugify(form.slug || form.name); if (!slug) throw new Error("Informe um nome válido.");
      const url = new URL(form.affiliate_url); if (url.protocol !== "https:") throw new Error("O link de afiliado deve começar com https://");
      const imageUrl = await uploadImage(slug);
      const payload = { name: form.name.trim(), slug, category_id: form.category_id, affiliate_url: url.toString(), image_url: imageUrl, current_price: form.current_price ? Number(form.current_price.replace(",", ".")) : null, old_price: form.old_price ? Number(form.old_price.replace(",", ".")) : null, short_description: form.short_description.trim() || null, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), badge: form.badge.trim() || null, is_featured: form.is_featured, is_active: form.is_active };
      const result = editingId ? await supabase.from("products").update(payload).eq("id", editingId) : await supabase.from("products").insert(payload);
      if (result.error) throw result.error;
      setMessage(editingId ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso."); setShowForm(false); setForm(EMPTY); setEditingId(null); setFile(null); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao salvar produto."); } finally { setSaving(false); }
  }

  async function duplicate(product: Product) { const supabase = getBrowserSupabase(); if (!supabase) return; const copy = { category_id: product.category_id, name: `${product.name} (cópia)`, slug: `${product.slug}-copia-${Date.now().toString().slice(-5)}`, affiliate_url: product.affiliate_url, image_url: product.image_url, current_price: product.current_price, old_price: product.old_price, short_description: product.short_description, tags: product.tags, badge: product.badge, is_featured: false, is_active: false }; const { error: copyError } = await supabase.from("products").insert(copy); if (copyError) setError(copyError.message); else { setMessage("Cópia criada como inativa."); await load(); } }
  async function toggle(product: Product) { const supabase = getBrowserSupabase(); if (!supabase) return; const { error: toggleError } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id); if (toggleError) setError(toggleError.message); else await load(); }
  async function remove(product: Product) { if (!window.confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return; const supabase = getBrowserSupabase(); if (!supabase) return; const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id); if (deleteError) setError(deleteError.message); else { setMessage("Produto excluído."); await load(); } }

  const previewUrl = file ? URL.createObjectURL(file) : form.image_url;
  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">CATÁLOGO</span><h1>Produtos</h1><p>Cadastre, edite e organize todos os links divulgados.</p></div><button className="admin-button" onClick={newProduct}><Icon name="plus" />Novo produto</button></div>
      {error ? <div className="error admin-alert">{error}</div> : null}{message ? <div className="success admin-alert">{message}</div> : null}
      <div className="admin-mini-stats"><div><Icon name="products" /><span><strong>{products.length}</strong><small>Total</small></span></div><div><Icon name="check" /><span><strong>{products.filter((item) => item.is_active).length}</strong><small>Ativos</small></span></div><div><Icon name="sparkles" /><span><strong>{products.filter((item) => item.is_featured).length}</strong><small>Destaques</small></span></div><div><Icon name="click" /><span><strong>{products.reduce((sum, item) => sum + Number(item.click_count || 0), 0)}</strong><small>Cliques</small></span></div></div>
      {showForm ? <section className="admin-panel admin-form-panel"><div className="admin-panel-head"><div><small>{editingId ? "EDIÇÃO" : "NOVO CADASTRO"}</small><h2>{editingId ? "Editar produto" : "Adicionar produto"}</h2></div><button className="admin-icon-close" onClick={() => setShowForm(false)}><Icon name="close" /></button></div><form onSubmit={save} className="product-admin-form">
        <div className="product-admin-media"><div className="product-admin-preview">{previewUrl ? <img src={previewUrl} alt="Prévia" /> : <div><Icon name="image" size={34} /><strong>Imagem do produto</strong><small>Envie JPG, PNG ou WebP até 5 MB.</small></div>}</div><label className="admin-upload-button"><Icon name="image" />Escolher imagem<input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><span>Ou use uma URL abaixo.</span><input className="admin-input" type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." /></div>
        <div className="product-admin-fields"><div className="admin-form-grid"><label className="admin-label full">Nome do produto<input className="admin-input" value={form.name} onChange={(e) => { update("name", e.target.value); if (!editingId) update("slug", slugify(e.target.value)); }} required placeholder="Ex.: Fone Bluetooth sem fio" /></label><label className="admin-label">Categoria<select className="admin-input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)} required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="admin-label">Identificador (slug)<input className="admin-input" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} required /></label><label className="admin-label full">Link de afiliado da Shopee<input className="admin-input" type="url" value={form.affiliate_url} onChange={(e) => update("affiliate_url", e.target.value)} required placeholder="https://s.shopee.com.br/..." /></label><label className="admin-label">Preço atual<input className="admin-input" inputMode="decimal" value={form.current_price} onChange={(e) => update("current_price", e.target.value)} placeholder="39,90" /></label><label className="admin-label">Preço anterior<input className="admin-input" inputMode="decimal" value={form.old_price} onChange={(e) => update("old_price", e.target.value)} placeholder="59,90" /></label><label className="admin-label">Selo curto<input className="admin-input" value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Mais vendido" maxLength={40} /></label><label className="admin-label">Tags separadas por vírgula<input className="admin-input" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="casa, útil, promoção" /></label><label className="admin-label full">Descrição curta<textarea className="admin-input admin-textarea" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Explique de forma simples por que esse produto é interessante." /></label></div><div className="admin-check-grid"><label><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /><span><strong>Produto ativo</strong><small>Aparece no site público</small></span></label><label><input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} /><span><strong>Destacar produto</strong><small>Prioridade na vitrine dinâmica</small></span></label></div><div className="admin-form-actions"><button className="admin-button secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="admin-button" type="submit" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar produto"}</button></div></div>
      </form></section> : null}
      <section className="admin-panel"><div className="admin-toolbar"><div className="admin-search-field"><Icon name="search" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou categoria" /></div><select className="admin-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select><select className="admin-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="admin-result-count">{visible.length} resultado(s)</span></div>
        <div className="admin-product-list">{visible.map((product) => <article key={product.id} className="admin-product-row">{product.image_url ? <img src={product.image_url} alt="" /> : <div className="admin-product-placeholder"><Icon name="image" /></div>}<div className="admin-product-main"><div className="admin-product-title-line"><strong>{product.name}</strong>{product.is_featured ? <span className="admin-pill featured">Destaque</span> : null}<span className={`admin-pill ${product.is_active ? "active" : "inactive"}`}>{product.is_active ? "Ativo" : "Inativo"}</span></div><small>{product.categories?.name || "Sem categoria"} • {product.slug}</small><div className="admin-product-meta"><b>{formatPrice(product.current_price) || "Sem preço"}</b><span><Icon name="click" size={14} />{product.click_count} cliques</span></div></div><div className="admin-row-actions"><button onClick={() => edit(product)}>Editar</button><button onClick={() => void duplicate(product)}>Duplicar</button><button onClick={() => void toggle(product)}>{product.is_active ? "Desativar" : "Ativar"}</button><button className="danger" onClick={() => void remove(product)}>Excluir</button></div></article>)}</div>{!visible.length ? <div className="empty"><Icon name="search" size={30} /><h3>Nenhum produto encontrado</h3><p>Ajuste os filtros ou cadastre um novo produto.</p></div> : null}
      </section>
    </>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Product, ProductImage } from "@/lib/types";
import { formatPrice, slugify } from "@/lib/utils";
import Icon from "./Icon";

type ProductForm = {
  name: string;
  slug: string;
  category_id: string;
  affiliate_url: string;
  image_url: string;
  current_price: string;
  old_price: string;
  short_description: string;
  tags: string;
  badge: string;
  is_featured: boolean;
  is_active: boolean;
};

const EMPTY: ProductForm = {
  name: "", slug: "", category_id: "", affiliate_url: "", image_url: "", current_price: "", old_price: "",
  short_description: "", tags: "", badge: "", is_featured: false, is_active: true,
};

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [gallery, setGallery] = useState<ProductImage[]>([]);

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("*,categories(id,name,slug),product_images(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]);
    if (productsResult.error || categoriesResult.error) setError("Não foi possível carregar o catálogo.");
    setProducts((productsResult.data ?? []) as Product[]);
    setCategories((categoriesResult.data ?? []) as Category[]);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => products.filter((item) => {
    const text = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(text) || (item.categories?.name || "").toLowerCase().includes(text);
    const matchesStatus = status === "all" || (status === "active" ? item.is_active : !item.is_active);
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }), [products, search, status, categoryFilter]);

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function clearFiles() { setCoverFile(null); setGalleryFiles([]); setGallery([]); }
  function newProduct() {
    setEditingId(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id || "" });
    clearFiles();
    setShowForm(true);
    setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function edit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name, slug: product.slug, category_id: product.category_id, affiliate_url: product.affiliate_url,
      image_url: product.image_url || "", current_price: product.current_price?.toString() || "", old_price: product.old_price?.toString() || "",
      short_description: product.short_description || "", tags: (product.tags || []).join(", "), badge: product.badge || "",
      is_featured: product.is_featured, is_active: product.is_active,
    });
    setCoverFile(null); setGalleryFiles([]);
    setGallery([...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadOne(file: File, path: string) {
    if (file.size > 5 * 1024 * 1024) throw new Error(`A imagem “${file.name}” passa de 5 MB.`);
    if (!file.type.startsWith("image/")) throw new Error(`O arquivo “${file.name}” não é uma imagem.`);
    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");
    const result = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    if (result.error) throw result.error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    try {
      const slug = slugify(form.slug || form.name);
      if (!slug) throw new Error("Informe um nome válido.");
      const affiliate = new URL(form.affiliate_url);
      if (affiliate.protocol !== "https:") throw new Error("O link precisa começar com https://");

      let coverUrl = form.image_url.trim() || null;
      if (coverFile) {
        const extension = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        coverUrl = await uploadOne(coverFile, `covers/${slug}-${Date.now()}.${extension}`);
      }

      const payload = {
        name: form.name.trim(), slug, category_id: form.category_id, affiliate_url: affiliate.toString(), image_url: coverUrl,
        current_price: form.current_price ? Number(form.current_price.replace(",", ".")) : null,
        old_price: form.old_price ? Number(form.old_price.replace(",", ".")) : null,
        short_description: form.short_description.trim() || null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        badge: form.badge.trim() || null, is_featured: form.is_featured, is_active: form.is_active,
      };

      const productResult = editingId
        ? await supabase.from("products").update(payload).eq("id", editingId).select("id").single()
        : await supabase.from("products").insert(payload).select("id").single();
      if (productResult.error) throw productResult.error;
      const productId = productResult.data.id as string;

      if (coverUrl) {
        await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
        const existingCover = gallery.find((item) => item.image_url === coverUrl);
        if (existingCover) await supabase.from("product_images").update({ is_cover: true, sort_order: 0 }).eq("id", existingCover.id);
        else await supabase.from("product_images").insert({ product_id: productId, image_url: coverUrl, sort_order: 0, is_cover: true });
      }

      if (galleryFiles.length) {
        const baseOrder = Math.max(1, ...gallery.map((item) => item.sort_order + 1));
        const rows = [];
        for (let index = 0; index < galleryFiles.length; index++) {
          const file = galleryFiles[index];
          const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const imageUrl = await uploadOne(file, `gallery/${productId}/${Date.now()}-${index}.${extension}`);
          rows.push({ product_id: productId, image_url: imageUrl, sort_order: baseOrder + index, is_cover: false });
        }
        const galleryResult = await supabase.from("product_images").insert(rows);
        if (galleryResult.error) throw galleryResult.error;
      }

      setMessage(editingId ? "Produto atualizado." : "Produto cadastrado.");
      setShowForm(false); setForm(EMPTY); setEditingId(null); clearFiles();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar produto.");
    } finally { setSaving(false); }
  }

  async function removeGalleryImage(image: ProductImage) {
    if (!window.confirm("Remover esta imagem da galeria?")) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: removeError } = await supabase.from("product_images").delete().eq("id", image.id);
    if (removeError) setError(removeError.message); else setGallery((current) => current.filter((item) => item.id !== image.id));
  }

  async function makeCover(image: ProductImage) {
    if (!editingId) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const first = await supabase.from("product_images").update({ is_cover: false }).eq("product_id", editingId);
    if (first.error) { setError(first.error.message); return; }
    const [imageResult, productResult] = await Promise.all([
      supabase.from("product_images").update({ is_cover: true, sort_order: 0 }).eq("id", image.id),
      supabase.from("products").update({ image_url: image.image_url }).eq("id", editingId),
    ]);
    if (imageResult.error || productResult.error) setError(imageResult.error?.message || productResult.error?.message || "Erro ao trocar capa.");
    else { update("image_url", image.image_url); setGallery((current) => current.map((item) => ({ ...item, is_cover: item.id === image.id }))); setMessage("Capa alterada."); }
  }

  async function duplicate(product: Product) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const copy = {
      category_id: product.category_id, name: `${product.name} (cópia)`, slug: `${product.slug}-copia-${Date.now().toString().slice(-5)}`,
      affiliate_url: product.affiliate_url, image_url: product.image_url, current_price: product.current_price, old_price: product.old_price,
      short_description: product.short_description, tags: product.tags, badge: product.badge, is_featured: false, is_active: false,
    };
    const { error: copyError } = await supabase.from("products").insert(copy);
    if (copyError) setError(copyError.message); else { setMessage("Cópia criada como inativa."); await load(); }
  }
  async function toggle(product: Product) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: toggleError } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (toggleError) setError(toggleError.message); else await load();
  }
  async function remove(product: Product) {
    if (!window.confirm(`Excluir “${product.name}”?`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Produto excluído."); await load(); }
  }

  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : form.image_url;

  return (
    <>
      <div className="admin-page-heading clean-admin-heading">
        <div><span className="admin-eyebrow">CATÁLOGO</span><h1>Produtos</h1><p>Cadastre links, imagens, preços e destaques.</p></div>
        <button className="admin-button" onClick={newProduct}><Icon name="plus" />Adicionar produto</button>
      </div>
      {error ? <div className="error admin-alert">{error}</div> : null}
      {message ? <div className="success admin-alert">{message}</div> : null}

      <div className="admin-mini-stats clean-mini-stats">
        <div><strong>{products.length}</strong><small>Produtos</small></div>
        <div><strong>{products.filter((item) => item.is_active).length}</strong><small>Ativos</small></div>
        <div><strong>{products.filter((item) => item.is_featured).length}</strong><small>Destaques</small></div>
        <div><strong>{products.reduce((sum, item) => sum + Number(item.click_count || 0), 0)}</strong><small>Cliques</small></div>
      </div>

      {showForm ? <section className="admin-panel admin-form-panel clean-product-editor">
        <div className="admin-panel-head"><div><small>{editingId ? "EDIÇÃO" : "NOVO"}</small><h2>{editingId ? "Editar produto" : "Novo produto"}</h2></div><button className="admin-icon-close" type="button" onClick={() => setShowForm(false)}><Icon name="close" /></button></div>
        <form onSubmit={save}>
          <div className="clean-editor-grid">
            <div className="clean-editor-media">
              <label className="admin-label">Capa do produto</label>
              <div className="product-admin-preview">{coverPreview ? <img src={coverPreview} alt="Prévia" /> : <div><Icon name="image" size={34} /><strong>Sem capa</strong><small>Envie uma imagem quadrada.</small></div>}</div>
              <label className="admin-upload-button"><Icon name="image" />Escolher capa<input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} /></label>
              <label className="admin-label">Ou cole a URL<input className="admin-input" type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://..." /></label>
            </div>

            <div className="product-admin-fields">
              <div className="admin-form-grid">
                <label className="admin-label full">Nome<input className="admin-input" value={form.name} onChange={(e) => { update("name", e.target.value); if (!editingId) update("slug", slugify(e.target.value)); }} required placeholder="Ex.: Fone Bluetooth" /></label>
                <label className="admin-label">Categoria<select className="admin-input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)} required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="admin-label">Identificador<input className="admin-input" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} required /></label>
                <label className="admin-label full">Link de afiliado<input className="admin-input" type="url" value={form.affiliate_url} onChange={(e) => update("affiliate_url", e.target.value)} required placeholder="https://s.shopee.com.br/..." /></label>
                <label className="admin-label">Preço atual<input className="admin-input" inputMode="decimal" value={form.current_price} onChange={(e) => update("current_price", e.target.value)} placeholder="39,90" /></label>
                <label className="admin-label">Preço anterior<input className="admin-input" inputMode="decimal" value={form.old_price} onChange={(e) => update("old_price", e.target.value)} placeholder="59,90" /></label>
                <label className="admin-label">Selo<input className="admin-input" value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Oferta" maxLength={40} /></label>
                <label className="admin-label">Tags<input className="admin-input" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="casa, útil, promoção" /></label>
                <label className="admin-label full">Descrição curta<textarea className="admin-input admin-textarea" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Uma descrição direta do produto." /></label>
              </div>
              <div className="admin-check-grid"><label><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /><span><strong>Ativo</strong><small>Aparece no site</small></span></label><label><input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} /><span><strong>Destaque</strong><small>Entra primeiro no carrossel</small></span></label></div>
            </div>
          </div>

          <div className="clean-gallery-editor">
            <div><strong>Galeria de imagens</strong><p>Você pode colocar várias fotos. Depois escolha qual será a capa.</p></div>
            <label className="admin-upload-button"><Icon name="plus" />Adicionar fotos<input type="file" accept="image/*" multiple onChange={(event) => setGalleryFiles(Array.from(event.target.files || []))} /></label>
            {galleryFiles.length ? <small>{galleryFiles.length} nova(s) imagem(ns) selecionada(s).</small> : null}
            {gallery.length ? <div className="clean-gallery-list">{gallery.map((image) => <div key={image.id}><img src={image.image_url} alt="" />{image.is_cover ? <span>Capa</span> : <button type="button" onClick={() => void makeCover(image)}>Usar como capa</button>}<button className="danger" type="button" onClick={() => void removeGalleryImage(image)}>Remover</button></div>)}</div> : null}
          </div>

          <div className="admin-form-actions"><button className="admin-button secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="admin-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</button></div>
        </form>
      </section> : null}

      <section className="admin-panel clean-admin-list-panel">
        <div className="admin-toolbar clean-admin-toolbar">
          <div className="admin-search-field"><Icon name="search" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto" /></div>
          <select className="admin-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
          <select className="admin-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <span className="admin-result-count">{visible.length}</span>
        </div>
        <div className="admin-product-list clean-product-list">{visible.map((product) => <article key={product.id} className="admin-product-row">
          {product.image_url ? <img src={product.image_url} alt="" /> : <div className="admin-product-placeholder"><Icon name="image" /></div>}
          <div className="admin-product-main"><div className="admin-product-title-line"><strong>{product.name}</strong>{product.is_featured ? <span className="admin-pill featured">Destaque</span> : null}<span className={`admin-pill ${product.is_active ? "active" : "inactive"}`}>{product.is_active ? "Ativo" : "Inativo"}</span></div><small>{product.categories?.name || "Sem categoria"}</small><div className="admin-product-meta"><b>{formatPrice(product.current_price) || "Sem preço"}</b><span>{product.click_count} cliques</span><span>{product.product_images?.length || (product.image_url ? 1 : 0)} imagem(ns)</span></div></div>
          <div className="admin-row-actions"><button onClick={() => edit(product)}>Editar</button><button onClick={() => void duplicate(product)}>Duplicar</button><button onClick={() => void toggle(product)}>{product.is_active ? "Desativar" : "Ativar"}</button><button className="danger" onClick={() => void remove(product)}>Excluir</button></div>
        </article>)}</div>
        {!visible.length ? <div className="empty"><Icon name="search" size={30} /><h3>Nenhum produto encontrado</h3><p>Tente outro filtro ou cadastre um produto.</p></div> : null}
      </section>
    </>
  );
}

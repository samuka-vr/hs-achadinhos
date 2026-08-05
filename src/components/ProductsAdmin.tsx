"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Product, ProductImage } from "@/lib/types";
import { formatPrice, slugify } from "@/lib/utils";
import { isAllowedAffiliateUrl, isSafePublicUrl } from "@/lib/security";
import { replaceFileExtension, validateImageFile } from "@/lib/uploads";
import Icon from "./Icon";

type EditorTab = "basic" | "media" | "display" | "seo";

type ProductForm = {
  name: string;
  slug: string;
  product_code: string;
  category_id: string;
  affiliate_url: string;
  image_url: string;
  current_price: string;
  old_price: string;
  short_description: string;
  tags: string;
  badge: string;
  is_video_product: boolean;
  is_pinned: boolean;
  video_url: string;
  video_posted_at: string;
  sort_order: string;
  seo_title: string;
  seo_description: string;
  internal_notes: string;
  is_active: boolean;
};

const EMPTY: ProductForm = {
  name: "",
  slug: "",
  product_code: "",
  category_id: "",
  affiliate_url: "",
  image_url: "",
  current_price: "",
  old_price: "",
  short_description: "",
  tags: "",
  badge: "",
  is_video_product: false,
  is_pinned: false,
  video_url: "",
  video_posted_at: "",
  sort_order: "0",
  seo_title: "",
  seo_description: "",
  internal_notes: "",
  is_active: true,
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<EditorTab>("basic");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [quickImageId, setQuickImageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [gallery, setGallery] = useState<ProductImage[]>([]);

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const [productResult, categoryResult] = await Promise.all([
      supabase
        .from("products")
        .select("*,categories(id,name,slug),product_images(*)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]);

    if (productResult.error || categoryResult.error) {
      setError("Não foi possível carregar o catálogo.");
    }

    setProducts((productResult.data ?? []) as Product[]);
    setCategories((categoryResult.data ?? []) as Category[]);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

  useEffect(() => {
    if (!showForm || typeof window === "undefined" || !window.matchMedia("(max-width: 760px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : form.image_url), [coverFile, form.image_url]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverFile, coverPreview]);

  const visible = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products
      .filter((item) => {
        const matchText =
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch) ||
          (item.product_code || "").toLowerCase().includes(normalizedSearch) ||
          (item.categories?.name || "").toLowerCase().includes(normalizedSearch);

        const matchStatus =
          status === "all" ||
          (status === "active" && item.is_active) ||
          (status === "inactive" && !item.is_active) ||
          (status === "video" && item.is_video_product) ||
          (status === "pinned" && item.is_pinned) ||
          (status === "no-image" && !item.image_url);

        const matchCategory = categoryFilter === "all" || item.category_id === categoryFilter;
        return matchText && matchStatus && matchCategory;
      })
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sort === "clicked") return b.click_count - a.click_count;
        if (sort === "price-low") return (a.current_price ?? Number.MAX_SAFE_INTEGER) - (b.current_price ?? Number.MAX_SAFE_INTEGER);
        if (sort === "price-high") return (b.current_price ?? -1) - (a.current_price ?? -1);
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, search, status, categoryFilter, sort]);

  const visibleIds = useMemo(() => visible.map((item) => item.id), [visible]);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleSelectVisible() {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFiles() {
    setCoverFile(null);
    setGalleryFiles([]);
    setGallery([]);
  }

  function closeEditor() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    resetFiles();
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id || "", sort_order: String(products.length + 1) });
    resetFiles();
    setTab("basic");
    setShowForm(true);
    setError("");
    setMessage("");
    if (typeof window !== "undefined" && !window.matchMedia("(max-width: 760px)").matches) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function edit(product: Product, initialTab: EditorTab = "basic") {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      product_code: product.product_code || "",
      category_id: product.category_id,
      affiliate_url: product.affiliate_url,
      image_url: product.image_url || "",
      current_price: product.current_price?.toString() || "",
      old_price: product.old_price?.toString() || "",
      short_description: product.short_description || "",
      tags: (product.tags || []).join(", "),
      badge: product.badge || "",
      is_video_product: Boolean(product.is_video_product || product.is_featured),
      is_pinned: Boolean(product.is_pinned),
      video_url: product.video_url || "",
      video_posted_at: product.video_posted_at?.slice(0, 16) || "",
      sort_order: String(product.sort_order || 0),
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
      internal_notes: product.internal_notes || "",
      is_active: product.is_active,
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setGallery([...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order));
    setTab(initialTab);
    setShowForm(true);
    setExpandedId(null);
    if (typeof window !== "undefined" && !window.matchMedia("(max-width: 760px)").matches) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function uploadOne(file: File, path: string) {
    const validated = await validateImageFile(file);
    const safePath = replaceFileExtension(path, validated.extension);
    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");

    const result = await supabase.storage.from("product-images").upload(safePath, file, {
      contentType: validated.contentType,
      upsert: false,
    });
    if (result.error) throw result.error;
    return supabase.storage.from("product-images").getPublicUrl(safePath).data.publicUrl;
  }

  async function quickReplaceCover(product: Product, file: File | null) {
    if (!file) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setQuickImageId(product.id);
    setError("");
    setMessage("");

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const imageUrl = await uploadOne(file, `covers/${product.slug}-${Date.now()}.${extension}`);

      const updateResult = await supabase.from("products").update({ image_url: imageUrl }).eq("id", product.id);
      if (updateResult.error) throw updateResult.error;

      await supabase.from("product_images").update({ is_cover: false }).eq("product_id", product.id);
      const imageResult = await supabase.from("product_images").insert({
        product_id: product.id,
        image_url: imageUrl,
        sort_order: 0,
        is_cover: true,
      });
      if (imageResult.error) throw imageResult.error;

      setMessage(`Foto de “${product.name}” atualizada.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível trocar a imagem.");
    } finally {
      setQuickImageId(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setSaving(false);
      return;
    }

    try {
      const slug = slugify(form.slug || form.name);
      if (!slug) throw new Error("Informe um nome válido.");
      if (!form.category_id) throw new Error("Escolha uma categoria.");

      if (!isAllowedAffiliateUrl(form.affiliate_url)) throw new Error("Use um link oficial da Shopee começando com https://");
      const affiliate = new URL(form.affiliate_url);
      if (form.image_url.trim() && !isSafePublicUrl(form.image_url)) throw new Error("A URL da imagem precisa ser local ou começar com https://");
      if (form.video_url.trim() && !isSafePublicUrl(form.video_url)) throw new Error("O link do vídeo precisa começar com https://");

      const parsePrice = (value: string, label: string) => {
        if (!value.trim()) return null;
        const parsed = Number(value.replace(/\./g, "").replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} inválido.`);
        return Math.round(parsed * 100) / 100;
      };
      const currentPrice = parsePrice(form.current_price, "Preço atual");
      const oldPrice = parsePrice(form.old_price, "Preço anterior");
      if (oldPrice !== null && currentPrice !== null && oldPrice < currentPrice) {
        throw new Error("O preço anterior não pode ser menor que o preço atual.");
      }

      let coverUrl = form.image_url.trim() || null;
      if (coverFile) {
        const extension = coverFile.name.split(".").pop() || "jpg";
        coverUrl = await uploadOne(coverFile, `covers/${slug}-${Date.now()}.${extension}`);
      }

      const payload = {
        name: form.name.trim(),
        slug,
        product_code: form.product_code.trim() || null,
        category_id: form.category_id,
        affiliate_url: affiliate.toString(),
        image_url: coverUrl,
        current_price: currentPrice,
        old_price: oldPrice,
        short_description: form.short_description.trim() || null,
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        badge: form.badge.trim() || null,
        is_featured: form.is_video_product,
        is_video_product: form.is_video_product,
        is_pinned: form.is_pinned,
        video_url: form.video_url.trim() || null,
        video_posted_at: form.video_posted_at || null,
        sort_order: Number(form.sort_order) || 0,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        internal_notes: form.internal_notes.trim() || null,
        is_active: form.is_active,
      };

      const result = editingId
        ? await supabase.from("products").update(payload).eq("id", editingId).select("id").single()
        : await supabase.from("products").insert(payload).select("id").single();

      if (result.error) throw result.error;
      const productId = result.data.id as string;

      await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);

      if (coverUrl) {
        const existing = gallery.find((item) => item.image_url === coverUrl);
        if (existing) {
          await supabase.from("product_images").update({ is_cover: true, sort_order: 0 }).eq("id", existing.id);
        } else {
          await supabase.from("product_images").insert({ product_id: productId, image_url: coverUrl, sort_order: 0, is_cover: true });
        }
      }

      if (galleryFiles.length) {
        const base = Math.max(1, ...gallery.map((item) => item.sort_order + 1));
        const rows = [];
        for (let index = 0; index < galleryFiles.length; index += 1) {
          const file = galleryFiles[index];
          const extension = file.name.split(".").pop() || "jpg";
          const imageUrl = await uploadOne(file, `gallery/${productId}/${Date.now()}-${index}.${extension}`);
          rows.push({ product_id: productId, image_url: imageUrl, sort_order: base + index, is_cover: false });
        }
        const galleryResult = await supabase.from("product_images").insert(rows);
        if (galleryResult.error) throw galleryResult.error;
      }

      setMessage(editingId ? "Produto atualizado." : "Produto cadastrado.");
      closeEditor();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function makeCover(image: ProductImage) {
    if (!editingId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    await supabase.from("product_images").update({ is_cover: false }).eq("product_id", editingId);
    const [coverResult, productResult] = await Promise.all([
      supabase.from("product_images").update({ is_cover: true, sort_order: 0 }).eq("id", image.id),
      supabase.from("products").update({ image_url: image.image_url }).eq("id", editingId),
    ]);

    if (coverResult.error || productResult.error) {
      setError(coverResult.error?.message || productResult.error?.message || "Erro ao atualizar a capa.");
      return;
    }

    update("image_url", image.image_url);
    setGallery((current) => current.map((item) => ({ ...item, is_cover: item.id === image.id })));
    setMessage("Capa atualizada.");
  }

  async function removeGallery(image: ProductImage) {
    if (!confirm("Remover esta imagem?")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { error: removeError } = await supabase.from("product_images").delete().eq("id", image.id);
    if (removeError) {
      setError(removeError.message);
      return;
    }

    if (image.is_cover && editingId) {
      await supabase.from("products").update({ image_url: null }).eq("id", editingId);
      update("image_url", "");
    }
    setGallery((current) => current.filter((item) => item.id !== image.id));
  }

  async function toggle(product: Product, field: "is_active" | "is_pinned" | "is_video_product") {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const next = !Boolean(product[field]);
    const payload = field === "is_video_product" ? { is_video_product: next, is_featured: next } : { [field]: next };
    const { error: toggleError } = await supabase.from("products").update(payload).eq("id", product.id);

    if (toggleError) setError(toggleError.message);
    else await load();
  }

  async function duplicate(product: Product) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const copy = {
      category_id: product.category_id,
      name: `${product.name} (cópia)`,
      slug: `${product.slug}-copia-${Date.now().toString().slice(-5)}`,
      product_code: null,
      affiliate_url: product.affiliate_url,
      image_url: product.image_url,
      current_price: product.current_price,
      old_price: product.old_price,
      short_description: product.short_description,
      tags: product.tags,
      badge: product.badge,
      is_featured: false,
      is_video_product: false,
      is_pinned: false,
      is_active: false,
    };

    const { error: copyError } = await supabase.from("products").insert(copy);
    if (copyError) setError(copyError.message);
    else {
      setMessage("Cópia criada como rascunho.");
      await load();
    }
  }

  async function remove(product: Product) {
    if (!confirm(`Excluir “${product.name}”?`)) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Produto excluído.");
      await load();
    }
  }

  async function setSelectedStatus(isActive: boolean) {
    if (!selectedIds.length) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBulkSaving(true);
    setError("");
    setMessage("");
    const { error: bulkError } = await supabase.from("products").update({ is_active: isActive }).in("id", selectedIds);

    if (bulkError) setError(bulkError.message);
    else {
      setMessage(`${selectedIds.length} produto(s) ${isActive ? "publicado(s)" : "movido(s) para rascunho"}.`);
      clearSelection();
      await load();
    }
    setBulkSaving(false);
  }

  async function deleteSelected() {
    if (!selectedIds.length) return;
    if (!confirm(`Excluir permanentemente ${selectedIds.length} produto(s)? Esta ação não pode ser desfeita.`)) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBulkSaving(true);
    setError("");
    setMessage("");
    const { error: bulkError } = await supabase.from("products").delete().in("id", selectedIds);

    if (bulkError) setError(bulkError.message);
    else {
      setMessage(`${selectedIds.length} produto(s) excluído(s).`);
      clearSelection();
      await load();
    }
    setBulkSaving(false);
  }

  async function setSelectedField(field: "is_video_product" | "is_pinned", value: boolean, label: string) {
    if (!selectedIds.length) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBulkSaving(true);
    setError("");
    const payload = field === "is_video_product" ? { is_video_product: value, is_featured: value } : { is_pinned: value };
    const { error: bulkError } = await supabase.from("products").update(payload).in("id", selectedIds);

    if (bulkError) setError(bulkError.message);
    else {
      setMessage(`${selectedIds.length} produto(s) ${label}.`);
      await load();
    }
    setBulkSaving(false);
  }

  async function setSelectedCategory() {
    if (!selectedIds.length || !bulkCategory) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBulkSaving(true);
    setError("");
    const { error: bulkError } = await supabase.from("products").update({ category_id: bulkCategory }).in("id", selectedIds);

    if (bulkError) setError(bulkError.message);
    else {
      setMessage(`Categoria alterada em ${selectedIds.length} produto(s).`);
      setBulkCategory("");
      clearSelection();
      await load();
    }
    setBulkSaving(false);
  }

  const tabs: Array<[EditorTab, string, "products" | "image" | "eye" | "search"]> = [
    ["basic", "Informações", "products"],
    ["media", "Imagens", "image"],
    ["display", "Publicação", "eye"],
    ["seo", "SEO", "search"],
  ];

  return (
    <>
      <div className="admin-page-heading-v5 products-page-heading-v9">
        <div>
          <span>CATÁLOGO</span>
          <h1>Produtos</h1>
          <p>Edite nomes completos, fotos, preços e publicação com uma experiência melhor no celular.</p>
        </div>
        <div className="product-heading-actions">
          <Link className="admin-button-v5 secondary" href="/admin/produtos/importar">
            <Icon name="code" /> Importar lista
          </Link>
          <button className="admin-button-v5" onClick={openNew}>
            <Icon name="plus" /> Novo produto
          </button>
        </div>
      </div>

      {error ? <div className="admin-alert-v5 error">{error}</div> : null}
      {message ? <div className="admin-alert-v5 success">{message}</div> : null}

      {showForm ? (
        <section className="product-editor-shell-v9">
          <form onSubmit={save} className="product-editor-v5 product-editor-v9">
            <div className="product-editor-top-v5 product-editor-top-v9">
              <div>
                <small>{editingId ? "EDITANDO PRODUTO" : "NOVO PRODUTO"}</small>
                <h2>{form.name || (editingId ? "Editar produto" : "Cadastrar produto")}</h2>
                {editingId ? <p>As alterações aparecem no site após salvar.</p> : <p>Preencha o básico agora e complemente quando quiser.</p>}
              </div>
              <div>
                {editingId ? (
                  <Link href={`/go/${editingId}`} target="_blank" title="Abrir produto">
                    <Icon name="external" /> <span>Ver produto</span>
                  </Link>
                ) : null}
                <button type="button" onClick={closeEditor} title="Fechar editor">
                  <Icon name="close" /> <span>Fechar</span>
                </button>
              </div>
            </div>

            <div className="product-editor-tabs-v5 product-editor-tabs-v9">
              {tabs.map(([key, label, icon]) => (
                <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                  <Icon name={icon} /> {label}
                </button>
              ))}
            </div>

            <div className="product-editor-body-v5 product-editor-body-v9">
              {tab === "basic" ? (
                <div className="admin-form-grid-v5 product-form-grid-v9">
                  <label className="full">
                    <span>Nome completo do produto</span>
                    <textarea
                      rows={3}
                      value={form.name}
                      onChange={(event) => update("name", event.target.value)}
                      placeholder="Cole o nome completo sem cortar"
                      required
                    />
                    <small>{form.name.length} caracteres — o nome aparece completo no painel.</small>
                  </label>
                  <label>
                    <span>Código</span>
                    <input value={form.product_code} onChange={(event) => update("product_code", event.target.value)} placeholder="A001" />
                  </label>
                  <label>
                    <span>Categoria</span>
                    <select value={form.category_id} onChange={(event) => update("category_id", event.target.value)} required>
                      <option value="">Escolha uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full">
                    <span>Link de afiliado da Shopee</span>
                    <input
                      type="url"
                      value={form.affiliate_url}
                      onChange={(event) => update("affiliate_url", event.target.value)}
                      placeholder="https://s.shopee.com.br/..."
                      required
                    />
                  </label>
                  <label>
                    <span>Preço principal</span>
                    <input inputMode="decimal" value={form.current_price} onChange={(event) => update("current_price", event.target.value)} placeholder="29,90" />
                  </label>
                  <label>
                    <span>Preço anterior ou valor máximo</span>
                    <input inputMode="decimal" value={form.old_price} onChange={(event) => update("old_price", event.target.value)} placeholder="59,90" />
                  </label>
                  <label>
                    <span>Selo</span>
                    <input value={form.badge} onChange={(event) => update("badge", event.target.value)} placeholder="Oferta, Novo..." />
                  </label>
                  <label>
                    <span>Tags</span>
                    <input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="cozinha, organização" />
                  </label>
                  <label className="full">
                    <span>Descrição curta</span>
                    <textarea rows={5} value={form.short_description} onChange={(event) => update("short_description", event.target.value)} placeholder="Explique o produto de forma direta e natural." />
                  </label>
                  <label className="full">
                    <span>Anotações internas</span>
                    <textarea rows={3} value={form.internal_notes} onChange={(event) => update("internal_notes", event.target.value)} placeholder="Observações que aparecem somente no painel." />
                    <small>Este texto nunca aparece para os visitantes.</small>
                  </label>
                </div>
              ) : null}

              {tab === "media" ? (
                <div className="media-editor-v5 media-editor-v9">
                  <div className="cover-editor-v5 cover-editor-v9">
                    <div className={`cover-preview-v5 cover-preview-v9 ${coverPreview ? "has-image" : ""}`}>
                      {coverPreview ? <img src={coverPreview} alt="Prévia da capa" /> : <span><Icon name="image" size={34} />Sem capa</span>}
                    </div>
                    <div className="cover-controls-v9">
                      <div>
                        <h3>Imagem principal</h3>
                        <p>Você pode escolher da galeria ou abrir a câmera do celular.</p>
                      </div>
                      <div className="mobile-photo-actions-v9">
                        <label className="admin-button-v5">
                          <Icon name="image" /> {coverPreview ? "Trocar foto" : "Escolher foto"}
                          <input type="file" accept="image/*" hidden onChange={(event) => setCoverFile(event.target.files?.[0] || null)} />
                        </label>
                        <label className="admin-button-v5 secondary camera-action-v9">
                          <Icon name="mobile" /> Tirar foto
                          <input type="file" accept="image/*" capture="environment" hidden onChange={(event) => setCoverFile(event.target.files?.[0] || null)} />
                        </label>
                        {coverPreview ? (
                          <button type="button" className="admin-button-v5 ghost danger-text-v9" onClick={() => { setCoverFile(null); update("image_url", ""); }}>
                            <Icon name="trash" /> Remover capa
                          </button>
                        ) : null}
                      </div>
                      {coverFile ? <small className="selected-file-v9">Selecionada: {coverFile.name}</small> : null}
                      <details className="image-url-details-v9">
                        <summary>Usar URL de uma imagem</summary>
                        <label>
                          <span>URL da imagem</span>
                          <input type="url" value={form.image_url} onChange={(event) => update("image_url", event.target.value)} placeholder="https://..." />
                        </label>
                      </details>
                    </div>
                  </div>

                  <div className="gallery-editor-v5 gallery-editor-v9">
                    <div className="gallery-heading-v9">
                      <div>
                        <h3>Galeria do produto</h3>
                        <p>Adicione outras fotos e toque em uma delas para definir como capa.</p>
                      </div>
                      <label className="admin-button-v5">
                        <Icon name="plus" /> Adicionar fotos
                        <input type="file" accept="image/*" multiple hidden onChange={(event) => setGalleryFiles(Array.from(event.target.files || []))} />
                      </label>
                    </div>
                    {galleryFiles.length ? <div className="pending-gallery-v9"><Icon name="check" /> {galleryFiles.length} foto(s) pronta(s) para enviar ao salvar.</div> : null}
                    <div className="gallery-grid-v5 gallery-grid-v9">
                      {gallery.map((image) => (
                        <article key={image.id} className={image.is_cover ? "is-cover-v9" : ""}>
                          <img src={image.image_url} alt="Foto do produto" />
                          <div className="gallery-card-actions-v9">
                            {image.is_cover ? <b>Capa atual</b> : <button type="button" onClick={() => void makeCover(image)}>Usar como capa</button>}
                            <button type="button" className="danger" onClick={() => void removeGallery(image)} aria-label="Remover imagem"><Icon name="trash" /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {!gallery.length ? <div className="empty-gallery-v9"><Icon name="image" />A galeria ainda não possui fotos.</div> : null}
                  </div>
                </div>
              ) : null}

              {tab === "display" ? (
                <div className="admin-form-grid-v5 product-form-grid-v9">
                  <label className="checkbox-card-v5 full">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} />
                    <span><strong>Publicado</strong><small>O produto fica visível no site.</small></span>
                  </label>
                  <label className="checkbox-card-v5 full">
                    <input type="checkbox" checked={form.is_video_product} onChange={(event) => update("is_video_product", event.target.checked)} />
                    <span><strong>Produto de vídeo</strong><small>Aparece na seção principal para quem veio da bio.</small></span>
                  </label>
                  <label className="checkbox-card-v5 full">
                    <input type="checkbox" checked={form.is_pinned} onChange={(event) => update("is_pinned", event.target.checked)} />
                    <span><strong>Fixar no topo</strong><small>Fica antes dos demais produtos da mesma seção.</small></span>
                  </label>
                  <label>
                    <span>Data do vídeo</span>
                    <input type="datetime-local" value={form.video_posted_at} onChange={(event) => update("video_posted_at", event.target.value)} />
                  </label>
                  <label>
                    <span>Ordem manual</span>
                    <input type="number" value={form.sort_order} onChange={(event) => update("sort_order", event.target.value)} />
                  </label>
                  <label className="full">
                    <span>Link do vídeo (opcional)</span>
                    <input type="url" value={form.video_url} onChange={(event) => update("video_url", event.target.value)} placeholder="TikTok, Instagram ou YouTube" />
                  </label>
                  <label className="full">
                    <span>URL amigável</span>
                    <input value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))} />
                  </label>
                </div>
              ) : null}

              {tab === "seo" ? (
                <div className="admin-form-grid-v5 product-form-grid-v9">
                  <label className="full">
                    <span>Título no Google</span>
                    <input value={form.seo_title} onChange={(event) => update("seo_title", event.target.value)} placeholder={form.name || "Título do produto"} />
                    <small>{form.seo_title.length}/60 caracteres</small>
                  </label>
                  <label className="full">
                    <span>Descrição no Google</span>
                    <textarea rows={5} value={form.seo_description} onChange={(event) => update("seo_description", event.target.value)} placeholder={form.short_description || "Descrição curta do produto"} />
                    <small>{form.seo_description.length}/160 caracteres</small>
                  </label>
                  <div className="seo-preview-v5 full">
                    <small>PRÉVIA</small>
                    <h3>{form.seo_title || form.name || "Nome do produto"}</h3>
                    <span>hs-achadinhos.vercel.app/produto/{form.slug || "produto"}</span>
                    <p>{form.seo_description || form.short_description || "A descrição do produto aparecerá aqui."}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="product-editor-footer-v5 product-editor-footer-v9">
              <button type="button" className="admin-button-v5 secondary" onClick={closeEditor}>Cancelar</button>
              <button className="admin-button-v5" disabled={saving}>
                <Icon name="save" /> {saving ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={`admin-card-v5 catalog-list-card-v5 catalog-list-card-v9 ${selectedIds.length ? "has-mobile-bulk-v9" : ""}`}>
        <div className="catalog-toolbar-v5 catalog-toolbar-v9">
          <div className="catalog-search-v9">
            <Icon name="search" />
            <input placeholder="Buscar pelo nome completo, código ou categoria" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <button type="button" className={`mobile-filter-toggle-v9 ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((current) => !current)}>
            <Icon name="filter" /> Filtros
            {(status !== "all" || categoryFilter !== "all" || sort !== "recent") ? <b>•</b> : null}
          </button>
          <div className={`catalog-filter-fields-v9 ${filtersOpen ? "open" : ""}`}>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Todos os status</option>
              <option value="active">Publicados</option>
              <option value="inactive">Rascunhos</option>
              <option value="video">Produtos de vídeo</option>
              <option value="pinned">Fixados</option>
              <option value="no-image">Sem imagem</option>
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Todas as categorias</option>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="clicked">Mais clicados</option>
              <option value="price-low">Menor preço</option>
              <option value="price-high">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
          <b className="catalog-result-count-v9">{visible.length}</b>
        </div>

        <div className="mobile-quick-filters-v9">
          <button className={status === "all" ? "active" : ""} onClick={() => setStatus("all")}>Todos</button>
          <button className={status === "no-image" ? "active" : ""} onClick={() => setStatus("no-image")}>Sem foto</button>
          <button className={status === "inactive" ? "active" : ""} onClick={() => setStatus("inactive")}>Rascunhos</button>
          <button className={status === "active" ? "active" : ""} onClick={() => setStatus("active")}>Publicados</button>
        </div>

        <div className="product-selection-v72 product-selection-v9">
          <label>
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} disabled={!visible.length} />
            <span>{allVisibleSelected ? "Desmarcar todos" : `Selecionar todos (${visible.length})`}</span>
          </label>
          {selectedIds.length ? <strong>{selectedIds.length} selecionado(s)</strong> : <small>Toque na caixa de um produto para selecionar.</small>}
        </div>

        {selectedIds.length ? (
          <div className="product-bulk-actions-v72 product-bulk-actions-v8 product-bulk-actions-v9">
            <div className="bulk-summary-v9">
              <strong>{selectedIds.length} selecionado(s)</strong>
              <button type="button" onClick={clearSelection}>Limpar</button>
            </div>
            <div className="bulk-category-v8 bulk-category-v9">
              <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)}>
                <option value="">Alterar categoria...</option>
                {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
              </select>
              <button type="button" onClick={() => void setSelectedCategory()} disabled={bulkSaving || !bulkCategory}>Aplicar</button>
            </div>
            <div className="bulk-action-scroll-v9">
              <button type="button" className="bulk-publish-v72" onClick={() => void setSelectedStatus(true)} disabled={bulkSaving}><Icon name="eye" />Publicar</button>
              <button type="button" className="bulk-draft-v72" onClick={() => void setSelectedStatus(false)} disabled={bulkSaving}>Rascunho</button>
              <button type="button" onClick={() => void setSelectedField("is_video_product", true, "marcado(s) como produto de vídeo")} disabled={bulkSaving}>Do vídeo</button>
              <button type="button" onClick={() => void setSelectedField("is_pinned", true, "fixado(s) no topo")} disabled={bulkSaving}>Fixar</button>
              <button type="button" className="bulk-delete-v72" onClick={() => void deleteSelected()} disabled={bulkSaving}><Icon name="trash" />Excluir</button>
            </div>
          </div>
        ) : null}

        <div className="product-table-v5 product-table-desktop-v9">
          <div className="product-table-head-v5">
            <span className="product-head-select-v72"><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} disabled={!visible.length} aria-label="Selecionar todos" />Produto</span>
            <span>Categoria</span><span>Preço</span><span>Cliques</span><span>Status</span><span>Ações</span>
          </div>
          {visible.map((product) => (
            <article key={product.id} className={selectedIds.includes(product.id) ? "selected-v72" : ""}>
              <div className="product-cell-v5 product-cell-desktop-v9">
                <input className="product-row-check-v72" type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelection(product.id)} aria-label={`Selecionar ${product.name}`} />
                {product.image_url ? <img src={product.image_url} alt="" /> : <span><Icon name="image" /></span>}
                <div><strong>{product.name}</strong><small>{product.product_code ? `Código ${product.product_code}` : "Sem código"}</small></div>
              </div>
              <span>{product.categories?.name || "Sem categoria"}</span>
              <strong>{formatPrice(product.current_price) || "—"}</strong>
              <span>{product.click_count}</span>
              <div className="status-stack-v5"><b className={product.is_active ? "published" : "draft"}>{product.is_active ? "Publicado" : "Rascunho"}</b>{product.is_video_product ? <small>Do vídeo</small> : null}{product.is_pinned ? <small>Fixado</small> : null}</div>
              <div className="table-actions-v5">
                <button title="Editar" onClick={() => edit(product)}><Icon name="edit" /></button>
                <button title="Imagens" onClick={() => edit(product, "media")}><Icon name="image" /></button>
                <button title="Duplicar" onClick={() => void duplicate(product)}><Icon name="copy" /></button>
                <button title={product.is_pinned ? "Desafixar" : "Fixar"} onClick={() => void toggle(product, "is_pinned")}><Icon name="up" /></button>
                <button title="Excluir" className="danger" onClick={() => void remove(product)}><Icon name="trash" /></button>
              </div>
            </article>
          ))}
        </div>

        <div className="product-mobile-list-v9">
          {visible.map((product) => {
            const expanded = expandedId === product.id;
            const uploading = quickImageId === product.id;
            return (
              <article key={product.id} className={`product-mobile-card-v9 ${selectedIds.includes(product.id) ? "selected-v9" : ""}`}>
                <div className="product-mobile-card-top-v9">
                  <label className="product-mobile-check-v9">
                    <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelection(product.id)} />
                    <span>Selecionar</span>
                  </label>
                  <div className="mobile-statuses-v9">
                    <b className={product.is_active ? "published" : "draft"}>{product.is_active ? "Publicado" : "Rascunho"}</b>
                    {product.is_pinned ? <small>Fixado</small> : null}
                    {product.is_video_product ? <small>Do vídeo</small> : null}
                  </div>
                </div>

                <div className="product-mobile-main-v9">
                  <div className={`product-mobile-image-v9 ${product.image_url ? "has-image" : "missing"}`}>
                    {product.image_url ? <img src={product.image_url} alt="" /> : <span><Icon name="image" size={28} />Sem foto</span>}
                    <label className={`quick-photo-button-v9 ${uploading ? "loading" : ""}`}>
                      <Icon name="image" /> {uploading ? "Enviando..." : product.image_url ? "Trocar" : "Adicionar"}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={uploading}
                        onChange={(event) => {
                          void quickReplaceCover(product, event.target.files?.[0] || null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="product-mobile-info-v9">
                    <h3>{product.name}</h3>
                    <div className="product-mobile-meta-v9">
                      <span><Icon name="categories" />{product.categories?.name || "Sem categoria"}</span>
                      <span><Icon name="tag" />{formatPrice(product.current_price) || "Sem preço"}</span>
                      <span><Icon name="code" />{product.product_code || "Sem código"}</span>
                    </div>
                  </div>
                </div>

                <div className="product-mobile-primary-actions-v9">
                  <button className="primary" onClick={() => edit(product)}><Icon name="edit" />Editar produto</button>
                  <button onClick={() => edit(product, "media")}><Icon name="image" />Fotos</button>
                  <button className={expanded ? "active" : ""} onClick={() => setExpandedId(expanded ? null : product.id)}><Icon name="more" /></button>
                </div>

                {expanded ? (
                  <div className="product-mobile-more-v9">
                    <div className="product-mobile-details-v9">
                      <span><strong>{product.click_count}</strong> cliques</span>
                      <span><strong>{product.product_images?.length || 0}</strong> fotos</span>
                      <span><strong>{product.short_description ? "Sim" : "Não"}</strong> descrição</span>
                    </div>
                    <div className="product-mobile-secondary-actions-v9">
                      <button onClick={() => void toggle(product, "is_active")}><Icon name="eye" />{product.is_active ? "Mover para rascunho" : "Publicar"}</button>
                      <button onClick={() => void toggle(product, "is_pinned")}><Icon name="up" />{product.is_pinned ? "Desafixar" : "Fixar"}</button>
                      <button onClick={() => void duplicate(product)}><Icon name="copy" />Duplicar</button>
                      <button className="danger" onClick={() => void remove(product)}><Icon name="trash" />Excluir</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!visible.length ? <div className="empty-v5"><Icon name="products" size={34} /><h3>Nenhum produto encontrado</h3><p>Altere os filtros ou cadastre um novo produto.</p></div> : null}
      </section>
    </>
  );
}

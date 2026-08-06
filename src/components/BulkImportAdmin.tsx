"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { isAllowedAffiliateUrl } from "@/lib/security";
import Icon from "./Icon";

type DuplicateAction = "skip" | "update";
type ImportMode = "draft" | "published";

type ParsedItem = {
  tempId: string;
  sourceNumber: number;
  name: string;
  sourceCategoryName: string;
  categoryName: string;
  description: string;
  priceText: string;
  priceMin: number | null;
  priceMax: number | null;
  affiliateUrl: string;
  productCode: string;
  enabled: boolean;
  errors: string[];
  duplicateId: string | null;
  duplicateName: string | null;
  duplicateAction: DuplicateAction;
};

type ExistingProduct = {
  id: string;
  name: string;
  slug: string;
  affiliate_url: string;
  product_code: string | null;
};

type ExistingCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type CategoryAliasRow = {
  alias: string;
  categories: { name: string } | null;
};

type ImportSummary = {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  categoriesCreated: number;
  failures: string[];
};

const EXAMPLE = `1. Nome completo do produto
Categoria: Cozinha
Descrição: Descrição curta e direta do produto.
Valor: R$15,99 - R$48,99
Link: https://s.shopee.com.br/SEU_LINK

2. Outro produto
Categoria: Eletrônicos
Descrição: Outra descrição.
Valor: A partir de R$26,98
Link: https://s.shopee.com.br/OUTRO_LINK`;

const MAIN_CATEGORIES = [
  {
    name: "Casa & Cozinha",
    slug: "casa-cozinha",
    icon: "🏠",
    description: "Cozinha, decoração, iluminação e soluções para a casa.",
    accentColor: "#D98B83",
    aliases: [
      "Cozinha", "Organização de Cozinha", "Cozinha e Organização",
      "Casa e Cozinha", "Casa e Iluminação", "Casa e Aromaterapia",
      "Decoração e Iluminação", "Decoração e Beleza"
    ],
  },
  {
    name: "Limpeza & Organização",
    slug: "limpeza-organizacao",
    icon: "🧼",
    description: "Limpeza, lavanderia, organização e utilidades do dia a dia.",
    accentColor: "#78A694",
    aliases: [
      "Limpeza", "Limpeza e Lavanderia", "Organização",
      "Organização e Escritório", "Lavanderia e Casa"
    ],
  },
  {
    name: "Eletrônicos",
    slug: "eletronicos",
    icon: "🎧",
    description: "Áudio, carregadores, cabos, acessórios e segurança eletrônica.",
    accentColor: "#7E91B8",
    aliases: [
      "Eletrônicos", "Eletrônicos e Áudio", "Eletrônicos e Carregadores",
      "Eletrônicos e Cabos", "Eletrônicos e Limpeza", "Segurança e Eletrônicos"
    ],
  },
  {
    name: "Beleza & Bem-estar",
    slug: "beleza-bem-estar",
    icon: "✨",
    description: "Beleza, cuidados pessoais, cabelo e bem-estar.",
    accentColor: "#C97A9B",
    aliases: [
      "Beleza", "Saúde e Bem-estar", "Beleza Masculina",
      "Organização e Beleza", "Beleza e Cabelo", "Beleza e Cuidados Pessoais"
    ],
  },
  {
    name: "Automotivo",
    slug: "automotivo",
    icon: "🚗",
    description: "Acessórios, organização e limpeza para carros.",
    accentColor: "#8C8F98",
    aliases: ["Automotivo", "Limpeza e Automotivo", "Automotivo e Organização"],
  },
  {
    name: "Pet",
    slug: "pet",
    icon: "🐾",
    description: "Produtos e acessórios para cães, gatos e outros pets.",
    accentColor: "#C59669",
    aliases: ["Pet", "Lavanderia e Pet"],
  },
  {
    name: "Moda & Lazer",
    slug: "moda-lazer",
    icon: "🎮",
    description: "Moda, games, lazer e utilidades variadas.",
    accentColor: "#8C78B4",
    aliases: ["Moda", "Games", "Utilidades", "Moda e Lazer"],
  },
] as const;

type MainCategoryName = (typeof MAIN_CATEGORIES)[number]["name"];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveMainCategory(sourceCategory: string): MainCategoryName | null {
  const normalizedSource = normalize(sourceCategory);
  if (!normalizedSource) return null;

  for (const category of MAIN_CATEGORIES) {
    if (normalize(category.name) === normalizedSource) return category.name;
    if (category.aliases.some((alias) => normalize(alias) === normalizedSource)) return category.name;
  }

  if (normalizedSource.includes("pet")) return "Pet";
  if (normalizedSource.includes("automot")) return "Automotivo";
  if (/(beleza|saude|bem-estar|cabelo|barba|maquiagem)/.test(normalizedSource)) return "Beleza & Bem-estar";
  if (/(eletron|audio|carregador|cabo|seguranca|camera)/.test(normalizedSource)) return "Eletrônicos";
  if (/(cozinha|casa|decoracao|iluminacao|aromaterapia)/.test(normalizedSource)) return "Casa & Cozinha";
  if (/(limpeza|lavanderia|organizacao|escritorio)/.test(normalizedSource)) return "Limpeza & Organização";
  if (/(moda|game|lazer|utilidade)/.test(normalizedSource)) return "Moda & Lazer";

  return null;
}

function resolveCategoryWithRows(sourceCategory: string, rows: CategoryAliasRow[]): MainCategoryName | null {
  const normalizedSource = normalize(sourceCategory);
  const matched = rows.find((row) => normalize(row.alias) === normalizedSource);
  const name = matched?.categories?.name;
  if (name && MAIN_CATEGORIES.some((category) => category.name === name)) return name as MainCategoryName;
  return resolveMainCategory(sourceCategory);
}

function parseMoney(raw: string) {
  const values = Array.from(raw.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/gi))
    .map((match) => Number(match[1].replace(/\./g, "").replace(",", ".")))
    .filter((value) => Number.isFinite(value));

  return {
    min: values[0] ?? null,
    max: values.length > 1 ? values[1] : null,
  };
}

function extractField(block: string, label: RegExp, nextLabels: string[]) {
  const next = nextLabels.length ? `(?=\\n\\s*(?:${nextLabels.join("|")}):|$)` : "$";
  const expression = new RegExp(`${label.source}\\s*([\\s\\S]*?)${next}`, "i");
  return block.match(expression)?.[1]?.trim() ?? "";
}

function validateItem(item: Omit<ParsedItem, "errors">) {
  const errors: string[] = [];
  if (!item.name) errors.push("Nome não identificado");
  if (item.name.length > 180) errors.push("Nome com mais de 180 caracteres");
  if (!item.sourceCategoryName) errors.push("Categoria não identificada");
  if (!item.categoryName) errors.push("Categoria sem grupo principal. Escolha uma das categorias disponíveis.");
  if (item.sourceCategoryName.length > 80) errors.push("Categoria informada com mais de 80 caracteres");
  if (!item.description) errors.push("Descrição não identificada");
  if (item.description.length > 1200) errors.push("Descrição com mais de 1.200 caracteres");
  if (!item.priceText) errors.push("Valor não identificado");
  if (item.priceMin === null) errors.push("Preço não reconhecido");
  try {
    if (!isAllowedAffiliateUrl(item.affiliateUrl)) errors.push("Use um link oficial da Shopee começando com https://");
  } catch {
    errors.push("Link inválido ou ausente");
  }
  return errors;
}

function parseProducts(text: string, resolver: (source: string) => MainCategoryName | null = resolveMainCategory): ParsedItem[] {
  const normalizedText = text.replace(/\r\n/g, "\n").trim();
  if (!normalizedText) return [];

  const pattern = /(?:^|\n)\s*(\d+)\.\s+([^\n]+)\n([\s\S]*?)(?=(?:\n\s*\d+\.\s+[^\n]+\n)|$)/g;
  const matches = Array.from(normalizedText.matchAll(pattern));

  return matches.map((match, index) => {
    const sourceNumber = Number(match[1]) || index + 1;
    const name = match[2].trim();
    const body = match[3].trim();
    const sourceCategoryName = extractField(body, /Categoria:/, ["Descrição", "Descricao", "Valor", "Preço", "Preco", "Link"]);
    const categoryName = resolver(sourceCategoryName) ?? "";
    const description = extractField(body, /Descri(?:ç|c)ão:/, ["Valor", "Preço", "Preco", "Link"]);
    const priceText = extractField(body, /(?:Valor|Preço|Preco):/, ["Link"]);
    const affiliateUrl = extractField(body, /Link:/, [] ).split(/\s+/)[0] ?? "";
    const prices = parseMoney(priceText);
    const base = {
      tempId: `import-${Date.now()}-${index}`,
      sourceNumber,
      name,
      sourceCategoryName,
      categoryName,
      description,
      priceText,
      priceMin: prices.min,
      priceMax: prices.max,
      affiliateUrl,
      productCode: "",
      enabled: true,
      duplicateId: null,
      duplicateName: null,
      duplicateAction: "skip" as DuplicateAction,
    };
    return { ...base, errors: validateItem(base) };
  });
}

function nextCodeStart(products: ExistingProduct[]) {
  return products.reduce((highest, product) => {
    const match = product.product_code?.match(/^A(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

function makeUniqueSlug(name: string, code: string, used: Set<string>) {
  const base = slugify(name) || `produto-${code.toLowerCase()}`;
  let candidate = base;
  let count = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${code.toLowerCase() || count}`;
    if (used.has(candidate)) candidate = `${base}-${count++}`;
  }
  used.add(candidate);
  return candidate;
}

export default function BulkImportAdmin() {
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [step, setStep] = useState<"paste" | "review" | "done">("paste");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ImportMode>("draft");
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [existingCategories, setExistingCategories] = useState<ExistingCategory[]>([]);
  const [categoryAliases, setCategoryAliases] = useState<CategoryAliasRow[]>([]);

  const selected = useMemo(() => items.filter((item) => item.enabled), [items]);
  const ready = useMemo(() => selected.filter((item) => item.errors.length === 0), [selected]);
  const missingCategories = useMemo(() => {
    const existing = new Set(existingCategories.map((category) => normalize(category.name)));
    return Array.from(new Set(ready.map((item) => item.categoryName.trim()).filter((name) => !existing.has(normalize(name)))));
  }, [ready, existingCategories]);
  const duplicateCount = useMemo(() => ready.filter((item) => item.duplicateId).length, [ready]);

  function updateItem(tempId: string, patch: Partial<ParsedItem>) {
    setItems((current) => current.map((item) => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, ...patch };
      if (patch.priceText !== undefined) {
        const prices = parseMoney(patch.priceText);
        updated.priceMin = prices.min;
        updated.priceMax = prices.max;
      }
      return { ...updated, errors: validateItem(updated) };
    }));
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setMessage("");
    setSummary(null);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("Supabase não configurado.");

      const [{ data: products, error: productsError }, { data: categories, error: categoriesError }, { data: aliases, error: aliasesError }] = await Promise.all([
        supabase.from("products").select("id,name,slug,affiliate_url,product_code").limit(5000),
        supabase.from("categories").select("id,name,slug,sort_order").order("sort_order").limit(1000),
        supabase.from("category_aliases").select("alias,categories(name)").limit(2000),
      ]);
      if (productsError) throw productsError;
      if (categoriesError) throw categoriesError;
      if (aliasesError) throw aliasesError;

      const aliasRows = (aliases ?? []) as unknown as CategoryAliasRow[];
      const parsed = parseProducts(rawText, (source) => resolveCategoryWithRows(source, aliasRows));
      if (!parsed.length) throw new Error("Não encontrei produtos nesse formato. Confira a numeração e os campos Categoria, Descrição, Valor e Link.");
      const currentProducts = (products ?? []) as ExistingProduct[];
      const currentCategories = (categories ?? []) as ExistingCategory[];
      const byLink = new Map(currentProducts.map((product) => [product.affiliate_url.trim(), product]));
      const codeStart = nextCodeStart(currentProducts);
      const usedCodes = new Set(currentProducts.map((product) => product.product_code?.toUpperCase()).filter(Boolean));

      const linkCounts = parsed.reduce((counts, item) => {
        const link = item.affiliateUrl.trim();
        if (link) counts.set(link, (counts.get(link) || 0) + 1);
        return counts;
      }, new Map<string, number>());

      const enriched = parsed.map((item, index) => {
        let codeNumber = codeStart + index;
        let code = `A${String(codeNumber).padStart(3, "0")}`;
        while (usedCodes.has(code)) {
          codeNumber += 1;
          code = `A${String(codeNumber).padStart(3, "0")}`;
        }
        usedCodes.add(code);
        const duplicate = byLink.get(item.affiliateUrl.trim());
        const repeatedInBatch = (linkCounts.get(item.affiliateUrl.trim()) || 0) > 1;
        return {
          ...item,
          errors: repeatedInBatch ? [...item.errors, "Link repetido na própria lista"] : item.errors,
          productCode: duplicate?.product_code || code,
          duplicateId: duplicate?.id || null,
          duplicateName: duplicate?.name || null,
          duplicateAction: duplicate ? "skip" as const : "skip" as const,
        };
      });

      setExistingProducts(currentProducts);
      setExistingCategories(currentCategories);
      setCategoryAliases(aliasRows);
      setItems(enriched);
      setStep("review");
      setMessage(`${enriched.length} produto(s) identificado(s). Confira antes de importar.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível analisar o texto.");
    } finally {
      setLoading(false);
    }
  }

  async function ensureCategory(name: string, categoryMap: Map<string, ExistingCategory>) {
    const normalized = normalize(name);
    const existing = categoryMap.get(normalized);
    if (existing) return existing;

    const definition = MAIN_CATEGORIES.find((category) => category.name === name);
    if (!definition) throw new Error(`A categoria principal “${name}” não é válida.`);

    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data, error: insertError } = await supabase.from("categories").insert({
      name: definition.name,
      slug: definition.slug,
      icon: definition.icon,
      description: definition.description,
      accent_color: definition.accentColor,
      sort_order: MAIN_CATEGORIES.findIndex((category) => category.name === definition.name) + 1,
      is_active: true,
    }).select("id,name,slug,sort_order").single();
    if (insertError) throw insertError;
    const created = data as ExistingCategory;
    categoryMap.set(normalized, created);
    return created;
  }

  async function runImport() {
    if (!ready.length) {
      setError("Nenhum produto válido está selecionado para importar.");
      return;
    }
    setImporting(true);
    setError("");
    setMessage("");
    const result: ImportSummary = { inserted: 0, updated: 0, skipped: 0, failed: 0, categoriesCreated: 0, failures: [] };
    setProgress({ current: 0, total: ready.length, label: "Preparando categorias" });

    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("Supabase não configurado.");
      const categoryMap = new Map(existingCategories.map((category) => [normalize(category.name), category]));
      const initialCategoryCount = categoryMap.size;
      const usedSlugs = new Set(existingProducts.map((product) => product.slug));

      for (let index = 0; index < ready.length; index += 1) {
        const item = ready[index];
        setProgress({ current: index + 1, total: ready.length, label: item.name });
        try {
          if (item.duplicateId && item.duplicateAction === "skip") {
            result.skipped += 1;
            continue;
          }

          const category = await ensureCategory(item.categoryName, categoryMap);
          const existing = item.duplicateId ? existingProducts.find((product) => product.id === item.duplicateId) : null;
          const slug = existing?.slug || makeUniqueSlug(item.name, item.productCode, usedSlugs);
          const hasRange = item.priceMax !== null || /^a\s+partir/i.test(item.priceText.trim());
          const payload = {
            category_id: category.id,
            name: item.name.trim(),
            slug,
            product_code: item.productCode.trim() || null,
            affiliate_url: item.affiliateUrl.trim(),
            image_url: null,
            current_price: item.priceMin,
            old_price: null,
            short_description: item.description.trim(),
            tags: Array.from(new Set([item.categoryName.trim(), item.sourceCategoryName.trim()].filter(Boolean))),
            badge: hasRange ? item.priceText.trim().slice(0, 40) : null,
            is_featured: false,
            is_video_product: false,
            is_pinned: false,
            sort_order: index + 1,
            import_source: "bulk-text",
            is_active: mode === "published",
          };

          if (item.duplicateId && item.duplicateAction === "update") {
            const { error: updateError } = await supabase.from("products").update(payload).eq("id", item.duplicateId);
            if (updateError) throw updateError;
            result.updated += 1;
          } else {
            const { error: insertError } = await supabase.from("products").insert(payload);
            if (insertError) throw insertError;
            result.inserted += 1;
          }
        } catch (caught) {
          result.failed += 1;
          result.failures.push(`${item.sourceNumber}. ${item.name}: ${caught instanceof Error ? caught.message : "erro desconhecido"}`);
        }
      }

      result.categoriesCreated = Math.max(0, categoryMap.size - initialCategoryCount);
      setSummary(result);
      setStep("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a importação.");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setRawText("");
    setItems([]);
    setSummary(null);
    setMessage("");
    setError("");
    setStep("paste");
    setProgress({ current: 0, total: 0, label: "" });
  }

  return <>
    <div className="admin-page-heading-ui bulk-import-heading">
      <div><span>CATÁLOGO</span><h1>Importar em massa</h1><p>Cole uma lista pronta e transforme cada bloco em um produto. As imagens podem ser adicionadas depois.</p></div>
      <Link className="admin-button-ui secondary" href="/admin/produtos"><Icon name="products"/>Ver produtos</Link>
    </div>

    {error ? <div className="admin-alert-ui error">{error}</div> : null}
    {message ? <div className="admin-alert-ui success">{message}</div> : null}

    <div className="bulk-import-steps" aria-label="Etapas da importação">
      <span className={step === "paste" ? "active" : "done"}><b>1</b>Colar lista</span>
      <i />
      <span className={step === "review" ? "active" : step === "done" ? "done" : ""}><b>2</b>Revisar</span>
      <i />
      <span className={step === "done" ? "active" : ""}><b>3</b>Concluir</span>
    </div>

    {step === "paste" ? <section className="admin-card-ui bulk-paste-card">
      <div className="bulk-card-title"><div><small>ENTRADA</small><h2>Cole os produtos</h2><p>O importador reconhece os campos e agrupa cada item automaticamente em uma das 7 categorias principais.</p></div><button type="button" className="text-button" onClick={() => setRawText(EXAMPLE)}>Usar exemplo</button></div>
      <textarea
        className="bulk-import-textarea"
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder={EXAMPLE}
        spellCheck={false}
      />
      <div className="bulk-paste-footer"><span><Icon name="shield" size={18}/>Nada é salvo antes da revisão.</span><button className="admin-button-ui" onClick={() => void analyze()} disabled={loading || !rawText.trim()}><Icon name="sparkles"/>{loading ? "Analisando..." : "Analisar produtos"}</button></div>
    </section> : null}

    {step === "review" ? <>
      <section className="bulk-import-summary-grid">
        <article><span>Identificados</span><strong>{items.length}</strong></article>
        <article><span>Selecionados</span><strong>{selected.length}</strong></article>
        <article><span>Prontos</span><strong>{ready.length}</strong></article>
        <article><span>Duplicados</span><strong>{duplicateCount}</strong></article>
        <article><span>Categorias novas</span><strong>{missingCategories.length}</strong></article>
      </section>

      <section className="admin-card-ui bulk-options-card">
        <div><small>COMO IMPORTAR</small><h2>Configurações</h2></div>
        <div className="bulk-option bulk-option-static"><Icon name="categories"/><span><strong>Agrupamento automático ativo</strong><small>A categoria informada será guardada como referência, mas o produto entrará em uma das 7 categorias principais.</small></span></div>
        <div className="bulk-mode-picker"><span><strong>Status dos novos produtos</strong><small>Como ainda não têm imagem, recomendamos rascunho.</small></span><div><button className={mode === "draft" ? "active" : ""} onClick={() => setMode("draft")}>Rascunho</button><button className={mode === "published" ? "active" : ""} onClick={() => setMode("published")}>Publicado</button></div></div>
        {missingCategories.length ? <div className="bulk-new-categories"><span>Categorias principais que faltam e serão criadas:</span>{missingCategories.map((category) => <b key={category}>{category}</b>)}</div> : null}
      </section>

      <section className="bulk-review-list">
        <div className="bulk-list-toolbar"><div><small>REVISÃO</small><h2>Confira os produtos</h2></div><div><button onClick={() => setItems((current) => current.map((item) => ({ ...item, enabled: true })))}>Selecionar todos</button><button onClick={() => setItems((current) => current.map((item) => ({ ...item, enabled: false })))}>Limpar seleção</button></div></div>
        {items.map((item) => <article className={`bulk-review-item ${!item.enabled ? "disabled" : ""} ${item.errors.length ? "has-error" : ""}`} key={item.tempId}>
          <header><label><input type="checkbox" checked={item.enabled} onChange={(event) => updateItem(item.tempId, { enabled: event.target.checked })}/><span>{item.sourceNumber}</span></label><div><strong>{item.name || "Produto sem nome"}</strong><small>{item.productCode}</small></div><span className={item.errors.length ? "error" : item.duplicateId ? "warning" : "ready"}>{item.errors.length ? `${item.errors.length} erro(s)` : item.duplicateId ? "Já existe" : "Pronto"}</span></header>
          <div className="bulk-review-fields">
            <label className="full"><span>Nome</span><input value={item.name} onChange={(event) => updateItem(item.tempId, { name: event.target.value })}/></label>
            <label><span>Categoria informada</span><input value={item.sourceCategoryName} onChange={(event) => {
              const sourceCategoryName = event.target.value;
              updateItem(item.tempId, { sourceCategoryName, categoryName: resolveCategoryWithRows(sourceCategoryName, categoryAliases) ?? item.categoryName });
            }}/></label>
            <label><span>Categoria principal</span><select value={item.categoryName} onChange={(event) => updateItem(item.tempId, { categoryName: event.target.value })}>{MAIN_CATEGORIES.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}</select></label>
            <label><span>Código</span><input value={item.productCode} onChange={(event) => updateItem(item.tempId, { productCode: event.target.value.toUpperCase() })}/></label>
            <label className="full"><span>Descrição</span><textarea rows={3} value={item.description} onChange={(event) => updateItem(item.tempId, { description: event.target.value })}/></label>
            <label><span>Valor</span><input value={item.priceText} onChange={(event) => updateItem(item.tempId, { priceText: event.target.value })}/><small>{item.priceMin !== null ? `Preço principal: R$ ${item.priceMin.toFixed(2).replace(".", ",")}` : "Preço não reconhecido"}</small></label>
            <label><span>Link</span><input value={item.affiliateUrl} onChange={(event) => updateItem(item.tempId, { affiliateUrl: event.target.value })}/></label>
          </div>
          {item.duplicateId ? <div className="bulk-duplicate-box"><Icon name="copy"/><span><strong>O link já está cadastrado em “{item.duplicateName}”.</strong><small>Escolha o que fazer com esse item.</small></span><select value={item.duplicateAction} onChange={(event) => updateItem(item.tempId, { duplicateAction: event.target.value as DuplicateAction })}><option value="skip">Ignorar</option><option value="update">Atualizar existente</option></select></div> : null}
          {item.errors.length ? <ul className="bulk-item-errors">{item.errors.map((itemError) => <li key={itemError}>{itemError}</li>)}</ul> : null}
        </article>)}
      </section>

      <div className="bulk-import-actions"><button className="admin-button-ui secondary" onClick={() => setStep("paste")}>Voltar e editar texto</button><div><span>{ready.length} produto(s) pronto(s)</span><button className="admin-button-ui" disabled={importing || !ready.length} onClick={() => void runImport()}><Icon name="save"/>{importing ? `Importando ${progress.current}/${progress.total}` : "Importar produtos"}</button></div></div>
      {importing ? <div className="bulk-progress"><div style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}/><span>{progress.label}</span></div> : null}
    </> : null}

    {step === "done" && summary ? <section className="admin-card-ui bulk-done-card">
      <span className="bulk-done-icon"><Icon name="check" size={34}/></span>
      <small>IMPORTAÇÃO CONCLUÍDA</small><h1>Produtos processados</h1><p>Agora você pode adicionar as imagens e publicar os itens que ficaram como rascunho.</p>
      <div className="bulk-done-grid"><article><strong>{summary.inserted}</strong><span>Adicionados</span></article><article><strong>{summary.updated}</strong><span>Atualizados</span></article><article><strong>{summary.skipped}</strong><span>Ignorados</span></article><article><strong>{summary.categoriesCreated}</strong><span>Categorias criadas</span></article><article><strong>{summary.failed}</strong><span>Com erro</span></article></div>
      {summary.failures.length ? <div className="bulk-failure-list"><strong>Itens que precisam de atenção</strong>{summary.failures.map((failure) => <p key={failure}>{failure}</p>)}</div> : null}
      <div className="bulk-done-actions"><Link className="admin-button-ui" href="/admin/produtos"><Icon name="image"/>Adicionar imagens</Link><button className="admin-button-ui secondary" onClick={reset}><Icon name="plus"/>Nova importação</button></div>
    </section> : null}
  </>;
}

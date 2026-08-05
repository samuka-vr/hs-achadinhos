"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { AdminActivity, SiteSettings, SiteSnapshot } from "@/lib/types";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/utils";
import Icon from "./Icon";

type ProductAudit = {
  id: string;
  name: string;
  image_url: string | null;
  affiliate_url: string;
  product_code: string | null;
  is_active: boolean;
  category_id: string | null;
};

type Tab = "site" | "catalog" | "backup" | "notes";
type ConfirmAction = "reset" | "delete-no-image" | "draft-all" | null;

type BackupPayload = {
  version: string;
  exported_at: string;
  products: unknown[];
  categories: unknown[];
  settings: unknown[];
  sections: unknown[];
  banners: unknown[];
  navigation: unknown[];
  pages: unknown[];
  aliases: unknown[];
};

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ControlCenterAdmin() {
  const [tab, setTab] = useState<Tab>("site");
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<ProductAudit[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [aliasCount, setAliasCount] = useState(0);
  const [snapshots, setSnapshots] = useState<SiteSnapshot[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmation, setConfirmation] = useState("");
  const [snapshotName, setSnapshotName] = useState("");

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const [s, p, c, a, sn, log] = await Promise.all([
      supabase.from("site_settings").select("key,value"),
      supabase.from("products").select("id,name,image_url,affiliate_url,product_code,is_active,category_id").order("created_at", { ascending: false }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("category_aliases").select("id", { count: "exact", head: true }),
      supabase.from("site_snapshots").select("*").order("created_at", { ascending: false }).limit(12),
      supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
    ]);
    if (s.error || p.error) setError(s.error?.message || p.error?.message || "Não foi possível carregar a central.");
    setSettings(parseSettings(s.data));
    setProducts((p.data ?? []) as ProductAudit[]);
    setCategoryCount(c.count ?? 0);
    setAliasCount(a.count ?? 0);
    setSnapshots((sn.data ?? []) as SiteSnapshot[]);
    setActivity((log.data ?? []) as AdminActivity[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const health = useMemo(() => ({
    total: products.length,
    published: products.filter((item) => item.is_active).length,
    drafts: products.filter((item) => !item.is_active).length,
    noImage: products.filter((item) => !item.image_url).length,
    noCode: products.filter((item) => !item.product_code).length,
    noCategory: products.filter((item) => !item.category_id).length,
    readyDrafts: products.filter((item) => !item.is_active && item.image_url && item.affiliate_url).length,
  }), [products]);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveQuickSettings(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const keys: Array<keyof SiteSettings> = [
      "maintenance_mode", "maintenance_title", "maintenance_message",
      "announcement_enabled", "announcement_text", "announcement_url",
      "instagram", "tiktok", "shopee_showcase", "whatsapp",
      "footer_social_title", "footer_social_subtitle",
      "catalog_empty_title", "catalog_empty_message", "admin_notes",
    ];
    const { error: saveError } = await supabase.from("site_settings").upsert(keys.map((key) => ({ key, value: settings[key] })), { onConflict: "key" });
    if (saveError) setError(saveError.message); else setMessage("Controles rápidos publicados.");
    setSaving(false);
  }

  async function runRpc(name: string, successText: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(name); setError(""); setMessage("");
    const { data, error: rpcError } = await supabase.rpc(name);
    if (rpcError) setError(rpcError.message);
    else setMessage(`${successText}${data && typeof data === "object" ? "" : ""}`);
    setBusy(""); setConfirmAction(null); setConfirmation("");
    await load();
  }

  async function makeBackup(): Promise<BackupPayload> {
    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("Supabase não configurado.");
    const [productsResult, categoriesResult, settingsResult, sectionsResult, bannersResult, navigationResult, pagesResult, aliasesResult] = await Promise.all([
      supabase.from("products").select("*,product_images(*)").order("created_at"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("site_settings").select("*").order("key"),
      supabase.from("home_sections").select("*").order("sort_order"),
      supabase.from("banners").select("*").order("sort_order"),
      supabase.from("navigation_items").select("*").order("location").order("sort_order"),
      supabase.from("content_pages").select("*").order("sort_order"),
      supabase.from("category_aliases").select("*").order("alias"),
    ]);
    const failure = [productsResult, categoriesResult, settingsResult, sectionsResult, bannersResult, navigationResult, pagesResult, aliasesResult].find((result) => result.error);
    if (failure?.error) throw failure.error;
    return {
      version: "8.0.0",
      exported_at: new Date().toISOString(),
      products: productsResult.data ?? [],
      categories: categoriesResult.data ?? [],
      settings: settingsResult.data ?? [],
      sections: sectionsResult.data ?? [],
      banners: bannersResult.data ?? [],
      navigation: navigationResult.data ?? [],
      pages: pagesResult.data ?? [],
      aliases: aliasesResult.data ?? [],
    };
  }

  async function exportBackup() {
    setBusy("export"); setError("");
    try {
      const backup = await makeBackup();
      downloadFile(`hs-achadinhos-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), "application/json");
      setMessage("Backup JSON baixado.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao criar backup."); }
    setBusy("");
  }

  async function exportCsv() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    setBusy("csv"); setError("");
    const { data, error: loadError } = await supabase.from("products").select("product_code,name,current_price,old_price,affiliate_url,image_url,is_active,categories(name)").order("created_at");
    if (loadError) setError(loadError.message);
    else {
      const header = ["codigo", "nome", "categoria", "preco", "preco_anterior", "link", "imagem", "publicado"];
      const rows = (data ?? []).map((item: any) => [item.product_code, item.name, item.categories?.name, item.current_price, item.old_price, item.affiliate_url, item.image_url, item.is_active ? "sim" : "nao"]);
      downloadFile(`hs-achadinhos-produtos-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n"), "text/csv;charset=utf-8");
      setMessage("Planilha CSV baixada.");
    }
    setBusy("");
  }

  async function saveSnapshot() {
    setBusy("snapshot"); setError(""); setMessage("");
    try {
      const supabase = getBrowserSupabase(); if (!supabase) return;
      const backup = await makeBackup();
      const { data: userData } = await supabase.auth.getUser();
      const name = snapshotName.trim() || `Cópia de ${new Date().toLocaleString("pt-BR")}`;
      const { error: insertError } = await supabase.from("site_snapshots").insert({ name, snapshot: backup, created_by: userData.user?.id ?? null });
      if (insertError) throw insertError;
      setSnapshotName(""); setMessage("Cópia de segurança salva no painel."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao salvar cópia."); }
    setBusy("");
  }

  async function downloadSnapshot(snapshot: SiteSnapshot) {
    downloadFile(`${snapshot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`, JSON.stringify(snapshot.snapshot, null, 2), "application/json");
  }

  async function deleteSnapshot(snapshot: SiteSnapshot) {
    if (!confirm(`Excluir a cópia “${snapshot.name}”?`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: deleteError } = await supabase.from("site_snapshots").delete().eq("id", snapshot.id);
    if (deleteError) setError(deleteError.message); else { setMessage("Cópia excluída."); await load(); }
  }

  if (loading) return <div className="studio-inline-loading"><span /><strong>Abrindo a central de controle...</strong></div>;

  const tabs: Array<[Tab, string, string]> = [
    ["site", "Site", "Publicação e redes"],
    ["catalog", "Catálogo", "Saúde e operações"],
    ["backup", "Backup", "Exportação e cópias"],
    ["notes", "Notas", "Lembretes internos"],
  ];

  return <>
    <div className="admin-page-heading-v5 control-heading-v8">
      <div><span>CENTRAL DE CONTROLE</span><h1>Edite e administre tudo pelo site</h1><p>Ferramentas operacionais, publicação, categorias, redes e segurança em um único lugar.</p></div>
      <div><Link className="admin-button-v5 secondary" href="/" target="_blank"><Icon name="eye" />Ver site</Link><Link className="admin-button-v5" href="/admin/produtos/importar"><Icon name="plus" />Importar produtos</Link></div>
    </div>

    {error ? <div className="admin-alert-v5 error">{error}</div> : null}
    {message ? <div className="admin-alert-v5 success">{message}</div> : null}

    <section className="control-summary-v8">
      <article><span><Icon name="products" /></span><div><small>Produtos</small><strong>{health.total}</strong><em>{health.published} publicados</em></div></article>
      <article><span><Icon name="image" /></span><div><small>Sem imagem</small><strong>{health.noImage}</strong><em>precisam de revisão</em></div></article>
      <article><span><Icon name="categories" /></span><div><small>Categorias</small><strong>{categoryCount}</strong><em>{aliasCount} nomes alternativos</em></div></article>
      <article><span><Icon name="shield" /></span><div><small>Status</small><strong>{settings.maintenance_mode ? "Pausado" : "Online"}</strong><em>{settings.maintenance_mode ? "manutenção ativa" : "site público"}</em></div></article>
    </section>

    <nav className="control-tabs-v8">{tabs.map(([key, label, description]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><strong>{label}</strong><small>{description}</small></button>)}</nav>

    {tab === "site" ? <form onSubmit={saveQuickSettings} className="control-grid-v8">
      <section className="admin-card-v5 control-panel-v8">
        <div className="admin-card-head-v5"><div><small>PUBLICAÇÃO</small><h2>Status do site</h2><p>Pause o site público sem bloquear o painel.</p></div><label className="switch-v5"><input type="checkbox" checked={settings.maintenance_mode} onChange={(event) => update("maintenance_mode", event.target.checked)} /><span /><b>{settings.maintenance_mode ? "Manutenção" : "Online"}</b></label></div>
        <div className="admin-form-grid-v5"><label className="full"><span>Título da manutenção</span><input value={settings.maintenance_title} onChange={(event) => update("maintenance_title", event.target.value)} /></label><label className="full"><span>Mensagem</span><textarea rows={3} value={settings.maintenance_message} onChange={(event) => update("maintenance_message", event.target.value)} /></label></div>
      </section>

      <section className="admin-card-v5 control-panel-v8">
        <div className="admin-card-head-v5"><div><small>AVISO</small><h2>Faixa do topo</h2><p>Mensagem rápida para lançamentos e campanhas.</p></div><label className="switch-v5"><input type="checkbox" checked={settings.announcement_enabled} onChange={(event) => update("announcement_enabled", event.target.checked)} /><span /><b>{settings.announcement_enabled ? "Visível" : "Oculta"}</b></label></div>
        <div className="admin-form-grid-v5"><label className="full"><span>Texto</span><input value={settings.announcement_text} onChange={(event) => update("announcement_text", event.target.value)} /></label><label className="full"><span>Destino</span><input value={settings.announcement_url} onChange={(event) => update("announcement_url", event.target.value)} placeholder="#produtos" /></label></div>
      </section>

      <section className="admin-card-v5 control-panel-v8 control-wide-v8">
        <div className="admin-card-head-v5"><div><small>FOOTER</small><h2>Redes sociais</h2><p>Somente os campos preenchidos aparecem no rodapé.</p></div><Link href="/admin/navegacao">Editor completo <Icon name="arrow" size={15} /></Link></div>
        <div className="admin-form-grid-v5"><label><span>Instagram</span><input type="url" value={settings.instagram} onChange={(event) => update("instagram", event.target.value)} placeholder="https://instagram.com/..." /></label><label><span>TikTok</span><input type="url" value={settings.tiktok} onChange={(event) => update("tiktok", event.target.value)} placeholder="https://tiktok.com/@..." /></label><label><span>Vitrine Shopee</span><input type="url" value={settings.shopee_showcase} onChange={(event) => update("shopee_showcase", event.target.value)} placeholder="https://shopee.com.br/..." /></label><label><span>WhatsApp</span><input type="url" value={settings.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="https://wa.me/..." /></label><label><span>Título do footer</span><input value={settings.footer_social_title} onChange={(event) => update("footer_social_title", event.target.value)} /></label><label><span>Texto curto</span><input value={settings.footer_social_subtitle} onChange={(event) => update("footer_social_subtitle", event.target.value)} /></label></div>
      </section>

      <section className="admin-card-v5 control-panel-v8 control-wide-v8">
        <div className="admin-card-head-v5"><div><small>ESTADOS VAZIOS</small><h2>Mensagens do catálogo</h2><p>Textos exibidos quando nenhuma busca ou filtro encontra produtos.</p></div></div>
        <div className="admin-form-grid-v5"><label><span>Título</span><input value={settings.catalog_empty_title} onChange={(event) => update("catalog_empty_title", event.target.value)} /></label><label><span>Descrição</span><input value={settings.catalog_empty_message} onChange={(event) => update("catalog_empty_message", event.target.value)} /></label></div>
      </section>

      <div className="control-save-v8"><button className="admin-button-v5" disabled={saving}><Icon name="save" />{saving ? "Publicando..." : "Salvar controles"}</button></div>
    </form> : null}

    {tab === "catalog" ? <div className="control-catalog-v8">
      <section className="admin-card-v5 catalog-health-v8">
        <div className="admin-card-head-v5"><div><small>DIAGNÓSTICO</small><h2>Saúde do catálogo</h2><p>Problemas que podem impedir produtos de aparecerem corretamente.</p></div><Link href="/admin/produtos">Abrir produtos <Icon name="arrow" size={15} /></Link></div>
        <div className="health-grid-v8">
          <article className={health.noImage ? "warning" : "good"}><Icon name="image" /><strong>{health.noImage}</strong><span>Sem imagem</span></article>
          <article className={health.noCode ? "warning" : "good"}><Icon name="code" /><strong>{health.noCode}</strong><span>Sem código</span></article>
          <article className={health.noCategory ? "danger" : "good"}><Icon name="categories" /><strong>{health.noCategory}</strong><span>Sem categoria</span></article>
          <article className="good"><Icon name="check" /><strong>{health.readyDrafts}</strong><span>Prontos para publicar</span></article>
        </div>
      </section>

      <section className="operation-grid-v8">
        <article className="admin-card-v5"><span className="operation-icon-v8"><Icon name="categories" /></span><h3>Restaurar categorias oficiais</h3><p>Cria ou corrige as sete categorias principais sem apagar produtos.</p><button className="admin-button-v5 secondary" disabled={Boolean(busy)} onClick={() => void runRpc("admin_restore_main_categories", "Categorias oficiais restauradas.")}><Icon name="categories" />Restaurar</button></article>
        <article className="admin-card-v5"><span className="operation-icon-v8"><Icon name="check" /></span><h3>Publicar produtos prontos</h3><p>Publica todos os rascunhos que já possuem imagem e link.</p><button className="admin-button-v5 secondary" disabled={Boolean(busy) || !health.readyDrafts} onClick={() => void runRpc("admin_publish_ready_drafts", "Produtos prontos publicados.")}><Icon name="check" />Publicar {health.readyDrafts}</button></article>
        <article className="admin-card-v5"><span className="operation-icon-v8"><Icon name="products" /></span><h3>Mover tudo para rascunho</h3><p>Oculta todos os produtos do site sem excluí-los.</p><button className="admin-button-v5 secondary" disabled={Boolean(busy) || !health.published} onClick={() => { setConfirmAction("draft-all"); setConfirmation(""); }}><Icon name="eye" />Ocultar catálogo</button></article>
        <article className="admin-card-v5 danger-zone-v8"><span className="operation-icon-v8"><Icon name="trash" /></span><h3>Excluir produtos sem imagem</h3><p>Remove permanentemente todos os cadastros que ainda não possuem capa.</p><button className="admin-button-v5 danger" disabled={Boolean(busy) || !health.noImage} onClick={() => { setConfirmAction("delete-no-image"); setConfirmation(""); }}><Icon name="trash" />Excluir {health.noImage}</button></article>
      </section>

      <section className="admin-card-v5 reset-catalog-v8"><div><small>ZONA DE REDEFINIÇÃO</small><h2>Começar o catálogo novamente</h2><p>Apaga todos os produtos e categorias atuais e recria somente as sete categorias oficiais. Configurações, páginas, redes e aparência permanecem.</p></div><button className="admin-button-v5 danger" onClick={() => { setConfirmAction("reset"); setConfirmation(""); }}><Icon name="trash" />Redefinir catálogo</button></section>
    </div> : null}

    {tab === "backup" ? <div className="control-backup-v8">
      <section className="operation-grid-v8 backup-actions-v8">
        <article className="admin-card-v5"><span className="operation-icon-v8"><Icon name="code" /></span><h3>Backup completo em JSON</h3><p>Produtos, categorias, configurações, páginas, banners e menus.</p><button className="admin-button-v5" disabled={Boolean(busy)} onClick={() => void exportBackup()}><Icon name="external" />{busy === "export" ? "Preparando..." : "Baixar JSON"}</button></article>
        <article className="admin-card-v5"><span className="operation-icon-v8"><Icon name="products" /></span><h3>Planilha de produtos</h3><p>Baixe o catálogo em CSV para abrir no Excel ou Google Planilhas.</p><button className="admin-button-v5 secondary" disabled={Boolean(busy)} onClick={() => void exportCsv()}><Icon name="external" />{busy === "csv" ? "Preparando..." : "Baixar CSV"}</button></article>
      </section>
      <section className="admin-card-v5 snapshot-create-v8"><div><small>CÓPIA NO PAINEL</small><h2>Salvar ponto de segurança</h2><p>Guarda uma cópia dos dados atuais dentro do Supabase para consulta e download posterior.</p></div><div><input value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} placeholder="Ex.: Antes de alterar a página inicial" /><button className="admin-button-v5" disabled={Boolean(busy)} onClick={() => void saveSnapshot()}><Icon name="save" />{busy === "snapshot" ? "Salvando..." : "Salvar cópia"}</button></div></section>
      <section className="admin-card-v5 snapshot-list-v8"><div className="admin-card-head-v5"><div><small>HISTÓRICO</small><h2>Cópias salvas</h2></div><span className="studio-count-badge">{snapshots.length}</span></div>{snapshots.map((snapshot) => <article key={snapshot.id}><div><strong>{snapshot.name}</strong><small>{new Date(snapshot.created_at).toLocaleString("pt-BR")}</small></div><button onClick={() => void downloadSnapshot(snapshot)}><Icon name="external" size={17} />Baixar</button><button className="danger" onClick={() => void deleteSnapshot(snapshot)}><Icon name="trash" size={17} /></button></article>)}{!snapshots.length ? <div className="studio-empty-mini">Nenhuma cópia salva ainda.</div> : null}</section>
    </div> : null}

    {tab === "notes" ? <div className="control-notes-v8">
      <section className="admin-card-v5"><div className="admin-card-head-v5"><div><small>LEMBRETES</small><h2>Anotações internas</h2><p>Este texto aparece somente para administradores.</p></div></div><textarea rows={12} value={settings.admin_notes} onChange={(event) => update("admin_notes", event.target.value)} placeholder="Ex.: atualizar os preços na sexta-feira..." /><button className="admin-button-v5" disabled={saving} onClick={() => void saveQuickSettings()}><Icon name="save" />Salvar notas</button></section>
      <section className="admin-card-v5 activity-preview-v8"><div className="admin-card-head-v5"><div><small>ATIVIDADE RECENTE</small><h2>Últimas alterações</h2></div><Link href="/admin/atividade">Ver histórico</Link></div>{activity.map((item) => <article key={item.id}><span><Icon name={item.action === "delete" ? "trash" : item.action === "insert" ? "plus" : "edit"} size={16} /></span><div><strong>{item.summary || item.entity_type}</strong><small>{item.action} · {item.entity_type} · {new Date(item.created_at).toLocaleString("pt-BR")}</small></div></article>)}{!activity.length ? <div className="studio-empty-mini">Nenhuma alteração registrada.</div> : null}</section>
    </div> : null}

    {confirmAction ? <div className="control-modal-backdrop-v8" onMouseDown={() => setConfirmAction(null)}><div className="control-modal-v8" onMouseDown={(event) => event.stopPropagation()}><span className="control-modal-icon-v8"><Icon name={confirmAction === "draft-all" ? "eye" : "trash"} /></span><h2>{confirmAction === "reset" ? "Redefinir todo o catálogo?" : confirmAction === "delete-no-image" ? "Excluir produtos sem imagem?" : "Mover tudo para rascunho?"}</h2><p>{confirmAction === "reset" ? "Todos os produtos e categorias atuais serão apagados. Esta ação não pode ser desfeita sem um backup." : confirmAction === "delete-no-image" ? `${health.noImage} produto(s) serão excluídos permanentemente.` : `${health.published} produto(s) deixarão de aparecer no site.`}</p><label><span>Digite CONFIRMAR</span><input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value.toUpperCase())} /></label><div><button className="admin-button-v5 secondary" onClick={() => setConfirmAction(null)}>Cancelar</button><button className="admin-button-v5 danger" disabled={confirmation !== "CONFIRMAR" || Boolean(busy)} onClick={() => void runRpc(confirmAction === "reset" ? "admin_reset_catalog" : confirmAction === "delete-no-image" ? "admin_delete_products_without_images" : "admin_move_all_to_draft", confirmAction === "reset" ? "Catálogo redefinido." : confirmAction === "delete-no-image" ? "Produtos sem imagem excluídos." : "Produtos movidos para rascunho.")}><Icon name="check" />Confirmar</button></div></div></div> : null}
  </>;
}

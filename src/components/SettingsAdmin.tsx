"use client";

import { FormEvent, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/utils";
import Icon from "./Icon";

type UploadField = "logo_url" | "favicon_url" | "hero_image_url";
type Tab = "brand" | "home" | "sections" | "social" | "style" | "footer";

export default function SettingsAdmin() {
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("brand");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void supabase.from("site_settings").select("key,value").then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message); else setForm(parseSettings(data));
    });
  }, []);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function upload(field: UploadField, file?: File) {
    if (!file) return;
    setUploading(field); setError(""); setMessage("");
    try {
      if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem válida.");
      if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("Supabase não configurado.");
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `branding/${field}-${Date.now()}.${extension}`;
      const result = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type });
      if (result.error) throw result.error;
      update(field, supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl);
      setMessage("Imagem enviada. Salve para publicar.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao enviar imagem.");
    } finally { setUploading(null); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    const rows = Object.entries(form).map(([key, value]) => ({ key, value }));
    const { error: saveError } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (saveError) setError(saveError.message); else setMessage("Configurações salvas.");
    setSaving(false);
  }

  const tabs: Array<{ key: Tab; label: string; icon: Parameters<typeof Icon>[0]["name"] }> = [
    { key: "brand", label: "Marca", icon: "image" },
    { key: "home", label: "Início", icon: "home" },
    { key: "sections", label: "Seções", icon: "categories" },
    { key: "social", label: "Redes", icon: "instagram" },
    { key: "style", label: "Cores", icon: "sparkles" },
    { key: "footer", label: "Rodapé", icon: "products" },
  ];

  return (
    <>
      <div className="admin-page-heading clean-admin-heading"><div><span className="admin-eyebrow">SITE</span><h1>Personalização</h1><p>Altere a aparência e os textos sem mexer no código.</p></div><a className="admin-button secondary" href="/" target="_blank">Ver site <Icon name="external" /></a></div>
      {error ? <div className="error admin-alert">{error}</div> : null}
      {message ? <div className="success admin-alert">{message}</div> : null}

      <form onSubmit={save}>
        <div className="clean-settings-layout">
          <aside className="clean-settings-tabs">{tabs.map((item) => <button type="button" key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</aside>
          <div className="clean-settings-content">
            {tab === "brand" ? <section className="admin-panel clean-settings-panel">
              <div className="admin-panel-head"><div><h2>Marca</h2><p>Logo, ícone e nome exibidos no site.</p></div></div>
              <div className="brand-upload-grid clean-brand-upload-grid">
                <div className="brand-upload-card"><div className="brand-upload-preview logo-preview"><img src={form.logo_url || "/brand/hs-logo.png"} alt="Logo" /></div><strong>Logo principal</strong><label className="admin-upload-button"><Icon name="image" />{uploading === "logo_url" ? "Enviando..." : "Enviar logo"}<input type="file" accept="image/*" onChange={(e) => void upload("logo_url", e.target.files?.[0])} disabled={uploading !== null} /></label></div>
                <div className="brand-upload-card"><div className="brand-upload-preview favicon-preview"><img src={form.favicon_url || form.logo_url} alt="Ícone" /></div><strong>Ícone do navegador</strong><label className="admin-upload-button"><Icon name="image" />{uploading === "favicon_url" ? "Enviando..." : "Enviar ícone"}<input type="file" accept="image/*" onChange={(e) => void upload("favicon_url", e.target.files?.[0])} disabled={uploading !== null} /></label></div>
              </div>
              <div className="admin-form-grid settings-fields"><label className="admin-label full">Nome do site<input className="admin-input" value={form.site_name} onChange={(e) => update("site_name", e.target.value)} required /></label><label className="admin-label full">Texto abaixo do nome<input className="admin-input" value={form.header_tagline} onChange={(e) => update("header_tagline", e.target.value)} placeholder="Achadinhos da Shopee" /></label><label className="admin-label full">URL da logo<input className="admin-input" value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} /></label></div>
            </section> : null}

            {tab === "home" ? <section className="admin-panel clean-settings-panel">
              <div className="admin-panel-head"><div><h2>Topo da página inicial</h2><p>Use frases curtas e do seu jeito.</p></div></div>
              <div className="admin-form-grid settings-fields"><label className="admin-label full">Texto pequeno<input className="admin-input" value={form.hero_eyebrow} onChange={(e) => update("hero_eyebrow", e.target.value)} /></label><label className="admin-label full">Título<input className="admin-input" value={form.hero_title} onChange={(e) => update("hero_title", e.target.value)} required /></label><label className="admin-label full">Descrição<textarea className="admin-input admin-textarea" value={form.hero_subtitle} onChange={(e) => update("hero_subtitle", e.target.value)} /></label><label className="admin-label">Texto do botão<input className="admin-input" value={form.hero_button_text} onChange={(e) => update("hero_button_text", e.target.value)} /></label><label className="admin-label">Produtos por página<input className="admin-input" type="number" min="4" max="100" value={form.products_per_page} onChange={(e) => update("products_per_page", Number(e.target.value))} /></label></div>
              <div className="settings-divider" />
              <label className="admin-toggle-row full"><input type="checkbox" checked={form.announcement_enabled} onChange={(e) => update("announcement_enabled", e.target.checked)} /><span><strong>Mostrar aviso no topo</strong><small>Use só quando tiver algo importante.</small></span></label>
              <div className="admin-form-grid settings-fields"><label className="admin-label">Texto do aviso<input className="admin-input" value={form.announcement_text} onChange={(e) => update("announcement_text", e.target.value)} /></label><label className="admin-label">Link<input className="admin-input" value={form.announcement_url} onChange={(e) => update("announcement_url", e.target.value)} placeholder="#novidades" /></label></div>
            </section> : null}

            {tab === "sections" ? <section className="admin-panel clean-settings-panel">
              <div className="admin-panel-head"><div><h2>Seções da página</h2><p>Escolha o que aparece e o que fica escondido.</p></div></div>
              <div className="clean-section-toggles">
                <label><input type="checkbox" checked={form.coverflow_enabled} onChange={(e) => update("coverflow_enabled", e.target.checked)} /><span><strong>Carrossel de produtos</strong><small>Imagens passando automaticamente.</small></span></label>
                <label><input type="checkbox" checked={form.show_categories} onChange={(e) => update("show_categories", e.target.checked)} /><span><strong>Categorias em bolinhas</strong><small>Formato parecido com destaques do Instagram.</small></span></label>
                <label><input type="checkbox" checked={form.show_trending} onChange={(e) => update("show_trending", e.target.checked)} /><span><strong>Mais vistos</strong><small>Produtos com mais cliques.</small></span></label>
                <label><input type="checkbox" checked={form.show_newest} onChange={(e) => update("show_newest", e.target.checked)} /><span><strong>Adicionados recentemente</strong><small>Últimos produtos cadastrados.</small></span></label>
                <label><input type="checkbox" checked={form.show_catalog} onChange={(e) => update("show_catalog", e.target.checked)} /><span><strong>Catálogo completo</strong><small>Busca, filtros e todos os produtos.</small></span></label>
              </div>
              <div className="admin-form-grid settings-fields"><label className="admin-label">Título do carrossel<input className="admin-input" value={form.coverflow_title} onChange={(e) => update("coverflow_title", e.target.value)} /></label><label className="admin-label">Descrição<input className="admin-input" value={form.coverflow_subtitle} onChange={(e) => update("coverflow_subtitle", e.target.value)} /></label><label className="admin-label">Tempo entre produtos (ms)<input className="admin-input" type="number" min="2500" max="15000" step="500" value={form.carousel_speed} onChange={(e) => update("carousel_speed", Number(e.target.value))} /></label></div>
            </section> : null}

            {tab === "social" ? <section className="admin-panel clean-settings-panel"><div className="admin-panel-head"><div><h2>Redes sociais</h2><p>Os campos vazios não aparecem no site.</p></div></div><div className="social-settings-grid">{([['instagram','Instagram','instagram','https://instagram.com/...'],['whatsapp','WhatsApp','whatsapp','https://wa.me/55...'],['tiktok','TikTok','tiktok','https://tiktok.com/@...'],['youtube','YouTube','youtube','https://youtube.com/@...'],['facebook','Facebook','facebook','https://facebook.com/...'],['telegram','Telegram','telegram','https://t.me/...']] as const).map(([field,label,icon,placeholder]) => <label className="social-setting-field" key={field}><span><Icon name={icon} />{label}</span><input value={form[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} type="url" /></label>)}<label className="social-setting-field full"><span><Icon name="mail" />E-mail</span><input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="contato@seudominio.com" type="email" /></label></div></section> : null}

            {tab === "style" ? <section className="admin-panel clean-settings-panel"><div className="admin-panel-head"><div><h2>Cores</h2><p>Use uma cor principal e outra bem clara.</p></div></div><div className="color-setting-grid"><label><span>Cor principal</span><div><input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} /><input className="admin-input" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} /></div></label><label><span>Cor clara de apoio</span><div><input type="color" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} /><input className="admin-input" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} /></div></label></div><div className="clean-color-preview" style={{ background: form.secondary_color }}><button type="button" style={{ background: form.primary_color }}>Exemplo de botão</button><span style={{ borderColor: form.primary_color }}>Categoria</span></div></section> : null}

            {tab === "footer" ? <section className="admin-panel clean-settings-panel"><div className="admin-panel-head"><div><h2>Rodapé</h2><p>Uma descrição curta sobre o site.</p></div></div><label className="admin-label">Descrição<textarea className="admin-input admin-textarea" value={form.footer_description} onChange={(e) => update("footer_description", e.target.value)} /></label></section> : null}
          </div>
        </div>
        <div className="settings-save-bar clean-save-bar"><span>{message || "Revise e salve quando terminar."}</span><button className="admin-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button></div>
      </form>
    </>
  );
}

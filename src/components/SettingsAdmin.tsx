"use client";

import { FormEvent, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/utils";
import Icon from "./Icon";

type UploadField = "logo_url" | "favicon_url" | "hero_image_url";

export default function SettingsAdmin() {
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("identity");

  useEffect(() => { const supabase = getBrowserSupabase(); if (!supabase) return; void supabase.from("site_settings").select("key,value").then(({ data, error: loadError }) => { if (loadError) setError(loadError.message); else setForm(parseSettings(data)); }); }, []);
  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function upload(field: UploadField, file?: File) {
    if (!file) return;
    setUploading(field); setError("");
    try {
      if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem válida.");
      if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
      const supabase = getBrowserSupabase(); if (!supabase) throw new Error("Supabase não configurado.");
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `branding/${field}-${Date.now()}.${extension}`;
      const result = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type });
      if (result.error) throw result.error;
      update(field, supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl);
      setMessage("Imagem enviada. Salve as configurações para publicar.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro ao enviar imagem."); } finally { setUploading(null); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase(); if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    const rows = Object.entries(form).map(([key, value]) => ({ key, value }));
    const { error: saveError } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (saveError) setError(saveError.message); else setMessage("Personalização salva. Atualize o site para visualizar as mudanças.");
    setSaving(false);
  }

  const tabs = [
    ["identity", "Identidade", "image"], ["home", "Página inicial", "home"], ["social", "Redes sociais", "instagram"], ["appearance", "Aparência", "sparkles"], ["footer", "Rodapé", "products"],
  ] as const;

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">PERSONALIZAÇÃO</span><h1>Identidade e configurações</h1><p>Controle logo, textos, vitrine, cores e redes sociais sem editar código.</p></div><a className="admin-button secondary" href="/" target="_blank">Pré-visualizar <Icon name="external" /></a></div>
      {error ? <div className="error admin-alert">{error}</div> : null}{message ? <div className="success admin-alert">{message}</div> : null}
      <form onSubmit={save}>
        <div className="settings-layout"><aside className="settings-tabs">{tabs.map(([key, label, icon]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon name={icon} /><span>{label}</span></button>)}</aside>
          <div className="settings-content">
            {tab === "identity" ? <section className="admin-panel settings-panel"><div className="admin-panel-head"><div><small>MARCA</small><h2>Identidade visual</h2><p>Defina como sua marca aparece no cabeçalho, rodapé e painel.</p></div></div><div className="brand-upload-grid">
              <div className="brand-upload-card"><div className="brand-upload-preview logo-preview"><img src={form.logo_url || "/brand/hs-logo.png"} alt="Logo" /></div><strong>Logo principal</strong><small>Recomendado: imagem quadrada em PNG ou WebP.</small><label className="admin-upload-button"><Icon name="image" />{uploading === "logo_url" ? "Enviando..." : "Enviar nova logo"}<input type="file" accept="image/*" onChange={(e) => void upload("logo_url", e.target.files?.[0])} disabled={uploading !== null} /></label></div>
              <div className="brand-upload-card"><div className="brand-upload-preview favicon-preview"><img src={form.favicon_url || form.logo_url} alt="Ícone" /></div><strong>Ícone do navegador</strong><small>Use uma imagem simples e centralizada.</small><label className="admin-upload-button"><Icon name="image" />{uploading === "favicon_url" ? "Enviando..." : "Enviar ícone"}<input type="file" accept="image/*" onChange={(e) => void upload("favicon_url", e.target.files?.[0])} disabled={uploading !== null} /></label></div>
            </div><div className="admin-form-grid settings-fields"><label className="admin-label full">Nome da marca<input className="admin-input" value={form.site_name} onChange={(e) => update("site_name", e.target.value)} required /></label><label className="admin-label full">URL da logo<input className="admin-input" type="text" value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} /></label><label className="admin-label full">URL do ícone<input className="admin-input" type="text" value={form.favicon_url} onChange={(e) => update("favicon_url", e.target.value)} /></label></div></section> : null}

            {tab === "home" ? <section className="admin-panel settings-panel"><div className="admin-panel-head"><div><small>PÁGINA INICIAL</small><h2>Apresentação e vitrine</h2><p>Personalize o primeiro impacto e a área dinâmica de produtos.</p></div></div><div className="hero-admin-preview"><div><span>{form.hero_eyebrow}</span><h3>{form.hero_title}</h3><p>{form.hero_subtitle}</p><button type="button">{form.hero_button_text}</button></div><img src={form.hero_image_url || form.logo_url} alt="Prévia" /></div><div className="admin-form-grid settings-fields"><label className="admin-label full">Texto pequeno acima do título<input className="admin-input" value={form.hero_eyebrow} onChange={(e) => update("hero_eyebrow", e.target.value)} /></label><label className="admin-label full">Título principal<input className="admin-input" value={form.hero_title} onChange={(e) => update("hero_title", e.target.value)} required /></label><label className="admin-label full">Descrição<textarea className="admin-input admin-textarea" value={form.hero_subtitle} onChange={(e) => update("hero_subtitle", e.target.value)} /></label><label className="admin-label">Texto do botão<input className="admin-input" value={form.hero_button_text} onChange={(e) => update("hero_button_text", e.target.value)} /></label><label className="admin-label">Produtos por carregamento<input className="admin-input" type="number" min="4" max="100" value={form.products_per_page} onChange={(e) => update("products_per_page", Number(e.target.value))} /></label><label className="admin-label full">Imagem principal<input className="admin-input" type="text" value={form.hero_image_url} onChange={(e) => update("hero_image_url", e.target.value)} /></label><label className="admin-upload-button full"><Icon name="image" />{uploading === "hero_image_url" ? "Enviando..." : "Enviar imagem principal"}<input type="file" accept="image/*" onChange={(e) => void upload("hero_image_url", e.target.files?.[0])} disabled={uploading !== null} /></label></div><div className="settings-divider" /><div className="admin-form-grid settings-fields"><label className="admin-toggle-row full"><input type="checkbox" checked={form.announcement_enabled} onChange={(e) => update("announcement_enabled", e.target.checked)} /><span><strong>Exibir faixa de aviso</strong><small>Mostra um anúncio discreto no topo do site.</small></span></label><label className="admin-label">Texto do aviso<input className="admin-input" value={form.announcement_text} onChange={(e) => update("announcement_text", e.target.value)} /></label><label className="admin-label">Link do aviso<input className="admin-input" value={form.announcement_url} onChange={(e) => update("announcement_url", e.target.value)} placeholder="#novidades" /></label><label className="admin-toggle-row full"><input type="checkbox" checked={form.coverflow_enabled} onChange={(e) => update("coverflow_enabled", e.target.checked)} /><span><strong>Exibir vitrine Coverflow</strong><small>Produtos passam automaticamente em ordem aleatória.</small></span></label><label className="admin-label">Título da vitrine<input className="admin-input" value={form.coverflow_title} onChange={(e) => update("coverflow_title", e.target.value)} /></label><label className="admin-label">Descrição da vitrine<input className="admin-input" value={form.coverflow_subtitle} onChange={(e) => update("coverflow_subtitle", e.target.value)} /></label></div></section> : null}

            {tab === "social" ? <section className="admin-panel settings-panel"><div className="admin-panel-head"><div><small>CANAIS</small><h2>Redes sociais e contato</h2><p>Preencha apenas os canais que deseja exibir.</p></div></div><div className="social-settings-grid">{([['instagram','Instagram','instagram','https://instagram.com/...'],['whatsapp','WhatsApp','whatsapp','https://wa.me/55...'],['tiktok','TikTok','tiktok','https://tiktok.com/@...'],['youtube','YouTube','youtube','https://youtube.com/@...'],['facebook','Facebook','facebook','https://facebook.com/...'],['telegram','Telegram','telegram','https://t.me/...']] as const).map(([field,label,icon,placeholder]) => <label className="social-setting-field" key={field}><span><Icon name={icon} />{label}</span><input value={form[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} type="url" /></label>)}<label className="social-setting-field full"><span><Icon name="mail" />E-mail</span><input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="contato@seudominio.com" type="email" /></label></div></section> : null}

            {tab === "appearance" ? <section className="admin-panel settings-panel"><div className="admin-panel-head"><div><small>ESTILO</small><h2>Cores da marca</h2><p>A paleta atualiza botões, destaques e detalhes do site público.</p></div></div><div className="color-setting-grid"><label><span>Cor principal</span><div><input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} /><input className="admin-input" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} /></div></label><label><span>Cor suave de apoio</span><div><input type="color" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} /><input className="admin-input" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} /></div></label></div><div className="appearance-preview" style={{ background: `linear-gradient(135deg, ${form.secondary_color}, #fff)` }}><span style={{ background: form.primary_color }}>Botão principal</span><div style={{ borderColor: form.primary_color }}><strong>{form.site_name}</strong><small>Prévia da identidade</small></div></div></section> : null}

            {tab === "footer" ? <section className="admin-panel settings-panel"><div className="admin-panel-head"><div><small>RODAPÉ</small><h2>Mensagem institucional</h2><p>Explique de forma curta o propósito da marca.</p></div></div><label className="admin-label">Descrição do rodapé<textarea className="admin-input admin-textarea" value={form.footer_description} onChange={(e) => update("footer_description", e.target.value)} /></label><div className="footer-admin-preview"><img src={form.logo_url || "/brand/hs-logo.png"} alt="" /><div><strong>{form.site_name}</strong><p>{form.footer_description}</p></div></div></section> : null}
          </div>
        </div>
        <div className="settings-save-bar"><div><Icon name="check" /><span><strong>Pronto para publicar?</strong><small>As alterações entram no ar assim que forem salvas.</small></span></div><button className="admin-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar todas as alterações"}</button></div>
      </form>
    </>
  );
}

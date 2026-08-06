"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/utils";
import Icon, { type IconName } from "./Icon";

type Tab = "colors" | "buttons" | "typography" | "products" | "header";

type ColorField = {
  key: keyof SiteSettings;
  label: string;
  description: string;
};

const baseColors: ColorField[] = [
  { key: "primary_color", label: "Cor principal", description: "Destaques, selos e elementos da marca." },
  { key: "secondary_color", label: "Fundo colorido", description: "Áreas suaves e blocos de apoio." },
  { key: "accent_color", label: "Cor de apoio", description: "Detalhes, categorias e elementos secundários." },
  { key: "background_color", label: "Fundo do site", description: "Cor principal das páginas." },
  { key: "surface_color", label: "Cartões e superfícies", description: "Cards, formulários e blocos." },
  { key: "text_color", label: "Texto principal", description: "Títulos e informações importantes." },
  { key: "muted_text_color", label: "Texto secundário", description: "Descrições e informações auxiliares." },
  { key: "border_color", label: "Bordas", description: "Divisórias, campos e contornos." },
];

const buttonColors: ColorField[] = [
  { key: "button_primary_color", label: "Botão principal", description: "Comprar, buscar e ações principais." },
  { key: "button_primary_hover_color", label: "Botão ao tocar", description: "Cor usada no hover e pressionado." },
  { key: "button_text_color", label: "Texto do botão principal", description: "Texto e ícones do botão principal." },
  { key: "button_secondary_color", label: "Botão secundário", description: "Ações alternativas e discretas." },
  { key: "button_secondary_text_color", label: "Texto do botão secundário", description: "Texto e ícones dos botões secundários." },
  { key: "link_color", label: "Links", description: "Links de navegação e ações em texto." },
  { key: "success_color", label: "Sucesso", description: "Mensagens positivas e estados publicados." },
  { key: "danger_color", label: "Atenção e exclusão", description: "Avisos, erros e ações destrutivas." },
];

const tabs: Array<[Tab, string, IconName]> = [
  ["colors", "Cores", "palette"],
  ["buttons", "Botões", "click"],
  ["typography", "Textos", "text"],
  ["products", "Produtos", "products"],
  ["header", "Cabeçalho", "navigation"],
];

const saveKeys: Array<keyof SiteSettings> = [
  "primary_color", "secondary_color", "accent_color", "background_color", "surface_color", "text_color", "muted_text_color", "border_color",
  "button_text_color", "button_primary_color", "button_primary_hover_color", "button_secondary_color", "button_secondary_text_color", "link_color", "success_color", "danger_color",
  "font_family", "heading_font_family", "container_width", "corner_radius", "card_style", "header_style", "sticky_header", "show_header_search", "show_prices",
  "show_product_codes", "show_click_count", "product_columns_mobile", "product_columns_desktop", "button_style", "product_image_ratio", "section_spacing", "animations_enabled", "shadow_strength",
];

export default function AppearanceAdmin() {
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [savedForm, setSavedForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>("colors");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void supabase.from("site_settings").select("key,value").then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      else {
        const parsed = parseSettings(data);
        setForm(parsed);
        setSavedForm(parsed);
      }
    });
  }, []);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  const hasChanges = useMemo(() => saveKeys.some((key) => JSON.stringify(form[key]) !== JSON.stringify(savedForm[key])), [form, savedForm]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase não configurado.");
      setSaving(false);
      return;
    }
    const { error: saveError } = await supabase.from("site_settings").upsert(saveKeys.map((key) => ({ key, value: form[key] })), { onConflict: "key" });
    if (saveError) setError(saveError.message);
    else {
      setSavedForm(form);
      setMessage("Aparência publicada com sucesso.");
    }
    setSaving(false);
  }

  function applyPreset(name: "gallery" | "peach" | "sage" | "contrast") {
    const presets = {
      gallery: {
        primary_color: "#d96c78", secondary_color: "#f3b29f", accent_color: "#b7a6ca", background_color: "#f6efea", surface_color: "#fff9f5", text_color: "#2a2224", muted_text_color: "#726568", border_color: "#e8d9d3",
        button_primary_color: "#8f394d", button_primary_hover_color: "#742d3f", button_text_color: "#ffffff", button_secondary_color: "#fff1f0", button_secondary_text_color: "#8f394d", link_color: "#9f4357", success_color: "#2f7d5b", danger_color: "#b5475a",
      },
      peach: {
        primary_color: "#c96f68", secondary_color: "#efb38d", accent_color: "#7f3e45", background_color: "#f7eee7", surface_color: "#fff9f4", text_color: "#2d2422", muted_text_color: "#766762", border_color: "#ead8cf",
        button_primary_color: "#7f3e45", button_primary_hover_color: "#653039", button_text_color: "#ffffff", button_secondary_color: "#fff0e7", button_secondary_text_color: "#7f3e45", link_color: "#a9514d", success_color: "#3c7b5e", danger_color: "#b64f5a",
      },
      sage: {
        primary_color: "#7f9f8c", secondary_color: "#d7c4ad", accent_color: "#4f6f60", background_color: "#f2f1e9", surface_color: "#fffdf7", text_color: "#252b28", muted_text_color: "#66706a", border_color: "#dce2da",
        button_primary_color: "#4f6f60", button_primary_hover_color: "#3d594c", button_text_color: "#ffffff", button_secondary_color: "#eef3ef", button_secondary_text_color: "#4f6f60", link_color: "#557967", success_color: "#2f7d5b", danger_color: "#aa4a55",
      },
      contrast: {
        primary_color: "#e15f74", secondary_color: "#f4c36b", accent_color: "#7657a6", background_color: "#fff8f4", surface_color: "#ffffff", text_color: "#211b1d", muted_text_color: "#63585c", border_color: "#e4d6d9",
        button_primary_color: "#74293d", button_primary_hover_color: "#571e2d", button_text_color: "#ffffff", button_secondary_color: "#f8e9ed", button_secondary_text_color: "#74293d", link_color: "#a53652", success_color: "#267553", danger_color: "#b02d49",
      },
    } as const;
    setForm((current) => ({ ...current, ...presets[name] }));
    setMessage("");
  }

  const colorEditor = (fields: ColorField[]) => <div className="hs-appearance-color-grid">{fields.map((field) => <label key={field.key}>
    <div><span>{field.label}</span><small>{field.description}</small></div>
    <div className="hs-appearance-color-input"><input type="color" value={String(form[field.key])} onChange={(event) => update(field.key, event.target.value as never)} /><input value={String(form[field.key])} onChange={(event) => update(field.key, event.target.value as never)} /></div>
  </label>)}</div>;

  return <>
    <div className="admin-page-heading-ui hs-appearance-heading">
      <div><span>PERSONALIZAÇÃO</span><h1>Aparência do site</h1><p>Altere cores, botões, fontes, cards e cabeçalho sem editar código.</p></div>
      <div className="product-heading-actions"><button type="button" className="admin-button-ui secondary" onClick={() => setForm(savedForm)} disabled={!hasChanges}><Icon name="close" />Descartar</button><a className="admin-button-ui secondary" href="/" target="_blank"><Icon name="eye" />Ver site</a></div>
    </div>

    {error ? <div className="admin-alert-ui error">{error}</div> : null}
    {message ? <div className="admin-alert-ui success">{message}</div> : null}

    <form onSubmit={save} className="hs-appearance-workspace">
      <aside className="hs-appearance-tabs">{tabs.map(([key, label, icon]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon name={icon} /><span>{label}</span></button>)}</aside>

      <section className="admin-card-ui hs-appearance-editor">
        {tab === "colors" ? <>
          <div className="admin-card-head-ui"><div><small>IDENTIDADE</small><h2>Cores principais</h2><p>As alterações aparecem na prévia ao lado antes de serem publicadas.</p></div></div>
          <div className="hs-theme-presets"><span>Temas prontos</span><button type="button" onClick={() => applyPreset("gallery")}>Galeria H&S</button><button type="button" onClick={() => applyPreset("peach")}>Pêssego editorial</button><button type="button" onClick={() => applyPreset("sage")}>Sálvia acolhedora</button><button type="button" onClick={() => applyPreset("contrast")}>Contraste forte</button></div>
          {colorEditor(baseColors)}
        </> : null}

        {tab === "buttons" ? <>
          <div className="admin-card-head-ui"><div><small>AÇÕES</small><h2>Botões, links e estados</h2><p>Controle separadamente o botão principal, secundário, links, sucesso e exclusão.</p></div></div>
          {colorEditor(buttonColors)}
          <div className="hs-button-preview-row">
            <button type="button" style={{ background: form.button_primary_color, color: form.button_text_color, borderRadius: form.button_style === "pill" ? 999 : form.button_style === "square" ? 4 : Math.max(8, form.corner_radius - 6) }}>Botão principal</button>
            <button type="button" style={{ background: form.button_secondary_color, color: form.button_secondary_text_color, borderRadius: form.button_style === "pill" ? 999 : form.button_style === "square" ? 4 : Math.max(8, form.corner_radius - 6) }}>Botão secundário</button>
            <a style={{ color: form.link_color }}>Link de texto</a>
            <span style={{ color: form.success_color }}>Publicado</span>
            <span style={{ color: form.danger_color }}>Excluir</span>
          </div>
          <div className="admin-form-grid-ui"><label><span>Formato dos botões</span><select value={form.button_style} onChange={(event) => update("button_style", event.target.value as SiteSettings["button_style"])}><option value="rounded">Arredondado</option><option value="pill">Pílula</option><option value="square">Mais reto</option></select></label></div>
        </> : null}

        {tab === "typography" ? <>
          <div className="admin-card-head-ui"><div><small>TIPOGRAFIA</small><h2>Fontes e espaçamento</h2><p>Escolha combinações legíveis para celular e computador.</p></div></div>
          <div className="admin-form-grid-ui">
            <label><span>Fonte dos textos</span><select value={form.font_family} onChange={(event) => update("font_family", event.target.value)}><option>Inter</option><option>Manrope</option><option>Arial</option><option>System</option></select></label>
            <label><span>Fonte dos títulos</span><select value={form.heading_font_family} onChange={(event) => update("heading_font_family", event.target.value)}><option>Georgia</option><option>Inter</option><option>Manrope</option><option>System</option></select></label>
            <label><span>Largura máxima ({form.container_width}px)</span><input type="range" min="960" max="1380" step="20" value={form.container_width} onChange={(event) => update("container_width", Number(event.target.value))} /></label>
            <label><span>Espaço entre seções ({form.section_spacing}px)</span><input type="range" min="36" max="110" step="2" value={form.section_spacing} onChange={(event) => update("section_spacing", Number(event.target.value))} /></label>
          </div>
        </> : null}

        {tab === "products" ? <>
          <div className="admin-card-head-ui"><div><small>CATÁLOGO</small><h2>Cards de produtos</h2><p>Defina quantidade de colunas, proporção e informações visíveis.</p></div></div>
          <div className="admin-form-grid-ui">
            <label><span>Estilo do card</span><select value={form.card_style} onChange={(event) => update("card_style", event.target.value as SiteSettings["card_style"])}><option value="soft">Suave</option><option value="outlined">Com borda</option><option value="flat">Plano</option></select></label>
            <label><span>Proporção da imagem</span><select value={form.product_image_ratio} onChange={(event) => update("product_image_ratio", event.target.value as SiteSettings["product_image_ratio"])}><option value="square">Quadrada</option><option value="portrait">Retrato</option><option value="landscape">Horizontal</option></select></label>
            <label><span>Colunas no celular</span><select value={form.product_columns_mobile} onChange={(event) => update("product_columns_mobile", Number(event.target.value))}><option value="1">1 coluna</option><option value="2">2 colunas</option></select></label>
            <label><span>Colunas no computador</span><select value={form.product_columns_desktop} onChange={(event) => update("product_columns_desktop", Number(event.target.value))}><option value="2">2 colunas</option><option value="3">3 colunas</option><option value="4">4 colunas</option><option value="5">5 colunas</option></select></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.show_prices} onChange={(event) => update("show_prices", event.target.checked)} /><span><strong>Mostrar preços</strong><small>Exibe preço ou faixa do produto.</small></span></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.show_product_codes} onChange={(event) => update("show_product_codes", event.target.checked)} /><span><strong>Mostrar códigos</strong><small>Exibe A001, A002 e outros.</small></span></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.show_click_count} onChange={(event) => update("show_click_count", event.target.checked)} /><span><strong>Mostrar cliques</strong><small>Exibe popularidade publicamente.</small></span></label>
            <label><span>Arredondamento ({form.corner_radius}px)</span><input type="range" min="8" max="30" value={form.corner_radius} onChange={(event) => update("corner_radius", Number(event.target.value))} /></label>
            <label><span>Intensidade da sombra ({form.shadow_strength})</span><input type="range" min="0" max="15" value={form.shadow_strength} onChange={(event) => update("shadow_strength", Number(event.target.value))} /></label>
          </div>
        </> : null}

        {tab === "header" ? <>
          <div className="admin-card-head-ui"><div><small>NAVEGAÇÃO</small><h2>Cabeçalho e movimento</h2><p>Controle o formato do topo e as animações públicas.</p></div></div>
          <div className="admin-form-grid-ui">
            <label><span>Estilo do cabeçalho</span><select value={form.header_style} onChange={(event) => update("header_style", event.target.value as SiteSettings["header_style"])}><option value="compact">Compacto</option><option value="centered">Centralizado</option><option value="minimal">Minimalista</option></select></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.sticky_header} onChange={(event) => update("sticky_header", event.target.checked)} /><span><strong>Cabeçalho fixo</strong><small>Permanece no topo ao rolar.</small></span></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.show_header_search} onChange={(event) => update("show_header_search", event.target.checked)} /><span><strong>Busca no cabeçalho</strong><small>Exibe atalho de pesquisa.</small></span></label>
            <label className="checkbox-card-ui"><input type="checkbox" checked={form.animations_enabled} onChange={(event) => update("animations_enabled", event.target.checked)} /><span><strong>Animações do site</strong><small>Desative para uma experiência mais simples.</small></span></label>
          </div>
        </> : null}
      </section>

      <aside className="hs-appearance-preview" style={{ background: form.background_color, color: form.text_color }}>
        <div className="hs-appearance-preview__toolbar"><span>PRÉVIA AO VIVO</span><i style={{ background: form.primary_color }} /></div>
        <div className="hs-appearance-preview__site" style={{ borderColor: form.border_color, borderRadius: form.corner_radius }}>
          <header style={{ background: form.surface_color, borderColor: form.border_color }}><span style={{ background: form.primary_color, color: form.button_text_color }}>H&S</span><strong style={{ fontFamily: form.heading_font_family }}>Achadinhos</strong></header>
          <section style={{ background: `linear-gradient(135deg, ${form.secondary_color}, ${form.background_color})` }}><small style={{ color: form.primary_color }}>NOVIDADES</small><h3 style={{ fontFamily: form.heading_font_family }}>Viu no vídeo? Encontre aqui.</h3><p style={{ color: form.muted_text_color }}>Uma prévia rápida das suas escolhas.</p></section>
          <article style={{ background: form.surface_color, borderColor: form.border_color, borderRadius: form.corner_radius }}><div style={{ background: form.accent_color }} /><small style={{ color: form.primary_color }}>CASA & COZINHA</small><strong>Nome do produto</strong><span style={{ color: form.muted_text_color }}>R$ 39,90</span><button type="button" style={{ background: form.button_primary_color, color: form.button_text_color, borderRadius: form.button_style === "pill" ? 999 : form.button_style === "square" ? 4 : Math.max(8, form.corner_radius - 6) }}>Ver na Shopee</button><button type="button" style={{ background: form.button_secondary_color, color: form.button_secondary_text_color, borderRadius: form.button_style === "pill" ? 999 : form.button_style === "square" ? 4 : Math.max(8, form.corner_radius - 6) }}>Detalhes</button></article>
        </div>
      </aside>

      <div className="hs-appearance-savebar"><div>{hasChanges ? <><i /><span><strong>Alterações não publicadas</strong><small>Confira a prévia e salve para aplicar no site.</small></span></> : <><Icon name="check" /><span><strong>Tudo salvo</strong><small>A aparência publicada está atualizada.</small></span></>}</div><button className="admin-button-ui" disabled={saving || !hasChanges}><Icon name="save" />{saving ? "Publicando..." : "Publicar aparência"}</button></div>
    </form>
  </>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { HomeSection } from "@/lib/types";
import Icon from "./Icon";

const labels: Record<HomeSection["section_type"], string> = {
  hero: "Entrada e busca",
  banners: "Banners",
  video_products: "Produtos dos vídeos",
  categories: "Categorias",
  newest: "Novidades",
  trending: "Mais acessados",
  catalog: "Catálogo completo",
  custom_text: "Bloco personalizado",
};

export default function SiteBuilderAdmin() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { data, error: loadError } = await supabase.from("home_sections").select("*").order("sort_order");
    if (loadError) setError(loadError.message); else { const rows = (data ?? []) as HomeSection[]; setSections(rows); setSelectedId((current) => current ?? rows[0]?.id ?? null); }
  }
  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => sections.find((item) => item.id === selectedId) ?? null, [sections, selectedId]);
  function updateSelected(patch: Partial<HomeSection>) { if (!selectedId) return; setSections((items) => items.map((item) => item.id === selectedId ? { ...item, ...patch } : item)); }
  function updateSetting(key: string, value: unknown) { if (!selected) return; updateSelected({ settings: { ...selected.settings, [key]: value } }); }

  async function saveSection() {
    if (!selected) return;
    setSaving(true); setMessage(""); setError("");
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: saveError } = await supabase.from("home_sections").update({ title: selected.title, subtitle: selected.subtitle, eyebrow: selected.eyebrow, is_enabled: selected.is_enabled, sort_order: selected.sort_order, settings: selected.settings }).eq("id", selected.id);
    if (saveError) setError(saveError.message); else setMessage("Bloco salvo e publicado.");
    setSaving(false);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction; if (target < 0 || target >= sections.length) return;
    const next = [...sections]; [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((item, order) => ({ ...item, sort_order: (order + 1) * 10 }));
    setSections(normalized);
    const supabase = getBrowserSupabase(); if (!supabase) return;
    await Promise.all(normalized.map((item) => supabase.from("home_sections").update({ sort_order: item.sort_order }).eq("id", item.id)));
    setMessage("Ordem atualizada.");
  }

  async function addCustom() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const key = `custom-${Date.now()}`;
    const { data, error: insertError } = await supabase.from("home_sections").insert({ section_key: key, section_type: "custom_text", title: "Novo bloco", subtitle: "Escreva uma mensagem para seus visitantes.", eyebrow: "", is_enabled: true, sort_order: (sections.length + 1) * 10, settings: { body: "", button_text: "", button_url: "", alignment: "left" } }).select().single();
    if (insertError) setError(insertError.message); else { await load(); setSelectedId((data as HomeSection).id); }
  }
  async function duplicateSelected() {
    if (!selected) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { data, error: duplicateError } = await supabase.from("home_sections").insert({ section_key: `${selected.section_key}-copy-${Date.now()}`, section_type: selected.section_type, title: `${selected.title} (cópia)`, subtitle: selected.subtitle, eyebrow: selected.eyebrow, is_enabled: false, sort_order: (sections.length + 1) * 10, settings: selected.settings }).select().single();
    if (duplicateError) setError(duplicateError.message); else { await load(); setSelectedId((data as HomeSection).id); setMessage("Cópia criada como oculta."); }
  }
  async function deleteSelected() {
    if (!selected || selected.section_type !== "custom_text") return;
    if (!confirm(`Excluir o bloco “${selected.title}”?`)) return;
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const { error: deleteError } = await supabase.from("home_sections").delete().eq("id", selected.id);
    if (deleteError) setError(deleteError.message); else { setSelectedId(null); await load(); setMessage("Bloco excluído."); }
  }

  return <>
    <div className="admin-page-heading-ui"><div><span>EDITOR DO SITE</span><h1>Monte a página inicial</h1><p>Ative, reordene e edite cada bloco. A ordem abaixo é a ordem publicada.</p></div><div><a className="admin-button-ui secondary" href="/" target="_blank"><Icon name="eye" />Ver site</a><button className="admin-button-ui" onClick={() => void addCustom()}><Icon name="plus" />Novo bloco</button></div></div>
    {error ? <div className="admin-alert-ui error">{error}</div> : null}{message ? <div className="admin-alert-ui success">{message}</div> : null}
    <div className="builder-layout-ui">
      <aside className="builder-list-ui">
        <div className="builder-list-title"><strong>Estrutura da home</strong><small>{sections.filter((item) => item.is_enabled).length} blocos visíveis</small></div>
        {sections.map((item, index) => <div className={`builder-item-ui ${item.id === selectedId ? "active" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><span className={`builder-status-dot ${item.is_enabled ? "on" : ""}`} /><div><strong>{labels[item.section_type]}</strong><small>{item.title || "Sem título"}</small></div><div className="builder-order-actions"><button onClick={(event) => { event.stopPropagation(); void move(index, -1); }} disabled={index === 0}><Icon name="up" size={15} /></button><button onClick={(event) => { event.stopPropagation(); void move(index, 1); }} disabled={index === sections.length - 1}><Icon name="down" size={15} /></button></div></div>)}
      </aside>

      <section className="builder-editor-ui">
        {selected ? <>
          <div className="builder-editor-head"><div><small>{labels[selected.section_type]}</small><h2>{selected.title || "Configurar bloco"}</h2></div><label className="switch-ui"><input type="checkbox" checked={selected.is_enabled} onChange={(event) => updateSelected({ is_enabled: event.target.checked })} /><span /><b>{selected.is_enabled ? "Visível" : "Oculto"}</b></label></div>
          <div className="admin-form-grid-ui">
            <label><span>Texto pequeno</span><input value={selected.eyebrow} onChange={(event) => updateSelected({ eyebrow: event.target.value })} placeholder="Ex.: Viu no vídeo?" /></label>
            <label className="full"><span>Título</span><input value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} /></label>
            <label className="full"><span>Descrição</span><textarea value={selected.subtitle} onChange={(event) => updateSelected({ subtitle: event.target.value })} rows={3} /></label>
            {selected.section_type === "hero" ? <><label><span>Layout</span><select value={String(selected.settings.layout || "compact")} onChange={(event) => updateSetting("layout", event.target.value)}><option value="compact">Compacto</option><option value="split">Texto + imagem</option><option value="centered">Centralizado</option></select></label><label><span>Alinhamento</span><select value={String(selected.settings.alignment || "left")} onChange={(event) => updateSetting("alignment", event.target.value)}><option value="left">Esquerda</option><option value="center">Centro</option></select></label><label className="full checkbox-line-ui"><input type="checkbox" checked={Boolean(selected.settings.show_search ?? true)} onChange={(event) => updateSetting("show_search", event.target.checked)} />Mostrar busca dentro do bloco</label><label className="full checkbox-line-ui"><input type="checkbox" checked={Boolean(selected.settings.show_steps ?? true)} onChange={(event) => updateSetting("show_steps", event.target.checked)} />Mostrar instruções em três passos</label></> : null}
            {["video_products","newest","trending","categories"].includes(selected.section_type) ? <label><span>Quantidade de itens</span><input type="number" min="4" max="30" value={Number(selected.settings.limit || 8)} onChange={(event) => updateSetting("limit", Number(event.target.value))} /></label> : null}
            {selected.section_type === "video_products" ? <><label><span>Formato</span><select value={String(selected.settings.layout || "rail")} onChange={(event) => updateSetting("layout", event.target.value)}><option value="rail">Carrossel horizontal</option><option value="grid">Grade</option></select></label><label className="checkbox-line-ui"><input type="checkbox" checked={Boolean(selected.settings.autoplay ?? true)} onChange={(event) => updateSetting("autoplay", event.target.checked)} />Passar automaticamente</label><label><span>Intervalo (ms)</span><input type="number" min="3000" max="15000" step="500" value={Number(selected.settings.interval || 5000)} onChange={(event) => updateSetting("interval", Number(event.target.value))} /></label><label><span>Colunas quando for grade</span><select value={Number(selected.settings.columns || 4)} onChange={(event) => updateSetting("columns", Number(event.target.value))}><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label></> : null}
            {selected.section_type === "categories" ? <label><span>Formato das categorias</span><select value={String(selected.settings.style || "stories")} onChange={(event) => updateSetting("style", event.target.value)}><option value="stories">Círculos, estilo destaques</option><option value="cards">Cartões com descrição</option></select></label> : null}
            {["newest","trending"].includes(selected.section_type) ? <label><span>Colunas no computador</span><select value={Number(selected.settings.columns || 4)} onChange={(event) => updateSetting("columns", Number(event.target.value))}><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label> : null}
            {selected.section_type === "banners" ? <><label><span>Altura</span><select value={String(selected.settings.height || "medium")} onChange={(event) => updateSetting("height", event.target.value)}><option value="small">Baixa</option><option value="medium">Média</option><option value="large">Alta</option></select></label><label><span>Troca automática</span><select value={Boolean(selected.settings.autoplay ?? true) ? "yes" : "no"} onChange={(event) => updateSetting("autoplay", event.target.value === "yes")}><option value="yes">Sim</option><option value="no">Não</option></select></label><label><span>Intervalo (ms)</span><input type="number" min="3000" max="15000" step="500" value={Number(selected.settings.interval || 5000)} onChange={(event) => updateSetting("interval", Number(event.target.value))} /></label></> : null}
            {selected.section_type === "custom_text" ? <><label className="full"><span>Conteúdo</span><textarea rows={6} value={String(selected.settings.body || "")} onChange={(event) => updateSetting("body", event.target.value)} /></label><label><span>Texto do botão</span><input value={String(selected.settings.button_text || "")} onChange={(event) => updateSetting("button_text", event.target.value)} /></label><label><span>Link do botão</span><input value={String(selected.settings.button_url || "")} onChange={(event) => updateSetting("button_url", event.target.value)} /></label></> : null}
          </div>
          <div className="builder-preview-ui"><small>PRÉVIA DO BLOCO</small><div className={`builder-preview-card ${selected.section_type}`}><span>{selected.eyebrow}</span><h3>{selected.title || labels[selected.section_type]}</h3><p>{selected.subtitle}</p>{selected.section_type === "categories" ? <div className="mini-stories"><i /><i /><i /><i /></div> : null}{["newest","trending","video_products","catalog"].includes(selected.section_type) ? <div className="mini-products"><i /><i /><i /><i /></div> : null}</div></div>
          <div className="builder-save-row"><small>As alterações entram no ar ao salvar.</small><div>{selected.section_type === "custom_text" ? <button className="admin-button-ui danger" onClick={() => void deleteSelected()}><Icon name="trash" />Excluir</button> : null}<button className="admin-button-ui secondary" onClick={() => void duplicateSelected()}><Icon name="copy" />Duplicar</button><button className="admin-button-ui" onClick={() => void saveSection()} disabled={saving}><Icon name="save" />{saving ? "Salvando..." : "Salvar bloco"}</button></div></div>
        </> : <div className="empty-ui">Selecione um bloco para editar.</div>}
      </section>
    </div>
  </>;
}

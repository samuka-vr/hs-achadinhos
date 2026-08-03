"use client";

import { FormEvent, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SETTINGS, parseSettings } from "@/lib/utils";

export default function SettingsAdmin() {
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    void supabase.from("site_settings").select("key,value").then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message); else setForm(parseSettings(data));
    });
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const supabase = getBrowserSupabase(); if (!supabase) { setError("Supabase não configurado."); setSaving(false); return; }
    const rows = Object.entries(form).map(([key, value]) => ({ key, value }));
    const { error: saveError } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (saveError) setError(saveError.message); else setMessage("Configurações salvas. Atualize o site para ver as mudanças.");
    setSaving(false);
  }

  return (
    <>
      <div className="section-head"><div><h1>Configurações</h1><p>Altere textos e canais principais sem editar código.</p></div></div>
      {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}{message ? <div className="success" style={{ marginBottom: 14 }}>{message}</div> : null}
      <section className="panel" style={{ marginTop: 0 }}><form className="form-grid" onSubmit={save}>
        <label className="label full">Nome do site<input className="input" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} required /></label>
        <label className="label full">Título do banner<input className="input" value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} required /></label>
        <label className="label full">Subtítulo do banner<textarea className="textarea" value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} /></label>
        <label className="label">Link do WhatsApp<input className="input" type="url" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="https://wa.me/..." /></label>
        <label className="label">Link do Instagram<input className="input" type="url" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." /></label>
        <label className="label">Produtos por carregamento<input className="input" type="number" min="4" max="100" value={form.products_per_page} onChange={(e) => setForm({ ...form, products_per_page: Number(e.target.value) })} /></label>
        <div className="full"><button className="button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</button></div>
      </form></section>
    </>
  );
}

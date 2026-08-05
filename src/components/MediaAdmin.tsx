"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { safeUploadBaseName, validateImageFile } from "@/lib/uploads";
import Icon from "./Icon";

type MediaFile = { bucket: "site-assets" | "product-images"; name: string; url: string; created_at?: string; metadata?: { size?: number } };

export default function MediaAdmin() {
  const [files, setFiles] = useState<MediaFile[]>([]); const [bucket, setBucket] = useState<"all" | MediaFile["bucket"]>("all"); const [search, setSearch] = useState(""); const [uploading, setUploading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function load() {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    const next: MediaFile[] = [];
    async function scan(bucketName: MediaFile["bucket"], prefix = "", depth = 0) {
      const { data, error: listError } = await supabase!.storage.from(bucketName).list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (listError) return;
      for (const item of data ?? []) {
        const fullName = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id) next.push({ bucket: bucketName, name: fullName, url: supabase!.storage.from(bucketName).getPublicUrl(fullName).data.publicUrl, created_at: item.created_at ?? undefined, metadata: item.metadata as { size?: number } });
        else if (depth < 3) await scan(bucketName, fullName, depth + 1);
      }
    }
    await scan("site-assets"); await scan("product-images");
    setFiles(next.sort((a,b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))));
  }
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => files.filter((item) => (bucket === "all" || item.bucket === bucket) && item.name.toLowerCase().includes(search.toLowerCase())), [files,bucket,search]);
  async function upload(selected?: File) { if (!selected) return; setUploading(true); setError(""); const supabase = getBrowserSupabase(); if (!supabase) { setUploading(false); return; } try { const validated = await validateImageFile(selected); const base = safeUploadBaseName(selected.name.replace(/\.[^.]+$/, "")); const path = `library/${base}-${Date.now()}.${validated.extension}`; const result = await supabase.storage.from("site-assets").upload(path, selected, { contentType: validated.contentType, upsert: false }); if (result.error) throw result.error; setMessage("Imagem enviada para a biblioteca."); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Erro no upload."); } finally { setUploading(false); } }
  async function remove(item: MediaFile) { if (!confirm("Excluir esta imagem? Ela pode estar sendo usada no site.")) return; const supabase = getBrowserSupabase(); const { error: deleteError } = await supabase!.storage.from(item.bucket).remove([item.name]); if (deleteError) setError(deleteError.message); else { setMessage("Imagem excluída."); await load(); } }
  async function copy(url: string) { await navigator.clipboard.writeText(url); setMessage("URL copiada."); }
  return <><div className="admin-page-heading-v5"><div><span>ARQUIVOS</span><h1>Biblioteca de mídia</h1><p>Reutilize imagens já enviadas e copie a URL quando precisar.</p></div><label className="admin-button-v5"><Icon name="image" />{uploading ? "Enviando..." : "Enviar imagem"}<input type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} /></label></div>{error ? <div className="admin-alert-v5 error">{error}</div> : null}{message ? <div className="admin-alert-v5 success">{message}</div> : null}<div className="media-toolbar-v5"><div><Icon name="search" /><input placeholder="Buscar arquivo" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select value={bucket} onChange={(e) => setBucket(e.target.value as typeof bucket)}><option value="all">Todos os arquivos</option><option value="site-assets">Marca, categorias e banners</option><option value="product-images">Produtos</option></select></div><div className="media-grid-v5">{visible.map((item) => <article key={`${item.bucket}-${item.name}`}><div><img src={item.url} alt="" loading="lazy" /></div><strong>{item.name.split("/").pop()}</strong><small>{item.bucket === "site-assets" ? "Site" : "Produto"}{item.metadata?.size ? ` • ${Math.round(item.metadata.size/1024)} KB` : ""}</small><div><button onClick={() => void copy(item.url)}><Icon name="copy" />Copiar URL</button><button className="danger" onClick={() => void remove(item)}><Icon name="trash" /></button></div></article>)}</div>{!visible.length ? <div className="empty-v5"><Icon name="media" size={34} /><h3>Nenhuma imagem encontrada</h3></div> : null}</>;
}

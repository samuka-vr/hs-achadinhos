"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon from "@/components/Icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") === "unauthorized" ? "Este usuário não tem permissão de administrador." : "");

  useEffect(() => { const supabase = getBrowserSupabase(); if (!supabase) return; void supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace("/admin"); }); }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const supabase = getBrowserSupabase(); if (!supabase) { setError("Supabase ainda não foi configurado."); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) { setError("E-mail ou senha inválidos."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") { await supabase.auth.signOut(); setError("Este usuário não está cadastrado como administrador."); setLoading(false); return; }
    const next = searchParams.get("next"); router.replace(next?.startsWith("/admin") ? next : "/admin");
  }

  return (
    <main className="login-page-pro">
      <div className="login-decoration login-decoration-one" /><div className="login-decoration login-decoration-two" />
      <section className="login-card-pro">
        <div className="login-brand"><img src="/brand/hs-logo.png" alt="H&S Achadinhos" /><div><strong>H&S Achadinhos</strong><small>Painel administrativo</small></div></div>
        <div className="login-heading"><span><Icon name="sparkles" size={16} /> Acesso administrativo</span><h1>Entrar no painel</h1><p>Use seu e-mail e senha de administrador.</p></div>
        {error ? <div className="error">{error}</div> : null}
        <form onSubmit={submit}>
          <label className="admin-label">E-mail<div className="login-input-wrap"><Icon name="mail" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="seu@email.com" /></div></label>
          <label className="admin-label">Senha<div className="login-input-wrap"><Icon name="settings" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Sua senha" /></div></label>
          <button className="admin-button login-submit" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar no painel"}<Icon name="arrow" /></button>
        </form>
        <Link className="login-back" href="/"><Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />Voltar para o site</Link>
      </section>
    </main>
  );
}

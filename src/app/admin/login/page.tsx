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

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role === "admin") router.replace("/admin");
    })();
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Supabase ainda não foi configurado."); setLoading(false); return; }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.user) { setError("E-mail ou senha inválidos."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") { await supabase.auth.signOut(); setError("Este usuário não está cadastrado como administrador."); setLoading(false); return; }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
  }

  return <main className="ha-login">
    <section className="ha-login__intro"><Link href="/" className="ha-login__brand"><span><img src="/brand/hs-monogram.svg" alt="" /></span><div><strong>H&S Achadinhos</strong><small>H&S Studio</small></div></Link><div><span>PAINEL DA MARCA</span><h1>Administre tudo com poucos toques.</h1><p>Produtos, imagens, conteúdo e resultados em um painel feito para celular.</p></div><ul><li><Icon name="products" /><span><strong>Catálogo organizado</strong><small>Edite produtos e fotos rapidamente.</small></span></li><li><Icon name="layout" /><span><strong>Site sob controle</strong><small>Publique seções, banners e redes.</small></span></li><li><Icon name="chart" /><span><strong>Resultados claros</strong><small>Acompanhe cliques e pesquisas.</small></span></li></ul></section>
    <section className="ha-login__card"><div><span>ACESSO SEGURO</span><h2>Entrar no H&S Studio</h2><p>Use seu e-mail e senha de administrador.</p></div>{error ? <div className="error">{error}</div> : null}<form onSubmit={submit}><label><span>E-mail</span><div><Icon name="mail" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="seu@email.com" /></div></label><label><span>Senha</span><div><Icon name="shield" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Sua senha" /></div></label><button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar no painel"}<Icon name="arrow" /></button></form><Link href="/" className="ha-login__back"><Icon name="arrow" size={16} />Voltar ao site</Link></section>
  </main>;
}

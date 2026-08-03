"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

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
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ainda não foi configurado.");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Este usuário não está cadastrado como administrador.");
      setLoading(false);
      return;
    }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/admin") ? next : "/admin");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="brand" href="/"><span className="brand-mark">H&S</span><span>H&S Achadinhos</span></Link>
        <h1>Entrar no painel</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Acesso exclusivo do administrador.</p>
        {error ? <div className="error" style={{ marginTop: 16 }}>{error}</div> : null}
        <form onSubmit={submit}>
          <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label className="label">Senha<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          <button className="button" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}

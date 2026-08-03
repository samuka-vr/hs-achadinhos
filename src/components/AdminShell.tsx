"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Configure as variáveis do Supabase no arquivo .env.local.");
      setReady(true);
      return;
    }
    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, [pathname, router]);

  async function logout() {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) return <div className="loading">Verificando acesso...</div>;
  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="container admin-topbar-row">
          <Link className="brand" href="/admin"><span className="brand-mark">H&S</span><span>Painel</span></Link>
          <nav className="admin-nav" aria-label="Navegação administrativa">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/produtos">Produtos</Link>
            <Link href="/admin/categorias">Categorias</Link>
            <Link href="/admin/configuracoes">Configurações</Link>
            <Link href="/" target="_blank">Ver site</Link>
          </nav>
          <button className="button secondary small" onClick={() => void logout()}>Sair</button>
        </div>
      </header>
      <main className="admin-main"><div className="container">{children}</div></main>
    </div>
  );
}

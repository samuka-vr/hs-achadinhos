"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon from "./Icon";

const navItems = [
  { href: "/admin", label: "Visão geral", icon: "home" as const },
  { href: "/admin/produtos", label: "Produtos", icon: "products" as const },
  { href: "/admin/categorias", label: "Categorias", icon: "categories" as const },
  { href: "/admin/configuracoes", label: "Personalização", icon: "settings" as const },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState({ name: "H&S Achadinhos", logo: "/brand/hs-logo.png" });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Configure as variáveis do Supabase."); setReady(true); return; }
    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) { router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`); return; }
      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("site_settings").select("key,value").in("key", ["site_name", "logo_url"]),
      ]);
      if (!active) return;
      if (profile?.role !== "admin") { await supabase.auth.signOut(); router.replace("/admin/login?error=unauthorized"); return; }
      const values = Object.fromEntries((settings ?? []).map((item) => [item.key, item.value]));
      setBrand({ name: String(values.site_name || "H&S Achadinhos"), logo: String(values.logo_url || "/brand/hs-logo.png") });
      setReady(true);
    })();
    return () => { active = false; };
  }, [pathname, router]);

  async function logout() { const supabase = getBrowserSupabase(); await supabase?.auth.signOut(); router.replace("/admin/login"); }
  function activeRoute(href: string) { return href === "/admin" ? pathname === href : pathname.startsWith(href); }

  if (!ready) return <div className="admin-loading"><img src="/brand/hs-logo.png" alt="" /><strong>Carregando painel...</strong></div>;
  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  return (
    <div className="admin-shell-pro clean-admin-shell">
      <aside className="admin-sidebar clean-admin-sidebar">
        <Link className="admin-brand" href="/admin"><img src={brand.logo} alt="" /><span><strong>{brand.name}</strong><small>Administração</small></span></Link>
        <nav className="admin-sidebar-nav">{navItems.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
        <div className="admin-sidebar-spacer" />
        <Link className="clean-open-site" href="/" target="_blank"><Icon name="external" /><span>Ver site</span></Link>
        <button className="admin-logout" onClick={() => void logout()}><Icon name="logout" /><span>Sair</span></button>
      </aside>
      <div className="admin-workspace">
        <header className="admin-mobile-header"><Link href="/admin" className="admin-mobile-brand"><img src={brand.logo} alt="" /><strong>{brand.name}</strong></Link><Link className="admin-view-site" href="/" target="_blank">Ver site <Icon name="external" size={15} /></Link></header>
        <main className="admin-main-pro">{children}</main>
      </div>
      <nav className="admin-mobile-nav">{navItems.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label.split(" ")[0]}</span></Link>)}</nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type NavItem = { href: string; label: string; icon: IconName; group: "Conteúdo" | "Site" | "Dados" };

const navItems: NavItem[] = [
  { href: "/admin", label: "Visão geral", icon: "home", group: "Dados" },
  { href: "/admin/produtos", label: "Produtos", icon: "products", group: "Conteúdo" },
  { href: "/admin/categorias", label: "Categorias", icon: "categories", group: "Conteúdo" },
  { href: "/admin/banners", label: "Banners", icon: "banner", group: "Conteúdo" },
  { href: "/admin/paginas", label: "Páginas", icon: "text", group: "Conteúdo" },
  { href: "/admin/editor", label: "Editor da página", icon: "layout", group: "Site" },
  { href: "/admin/aparencia", label: "Aparência", icon: "palette", group: "Site" },
  { href: "/admin/navegacao", label: "Menus e links", icon: "navigation", group: "Site" },
  { href: "/admin/midia", label: "Biblioteca de mídia", icon: "media", group: "Conteúdo" },
  { href: "/admin/analytics", label: "Analytics", icon: "chart", group: "Dados" },
  { href: "/admin/configuracoes", label: "Configurações e SEO", icon: "settings", group: "Site" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() { const supabase = getBrowserSupabase(); await supabase?.auth.signOut(); router.replace("/admin/login"); }
  function activeRoute(href: string) { return href === "/admin" ? pathname === href : pathname.startsWith(href); }

  if (!ready) return <div className="admin-loading"><img src="/brand/hs-logo.png" alt="" /><strong>Carregando painel...</strong></div>;
  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  const groups = ["Dados", "Conteúdo", "Site"] as const;
  const mobilePrimary = navItems.slice(0, 4);

  return (
    <div className="admin-shell-v5">
      <aside className="admin-sidebar-v5">
        <Link className="admin-brand-v5" href="/admin"><img src={brand.logo} alt="" /><span><strong>{brand.name}</strong><small>Studio</small></span></Link>
        <div className="admin-nav-v5">
          {groups.map((group) => <div className="admin-nav-group" key={group}><small>{group}</small>{navItems.filter((item) => item.group === group).map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</div>)}
        </div>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank"><Icon name="external" />Ver site</Link>
          <button onClick={() => void logout()}><Icon name="logout" />Sair</button>
        </div>
      </aside>

      <div className="admin-workspace-v5">
        <header className="admin-topbar-v5">
          <button className="admin-mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
          <Link className="admin-mobile-brand-v5" href="/admin"><img src={brand.logo} alt="" /><strong>{brand.name}</strong></Link>
          <div className="admin-topbar-actions"><Link href="/" target="_blank"><Icon name="eye" />Prévia do site</Link></div>
        </header>
        <main className="admin-main-v5">{children}</main>
      </div>

      <nav className="admin-bottom-nav-v5">
        {mobilePrimary.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label.split(" ")[0]}</span></Link>)}
        <button className={mobileOpen ? "active" : ""} onClick={() => setMobileOpen(true)}><Icon name="more" /><span>Mais</span></button>
      </nav>

      {mobileOpen ? <div className="admin-mobile-drawer-backdrop" onMouseDown={() => setMobileOpen(false)}><aside className="admin-mobile-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="admin-mobile-drawer-head"><div><small>H&S ACHADINHOS</small><strong>Controle do site</strong></div><button onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div><div className="admin-mobile-drawer-list">{navItems.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label}</span><Icon name="arrow" size={16} /></Link>)}</div><div className="admin-mobile-drawer-footer"><Link href="/" target="_blank"><Icon name="external" />Abrir site</Link><button onClick={() => void logout()}><Icon name="logout" />Sair da conta</button></div></aside></div> : null}
    </div>
  );
}

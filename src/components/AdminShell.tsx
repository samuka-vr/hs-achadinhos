"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type NavItem = { href: string; label: string; description: string; icon: IconName; group: "Catálogo" | "Experiência" | "Inteligência" };

const navItems: NavItem[] = [
  { href: "/admin", label: "Visão geral", description: "Resumo do site", icon: "home", group: "Inteligência" },
  { href: "/admin/produtos", label: "Produtos", description: "Catálogo e vídeos", icon: "products", group: "Catálogo" },
  { href: "/admin/categorias", label: "Categorias", description: "Organização visual", icon: "categories", group: "Catálogo" },
  { href: "/admin/banners", label: "Banners", description: "Campanhas", icon: "banner", group: "Catálogo" },
  { href: "/admin/midia", label: "Biblioteca", description: "Imagens do site", icon: "media", group: "Catálogo" },
  { href: "/admin/editor", label: "Página inicial", description: "Blocos e ordem", icon: "layout", group: "Experiência" },
  { href: "/admin/aparencia", label: "Identidade visual", description: "Cores e layout", icon: "palette", group: "Experiência" },
  { href: "/admin/navegacao", label: "Menus e redes", description: "Navegação", icon: "navigation", group: "Experiência" },
  { href: "/admin/paginas", label: "Páginas", description: "Conteúdo extra", icon: "text", group: "Experiência" },
  { href: "/admin/analytics", label: "Analytics", description: "Cliques e buscas", icon: "chart", group: "Inteligência" },
  { href: "/admin/configuracoes", label: "Configurações", description: "Marca e SEO", icon: "settings", group: "Inteligência" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brand, setBrand] = useState({ name: "H&S Achadinhos", logo: "/brand/hs-monogram.svg", email: "" });

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
      setBrand({ name: String(values.site_name || "H&S Achadinhos"), logo: String(values.logo_url || "/brand/hs-monogram.svg"), email: user.email || "" });
      setReady(true);
    })();
    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const activeItem = useMemo(() => navItems.find((item) => item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)) || navItems[0], [pathname]);
  const groups = ["Catálogo", "Experiência", "Inteligência"] as const;
  const mobilePrimary = [navItems[0], navItems[1], navItems[2], navItems[5]];

  async function logout() { const supabase = getBrowserSupabase(); await supabase?.auth.signOut(); router.replace("/admin/login"); }
  function activeRoute(href: string) { return href === "/admin" ? pathname === href : pathname.startsWith(href); }

  if (!ready) return <div className="studio-loading"><span className="studio-loading-mark">H&S</span><strong>Abrindo o Studio...</strong></div>;
  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  return <div className="studio-shell">
    <aside className="studio-sidebar">
      <Link className="studio-brand" href="/admin">
        <span><img src={brand.logo} alt="" /></span>
        <div><strong>{brand.name}</strong><small>H&S Studio</small></div>
      </Link>

      <nav className="studio-navigation" aria-label="Painel administrativo">
        {groups.map((group) => <section key={group}>
          <small>{group}</small>
          {navItems.filter((item) => item.group === group).map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}>
            <span className="studio-nav-icon"><Icon name={item.icon} /></span>
            <span><b>{item.label}</b><em>{item.description}</em></span>
          </Link>)}
        </section>)}
      </nav>

      <div className="studio-account">
        <span>{brand.email.slice(0, 1).toUpperCase() || "A"}</span>
        <div><strong>Administrador</strong><small>{brand.email || "Conta principal"}</small></div>
        <button onClick={() => void logout()} aria-label="Sair"><Icon name="logout" size={18} /></button>
      </div>
    </aside>

    <div className="studio-workspace">
      <header className="studio-topbar">
        <button className="studio-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <div className="studio-page-context"><small>H&S STUDIO</small><strong>{activeItem.label}</strong></div>
        <div className="studio-topbar-actions">
          <span className="studio-live-status"><i />Site publicado</span>
          <Link href="/" target="_blank"><Icon name="eye" size={18} /><span>Ver site</span></Link>
        </div>
      </header>
      <main className="studio-main">{children}</main>
    </div>

    <nav className="studio-bottom-nav">
      {mobilePrimary.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label.split(" ")[0]}</span></Link>)}
      <button className={mobileOpen ? "active" : ""} onClick={() => setMobileOpen(true)}><Icon name="more" /><span>Mais</span></button>
    </nav>

    {mobileOpen ? <div className="studio-mobile-backdrop" onMouseDown={() => setMobileOpen(false)}>
      <aside className="studio-mobile-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="studio-mobile-handle" />
        <div className="studio-mobile-head"><div><small>H&S STUDIO</small><strong>Controle do site</strong></div><button onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
        <div className="studio-mobile-links">{navItems.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /><b>{item.label}</b></span><Icon name="arrow" size={16} /></Link>)}</div>
        <div className="studio-mobile-actions"><Link href="/" target="_blank"><Icon name="external" />Abrir site</Link><button onClick={() => void logout()}><Icon name="logout" />Sair</button></div>
      </aside>
    </div> : null}
  </div>;
}

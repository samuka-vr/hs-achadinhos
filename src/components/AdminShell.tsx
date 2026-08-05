"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type Group = "Visão geral" | "Catálogo" | "Conteúdo" | "Crescimento" | "Sistema";
type NavItem = { href: string; label: string; description: string; icon: IconName; group: Group; keywords: string };

const navItems: NavItem[] = [
  { href: "/admin", label: "Início", description: "Pendências e atalhos", icon: "home", group: "Visão geral", keywords: "dashboard resumo tarefas" },
  { href: "/admin/produtos", label: "Produtos", description: "Fotos, preços e links", icon: "products", group: "Catálogo", keywords: "produto foto preço rascunho" },
  { href: "/admin/produtos/importar", label: "Importar", description: "Cadastre vários de uma vez", icon: "code", group: "Catálogo", keywords: "lista massa lote colar" },
  { href: "/admin/categorias", label: "Categorias", description: "Grupos e nomes alternativos", icon: "categories", group: "Catálogo", keywords: "alias categoria imagem" },
  { href: "/admin/midia", label: "Imagens", description: "Arquivos e biblioteca", icon: "media", group: "Catálogo", keywords: "storage upload mídia" },
  { href: "/admin/editor", label: "Página inicial", description: "Seções, textos e ordem", icon: "layout", group: "Conteúdo", keywords: "home hero carrossel" },
  { href: "/admin/banners", label: "Banners", description: "Campanhas e destaques", icon: "banner", group: "Conteúdo", keywords: "banner slider anúncio" },
  { href: "/admin/navegacao", label: "Redes e menus", description: "Links públicos", icon: "navigation", group: "Conteúdo", keywords: "instagram tiktok shopee whatsapp" },
  { href: "/admin/paginas", label: "Páginas", description: "Sobre e políticas", icon: "text", group: "Conteúdo", keywords: "privacidade termos" },
  { href: "/admin/aparencia", label: "Aparência", description: "Marca e componentes", icon: "palette", group: "Crescimento", keywords: "tema cor logo visual" },
  { href: "/admin/analytics", label: "Analytics", description: "Cliques, visitas e buscas", icon: "chart", group: "Crescimento", keywords: "dados métricas" },
  { href: "/admin/controle", label: "Controle", description: "Publicação e backup", icon: "shield", group: "Sistema", keywords: "manutenção exportar reset" },
  { href: "/admin/atividade", label: "Atividades", description: "Histórico de alterações", icon: "calendar", group: "Sistema", keywords: "logs auditoria" },
  { href: "/admin/configuracoes", label: "Configurações", description: "Marca, domínio e SEO", icon: "settings", group: "Sistema", keywords: "seo favicon domínio" },
];
const groups: Group[] = ["Visão geral", "Catálogo", "Conteúdo", "Crescimento", "Sistema"];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [brand, setBrand] = useState({ name: "H&S Achadinhos", logo: "/brand/hs-monogram.svg", email: "", maintenance: false });

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
        supabase.from("site_settings").select("key,value").in("key", ["site_name", "logo_url", "maintenance_mode"]),
      ]);
      if (!active) return;
      if (profile?.role !== "admin") { await supabase.auth.signOut(); router.replace("/admin/login?error=unauthorized"); return; }
      const values = Object.fromEntries((settings ?? []).map((item) => [item.key, item.value]));
      setBrand({ name: String(values.site_name || "H&S Achadinhos"), logo: String(values.logo_url || "/brand/hs-monogram.svg"), email: user.email || "", maintenance: Boolean(values.maintenance_mode) });
      setReady(true);
    })();
    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => { setDrawerOpen(false); setCommandOpen(false); setCommandQuery(""); }, [pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === "Escape") { setCommandOpen(false); setDrawerOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function isActive(href: string) {
    if (href === "/admin") return pathname === href;
    if (href === "/admin/produtos") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  const current = useMemo(() => navItems.find((item) => isActive(item.href)) || navItems[0], [pathname]);
  const searchResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    return query ? navItems.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(query)) : navItems;
  }, [commandQuery]);
  const quick = ["/admin", "/admin/produtos", "/admin/categorias", "/admin/editor"].map((href) => navItems.find((item) => item.href === href)!).filter(Boolean);

  async function logout() { const supabase = getBrowserSupabase(); await supabase?.auth.signOut(); router.replace("/admin/login"); }

  if (!ready) return <div className="ha-loading"><span><img src="/brand/hs-monogram.svg" alt="" /></span><div><strong>Abrindo o H&S Studio</strong><small>Preparando o painel...</small></div></div>;
  if (error) return <main className="ha-error"><div className="error">{error}</div></main>;

  return <div className="ha-shell">
    <aside className="ha-sidebar">
      <Link className="ha-brand" href="/admin"><span><img src={brand.logo} alt="" /></span><div><strong>{brand.name}</strong><small>H&S Studio</small></div></Link>
      <button className="ha-command-button" onClick={() => setCommandOpen(true)}><Icon name="search" size={17} /><span>Buscar função</span><kbd>Ctrl K</kbd></button>
      <nav className="ha-nav" aria-label="Painel administrativo">
        {groups.map((group) => <section key={group}><small>{group}</small>{navItems.filter((item) => item.group === group).map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><b>{item.label}</b><em>{item.description}</em></div></Link>)}</section>)}
      </nav>
      <div className="ha-account"><span>{brand.email.slice(0, 1).toUpperCase() || "A"}</span><div><strong>Administrador</strong><small>{brand.email || "Conta principal"}</small></div><button onClick={() => void logout()} aria-label="Sair"><Icon name="logout" size={18} /></button></div>
    </aside>

    <section className="ha-workspace">
      <header className="ha-topbar">
        <button className="ha-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <div className="ha-page-title"><span>{current.group}</span><strong>{current.label}</strong><small>{current.description}</small></div>
        <button className="ha-top-search" onClick={() => setCommandOpen(true)}><Icon name="search" size={17} /><span>Buscar no painel</span></button>
        <div className="ha-top-actions"><Link className={`ha-status ${brand.maintenance ? "paused" : ""}`} href="/admin/controle"><i />{brand.maintenance ? "Manutenção" : "Publicado"}</Link><Link className="ha-view-site" href="/" target="_blank"><Icon name="eye" size={18} /><span>Ver site</span></Link></div>
      </header>
      <main className="ha-main">{children}</main>
    </section>

    <nav className="ha-bottom-nav" aria-label="Navegação rápida">{quick.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /></span><b>{item.label.split(" ")[0]}</b></Link>)}<button onClick={() => setDrawerOpen(true)} className={drawerOpen ? "active" : ""}><span><Icon name="more" /></span><b>Mais</b></button></nav>

    {drawerOpen ? <div className="ha-drawer-layer" onMouseDown={() => setDrawerOpen(false)}><aside className="ha-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="ha-drawer__handle" /><header><div><span>H&S STUDIO</span><strong>O que deseja editar?</strong></div><button onClick={() => setDrawerOpen(false)}><Icon name="close" /></button></header><button className="ha-drawer__search" onClick={() => { setDrawerOpen(false); setCommandOpen(true); }}><Icon name="search" />Buscar função</button><nav>{navItems.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><b>{item.label}</b><small>{item.description}</small></div><Icon name="arrow" size={15} /></Link>)}</nav><footer><Link href="/" target="_blank"><Icon name="external" />Abrir site</Link><button onClick={() => void logout()}><Icon name="logout" />Sair</button></footer></aside></div> : null}

    {commandOpen ? <div className="ha-command-layer" onMouseDown={() => setCommandOpen(false)}><section className="ha-command" onMouseDown={(event) => event.stopPropagation()}><header><Icon name="search" /><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Digite o que deseja editar..." /><button onClick={() => setCommandOpen(false)}>ESC</button></header><div>{searchResults.map((item) => <Link href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div><Icon name="arrow" size={16} /></Link>)}{!searchResults.length ? <div className="ha-command__empty">Nenhuma função encontrada.</div> : null}</div></section></div> : null}
  </div>;
}

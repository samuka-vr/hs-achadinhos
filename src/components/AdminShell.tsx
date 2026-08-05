"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type Group = "Operação" | "Catálogo" | "Experiência" | "Inteligência";
type NavItem = { href: string; label: string; description: string; icon: IconName; group: Group; keywords?: string };

const navItems: NavItem[] = [
  { href: "/admin", label: "Visão geral", description: "Resumo e prioridades", icon: "home", group: "Operação", keywords: "dashboard início métricas" },
  { href: "/admin/controle", label: "Central de controle", description: "Site, catálogo e backup", icon: "shield", group: "Operação", keywords: "manutenção reset backup exportar publicar" },
  { href: "/admin/atividade", label: "Histórico", description: "Alterações do painel", icon: "calendar", group: "Operação", keywords: "logs auditoria segurança" },
  { href: "/admin/produtos", label: "Produtos", description: "Catálogo, imagens e preços", icon: "products", group: "Catálogo", keywords: "rascunho publicar preço link" },
  { href: "/admin/produtos/importar", label: "Importar produtos", description: "Cadastre vários de uma vez", icon: "code", group: "Catálogo", keywords: "massa lista colar" },
  { href: "/admin/categorias", label: "Categorias", description: "Principais e nomes alternativos", icon: "categories", group: "Catálogo", keywords: "mapear grupo emoji imagem" },
  { href: "/admin/banners", label: "Banners", description: "Campanhas e destaques", icon: "banner", group: "Catálogo", keywords: "slider anúncio campanha" },
  { href: "/admin/midia", label: "Biblioteca de mídia", description: "Imagens enviadas", icon: "media", group: "Catálogo", keywords: "arquivo upload storage" },
  { href: "/admin/editor", label: "Editor da página", description: "Blocos, textos e ordem", icon: "layout", group: "Experiência", keywords: "home seção vitrine carrossel" },
  { href: "/admin/aparencia", label: "Aparência", description: "Cores, fontes e cards", icon: "palette", group: "Experiência", keywords: "tema identidade visual layout" },
  { href: "/admin/navegacao", label: "Menus e redes", description: "Cabeçalho, mobile e footer", icon: "navigation", group: "Experiência", keywords: "instagram tiktok shopee whatsapp links" },
  { href: "/admin/paginas", label: "Páginas", description: "Conteúdos extras", icon: "text", group: "Experiência", keywords: "sobre privacidade conteúdo" },
  { href: "/admin/analytics", label: "Analytics", description: "Cliques, visitas e buscas", icon: "chart", group: "Inteligência", keywords: "dados desempenho pesquisa" },
  { href: "/admin/configuracoes", label: "Configurações e SEO", description: "Marca e compartilhamento", icon: "settings", group: "Inteligência", keywords: "logo favicon google seo" },
];

const groups: Group[] = ["Operação", "Catálogo", "Experiência", "Inteligência"];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => { setMobileOpen(false); setCommandOpen(false); setCommandQuery(""); }, [pathname]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((current) => !current); }
      if (event.key === "Escape") { setCommandOpen(false); setMobileOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function activeRoute(href: string) {
    if (href === "/admin") return pathname === href;
    if (href === "/admin/produtos") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const activeItem = useMemo(() => navItems.find((item) => activeRoute(item.href)) || navItems[0], [pathname]);
  const commandResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => `${item.label} ${item.description} ${item.keywords || ""}`.toLowerCase().includes(query));
  }, [commandQuery]);
  const mobilePrimary = ["/admin", "/admin/produtos", "/admin/categorias", "/admin/editor"].map((href) => navItems.find((item) => item.href === href)!).filter(Boolean);

  async function logout() { const supabase = getBrowserSupabase(); await supabase?.auth.signOut(); router.replace("/admin/login"); }

  if (!ready) return <div className="studio-loading"><span className="studio-loading-mark">H&S</span><strong>Abrindo o Studio...</strong></div>;
  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  return <div className="studio-shell studio-shell-v8">
    <aside className="studio-sidebar">
      <Link className="studio-brand" href="/admin">
        <span><img src={brand.logo} alt="" /></span>
        <div><strong>{brand.name}</strong><small>H&S Control Studio</small></div>
      </Link>

      <button className="studio-command-trigger-v8" onClick={() => setCommandOpen(true)}><span><Icon name="search" size={17} />Buscar no painel</span><kbd>Ctrl K</kbd></button>

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
      <header className="studio-topbar studio-topbar-v8">
        <button className="studio-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <div className="studio-page-context"><small>{activeItem.group}</small><strong>{activeItem.label}</strong></div>
        <button className="studio-top-search-v8" onClick={() => setCommandOpen(true)}><Icon name="search" size={17} /><span>Buscar função...</span></button>
        <div className="studio-topbar-actions">
          <Link className={`studio-live-status ${brand.maintenance ? "paused" : ""}`} href="/admin/controle"><i />{brand.maintenance ? "Site em manutenção" : "Site publicado"}</Link>
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
      <aside className="studio-mobile-sheet studio-mobile-sheet-v8" onMouseDown={(event) => event.stopPropagation()}>
        <div className="studio-mobile-handle" />
        <div className="studio-mobile-head"><div><small>H&S CONTROL STUDIO</small><strong>Controle completo</strong></div><button onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
        <button className="studio-mobile-search-v8" onClick={() => { setMobileOpen(false); setCommandOpen(true); }}><Icon name="search" />Buscar função no painel</button>
        <div className="studio-mobile-links">{navItems.map((item) => <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /><b>{item.label}</b></span><Icon name="arrow" size={16} /></Link>)}</div>
        <div className="studio-mobile-actions"><Link href="/" target="_blank"><Icon name="external" />Abrir site</Link><button onClick={() => void logout()}><Icon name="logout" />Sair</button></div>
      </aside>
    </div> : null}

    {commandOpen ? <div className="command-backdrop-v8" onMouseDown={() => setCommandOpen(false)}>
      <section className="command-palette-v8" onMouseDown={(event) => event.stopPropagation()}>
        <header><Icon name="search" /><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Digite o que deseja editar..." /><button onClick={() => setCommandOpen(false)}>ESC</button></header>
        <div>{commandResults.map((item) => <Link href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div><Icon name="arrow" size={16} /></Link>)}{!commandResults.length ? <div className="command-empty-v8">Nenhuma função encontrada.</div> : null}</div>
        <footer><span><b>↑↓</b> navegar</span><span><b>Enter</b> abrir</span><span><b>Esc</b> fechar</span></footer>
      </section>
    </div> : null}
  </div>;
}

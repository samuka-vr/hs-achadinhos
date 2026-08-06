"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type Area = "Principal" | "Catálogo" | "Site" | "Resultados" | "Sistema";
type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
  area: Area;
  keywords: string;
  mobile?: boolean;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Visão geral", description: "Pendências e atalhos", icon: "home", area: "Principal", keywords: "início dashboard resumo tarefas", mobile: true },
  { href: "/admin/produtos", label: "Produtos", description: "Cadastro, fotos, preços e links", icon: "products", area: "Catálogo", keywords: "produto foto preço link publicar rascunho", mobile: true },
  { href: "/admin/produtos/importar", label: "Importação", description: "Cadastre vários produtos de uma vez", icon: "code", area: "Catálogo", keywords: "importar lote massa colar lista" },
  { href: "/admin/categorias", label: "Categorias", description: "Grupos e nomes alternativos", icon: "categories", area: "Catálogo", keywords: "categoria alias imagem ordem" },
  { href: "/admin/midia", label: "Biblioteca de imagens", description: "Uploads e arquivos do site", icon: "media", area: "Catálogo", keywords: "imagem mídia storage upload" },
  { href: "/admin/editor", label: "Página inicial", description: "Seções, títulos e ordem da home", icon: "layout", area: "Site", keywords: "home hero carrossel seções" },
  { href: "/admin/banners", label: "Banners", description: "Campanhas, imagens e chamadas", icon: "banner", area: "Site", keywords: "banner campanha destaque anúncio" },
  { href: "/admin/navegacao", label: "Menus e redes", description: "Links públicos e redes sociais", icon: "navigation", area: "Site", keywords: "menu instagram tiktok shopee whatsapp" },
  { href: "/admin/paginas", label: "Páginas", description: "Sobre, privacidade e conteúdo", icon: "text", area: "Site", keywords: "páginas sobre termos privacidade" },
  { href: "/admin/aparencia", label: "Aparência do site", description: "Cores, botões, fontes e cards", icon: "palette", area: "Site", keywords: "tema cor botão fonte visual", mobile: true },
  { href: "/admin/analytics", label: "Analytics", description: "Visitas, cliques e desempenho", icon: "chart", area: "Resultados", keywords: "analytics métricas visitas cliques" },
  { href: "/admin/buscas", label: "Buscas sem resultado", description: "Termos pesquisados e limpeza", icon: "search", area: "Resultados", keywords: "pesquisa sem resultado excluir palavras termos" },
  { href: "/admin/controle", label: "Central de controle", description: "Publicação, manutenção e cópias", icon: "shield", area: "Sistema", keywords: "controle manutenção backup exportar" },
  { href: "/admin/atividade", label: "Histórico", description: "Alterações feitas no painel", icon: "calendar", area: "Sistema", keywords: "atividade histórico auditoria logs" },
  { href: "/admin/configuracoes", label: "Configurações gerais", description: "Marca, domínio, SEO e contato", icon: "settings", area: "Sistema", keywords: "configuração seo domínio logo contato" },
];

const areas: Area[] = ["Principal", "Catálogo", "Site", "Resultados", "Sistema"];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [brand, setBrand] = useState({ name: "H&S Achadinhos", logo: "/brand/hs-monogram.svg", email: "", maintenance: false });

  useEffect(() => {
    const stored = window.localStorage.getItem("hs-admin-sidebar-collapsed");
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hs-admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Configure as variáveis do Supabase para abrir o painel.");
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

      const [{ data: profile, error: profileError }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("site_settings").select("key,value").in("key", ["site_name", "logo_url", "maintenance_mode"]),
      ]);

      if (!active) return;
      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=unauthorized");
        return;
      }

      const values = Object.fromEntries((settings ?? []).map((item) => [item.key, item.value]));
      setBrand({
        name: String(values.site_name || "H&S Achadinhos"),
        logo: String(values.logo_url || "/brand/hs-monogram.svg"),
        email: user.email || "",
        maintenance: Boolean(values.maintenance_mode),
      });
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    setDrawerOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen && !commandOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [commandOpen, drawerOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (commandOpen) window.setTimeout(() => searchInputRef.current?.focus(), 30);
  }, [commandOpen]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === href;
    if (href === "/admin/produtos") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const current = useMemo(() => navItems.find((item) => isActive(item.href)) || navItems[0], [pathname]);
  const searchResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(query));
  }, [commandQuery]);
  const mobileItems = navItems.filter((item) => item.mobile).slice(0, 4);

  function openCommand() {
    setDrawerOpen(false);
    setCommandOpen(true);
  }

  async function logout() {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) {
    return <div className="hs-admin-loading"><span><img src="/brand/hs-monogram.svg" alt="" /></span><div><strong>Abrindo o H&S Studio</strong><small>Carregando suas ferramentas...</small></div></div>;
  }

  if (error) return <main className="hs-admin-error"><div>{error}</div></main>;

  return <div className={`hs-admin-shell ${collapsed ? "is-collapsed" : ""}`}>
    <aside className="hs-admin-sidebar">
      <div className="hs-admin-sidebar__top">
        <Link className="hs-admin-brand" href="/admin" aria-label="Ir para a visão geral">
          <span><img src={brand.logo} alt="" /></span>
          <div><strong>{brand.name}</strong><small>H&S Studio</small></div>
        </Link>
        <button className="hs-admin-collapse" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
          <Icon name={collapsed ? "arrow" : "menu"} size={18} />
        </button>
      </div>

      <button className="hs-admin-command-trigger" type="button" onClick={openCommand}>
        <Icon name="search" size={18} />
        <span>Buscar no painel</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="hs-admin-nav" aria-label="Painel administrativo">
        {areas.map((area) => {
          const items = navItems.filter((item) => item.area === area);
          if (!items.length) return null;
          return <section key={area}>
            <small>{area}</small>
            {items.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href} title={collapsed ? item.label : undefined}>
              <span><Icon name={item.icon} size={19} /></span>
              <div><b>{item.label}</b><em>{item.description}</em></div>
              {isActive(item.href) ? <i /> : null}
            </Link>)}
          </section>;
        })}
      </nav>

      <div className="hs-admin-account">
        <span>{brand.email.slice(0, 1).toUpperCase() || "A"}</span>
        <div><strong>Administrador</strong><small>{brand.email || "Conta principal"}</small></div>
        <button type="button" onClick={() => void logout()} aria-label="Sair"><Icon name="logout" size={18} /></button>
      </div>
    </aside>

    <section className="hs-admin-workspace">
      <header className="hs-admin-topbar">
        <button className="hs-admin-mobile-menu" type="button" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <div className="hs-admin-page-heading">
          <span>{current.area}</span>
          <strong>{current.label}</strong>
          <small>{current.description}</small>
        </div>
        <button className="hs-admin-top-search" type="button" onClick={openCommand}><Icon name="search" size={17} /><span>Buscar função</span></button>
        <div className="hs-admin-top-actions">
          <Link className={`hs-admin-status ${brand.maintenance ? "is-paused" : ""}`} href="/admin/controle"><i />{brand.maintenance ? "Manutenção" : "Site publicado"}</Link>
          <Link className="hs-admin-preview" href="/" target="_blank"><Icon name="eye" size={18} /><span>Ver site</span></Link>
        </div>
      </header>
      <main className="hs-admin-main">{children}</main>
    </section>

    <nav className="hs-admin-bottom-nav" aria-label="Navegação rápida">
      {mobileItems.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /></span><b>{item.label.split(" ")[0]}</b></Link>)}
      <button type="button" onClick={() => setDrawerOpen(true)} className={drawerOpen ? "active" : ""}><span><Icon name="more" /></span><b>Mais</b></button>
    </nav>

    {drawerOpen ? <div className="hs-admin-drawer-layer" onMouseDown={() => setDrawerOpen(false)}>
      <aside className="hs-admin-drawer" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Menu administrativo">
        <div className="hs-admin-drawer__handle" />
        <header><div><span>H&S STUDIO</span><strong>O que deseja administrar?</strong></div><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar"><Icon name="close" /></button></header>
        <button className="hs-admin-drawer__search" type="button" onClick={openCommand}><Icon name="search" />Buscar função</button>
        <nav>{areas.map((area) => <section key={area}><small>{area}</small>{navItems.filter((item) => item.area === area).map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><b>{item.label}</b><small>{item.description}</small></div><Icon name="arrow" size={15} /></Link>)}</section>)}</nav>
        <footer><Link href="/" target="_blank"><Icon name="external" />Abrir site</Link><button type="button" onClick={() => void logout()}><Icon name="logout" />Sair</button></footer>
      </aside>
    </div> : null}

    {commandOpen ? <div className="hs-admin-command-layer" onMouseDown={() => setCommandOpen(false)}>
      <section className="hs-admin-command" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Buscar função no painel">
        <header><Icon name="search" /><input ref={searchInputRef} value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Ex.: trocar cores, importar produtos..." /><button type="button" onClick={() => setCommandOpen(false)}>ESC</button></header>
        <div>{searchResults.map((item) => <Link href={item.href} key={item.href}><span><Icon name={item.icon} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div><em>{item.area}</em><Icon name="arrow" size={16} /></Link>)}{!searchResults.length ? <div className="hs-admin-command__empty"><Icon name="search" size={28} /><strong>Nenhuma função encontrada</strong><small>Tente palavras como produto, cor, busca ou banner.</small></div> : null}</div>
      </section>
    </div> : null}
  </div>;
}

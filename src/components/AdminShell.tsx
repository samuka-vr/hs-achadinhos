"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "./Icon";

type Group = "Começo" | "Catálogo" | "Conteúdo" | "Crescimento" | "Sistema";
type NavItem = { href: string; label: string; description: string; icon: IconName; group: Group; keywords?: string };

const navItems: NavItem[] = [
  { href: "/admin", label: "Visão geral", description: "Prioridades e atalhos", icon: "home", group: "Começo", keywords: "dashboard início métricas tarefas" },

  { href: "/admin/produtos", label: "Produtos", description: "Catálogo, imagens e preços", icon: "products", group: "Catálogo", keywords: "rascunho publicar preço link foto" },
  { href: "/admin/produtos/importar", label: "Importar produtos", description: "Cadastre vários de uma vez", icon: "code", group: "Catálogo", keywords: "massa lista colar lote" },
  { href: "/admin/categorias", label: "Categorias", description: "Principais e nomes alternativos", icon: "categories", group: "Catálogo", keywords: "mapear grupo imagem alias" },
  { href: "/admin/midia", label: "Biblioteca de mídia", description: "Imagens e arquivos do site", icon: "media", group: "Catálogo", keywords: "arquivo upload storage capa" },

  { href: "/admin/editor", label: "Página inicial", description: "Seções, textos e ordem", icon: "layout", group: "Conteúdo", keywords: "home seção vitrine carrossel" },
  { href: "/admin/banners", label: "Banners", description: "Campanhas e destaques", icon: "banner", group: "Conteúdo", keywords: "slider anúncio campanha" },
  { href: "/admin/navegacao", label: "Menus e redes", description: "Cabeçalho, mobile e footer", icon: "navigation", group: "Conteúdo", keywords: "instagram tiktok shopee whatsapp links" },
  { href: "/admin/paginas", label: "Páginas", description: "Sobre, políticas e textos", icon: "text", group: "Conteúdo", keywords: "sobre privacidade conteúdo termos" },

  { href: "/admin/aparencia", label: "Aparência", description: "Marca, cores e componentes", icon: "palette", group: "Crescimento", keywords: "tema identidade visual layout logo" },
  { href: "/admin/analytics", label: "Analytics", description: "Cliques, visitas e buscas", icon: "chart", group: "Crescimento", keywords: "dados desempenho pesquisa" },

  { href: "/admin/controle", label: "Central de controle", description: "Publicação, catálogo e backup", icon: "shield", group: "Sistema", keywords: "manutenção reset backup exportar publicar" },
  { href: "/admin/atividade", label: "Histórico", description: "Alterações feitas no painel", icon: "calendar", group: "Sistema", keywords: "logs auditoria segurança" },
  { href: "/admin/configuracoes", label: "Configurações e SEO", description: "Marca, domínio e compartilhamento", icon: "settings", group: "Sistema", keywords: "favicon google seo domínio" },
];

const groups: Group[] = ["Começo", "Catálogo", "Conteúdo", "Crescimento", "Sistema"];

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
    if (!supabase) {
      setError("Configure as variáveis do Supabase.");
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

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("site_settings").select("key,value").in("key", ["site_name", "logo_url", "maintenance_mode"]),
      ]);

      if (!active) return;
      if (profile?.role !== "admin") {
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

    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobileOpen(false);
      }
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
  const mobilePrimary = ["/admin", "/admin/produtos", "/admin/categorias", "/admin/editor"]
    .map((href) => navItems.find((item) => item.href === href)!)
    .filter(Boolean);

  async function logout() {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="studio-loading">
        <span className="studio-loading-mark">H&S</span>
        <div><strong>Abrindo o Ateliê</strong><small>Organizando suas ferramentas...</small></div>
      </div>
    );
  }

  if (error) return <main className="page"><div className="container"><div className="error">{error}</div></div></main>;

  return (
    <div className="studio-shell studio-shell-v8 atelier-shell">
      <aside className="studio-sidebar atelier-sidebar">
        <div className="atelier-sidebar-accent" aria-hidden="true" />

        <Link className="studio-brand atelier-brand" href="/admin">
          <span><img src={brand.logo} alt="" /></span>
          <div><strong>{brand.name}</strong><small>Ateliê de conteúdo</small></div>
        </Link>

        <button className="studio-command-trigger-v8 atelier-command" onClick={() => setCommandOpen(true)}>
          <span><Icon name="search" size={17} />Encontrar uma função</span>
          <kbd>⌘ K</kbd>
        </button>

        <nav className="studio-navigation atelier-navigation" aria-label="Painel administrativo">
          {groups.map((group, groupIndex) => (
            <section key={group}>
              <small><b>{String(groupIndex + 1).padStart(2, "0")}</b>{group}</small>
              {navItems.filter((item) => item.group === group).map((item) => (
                <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}>
                  <span className="studio-nav-icon"><Icon name={item.icon} /></span>
                  <span><b>{item.label}</b><em>{item.description}</em></span>
                  <i />
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="studio-account atelier-account">
          <span>{brand.email.slice(0, 1).toUpperCase() || "A"}</span>
          <div><strong>Conta principal</strong><small>{brand.email || "Administrador"}</small></div>
          <button onClick={() => void logout()} aria-label="Sair"><Icon name="logout" size={18} /></button>
        </div>
      </aside>

      <div className="studio-workspace atelier-workspace">
        <header className="studio-topbar studio-topbar-v8 atelier-topbar">
          <button className="studio-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
          <div className="studio-page-context atelier-page-context">
            <small>{activeItem.group}</small>
            <strong>{activeItem.label}</strong>
            <span>{activeItem.description}</span>
          </div>
          <button className="studio-top-search-v8 atelier-top-search" onClick={() => setCommandOpen(true)}>
            <Icon name="search" size={17} /><span>Buscar no painel</span><kbd>Ctrl K</kbd>
          </button>
          <div className="studio-topbar-actions atelier-top-actions">
            <Link className={`studio-live-status ${brand.maintenance ? "paused" : ""}`} href="/admin/controle">
              <i />{brand.maintenance ? "Em manutenção" : "Site publicado"}
            </Link>
            <Link className="atelier-view-site" href="/" target="_blank"><Icon name="eye" size={18} /><span>Ver site</span></Link>
          </div>
        </header>

        <main className="studio-main atelier-main">
          <div className="atelier-main-marker" aria-hidden="true"><span>H&S</span></div>
          {children}
        </main>
      </div>

      <nav className="studio-bottom-nav atelier-bottom-nav">
        {mobilePrimary.map((item) => (
          <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}>
            <span><Icon name={item.icon} /></span>
            <b>{item.label.split(" ")[0]}</b>
          </Link>
        ))}
        <button className={mobileOpen ? "active" : ""} onClick={() => setMobileOpen(true)}>
          <span><Icon name="more" /></span><b>Mais</b>
        </button>
      </nav>

      {mobileOpen ? (
        <div className="studio-mobile-backdrop" onMouseDown={() => setMobileOpen(false)}>
          <aside className="studio-mobile-sheet studio-mobile-sheet-v8 atelier-mobile-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="studio-mobile-handle" />
            <div className="studio-mobile-head">
              <div><small>ATELIÊ H&S</small><strong>O que deseja editar?</strong></div>
              <button onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
            </div>
            <button className="studio-mobile-search-v8" onClick={() => { setMobileOpen(false); setCommandOpen(true); }}>
              <Icon name="search" />Buscar função no painel
            </button>
            <div className="studio-mobile-links">
              {navItems.map((item) => (
                <Link className={activeRoute(item.href) ? "active" : ""} href={item.href} key={item.href}>
                  <span><Icon name={item.icon} /><span><b>{item.label}</b><small>{item.description}</small></span></span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
            </div>
            <div className="studio-mobile-actions">
              <Link href="/" target="_blank"><Icon name="external" />Abrir site</Link>
              <button onClick={() => void logout()}><Icon name="logout" />Sair</button>
            </div>
          </aside>
        </div>
      ) : null}

      {commandOpen ? (
        <div className="command-backdrop-v8" onMouseDown={() => setCommandOpen(false)}>
          <section className="command-palette-v8 atelier-command-palette" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <Icon name="search" />
              <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Digite o que deseja editar..." />
              <button onClick={() => setCommandOpen(false)}>ESC</button>
            </header>
            <div>
              {commandResults.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span><Icon name={item.icon} /></span>
                  <div><strong>{item.label}</strong><small>{item.description}</small></div>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
              {!commandResults.length ? <div className="command-empty-v8">Nenhuma função encontrada.</div> : null}
            </div>
            <footer><span><b>↑↓</b> navegar</span><span><b>Enter</b> abrir</span><span><b>Esc</b> fechar</span></footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";
export default function NotFound() { return <main className="page"><div className="container"><div className="empty"><h1>Página não encontrada</h1><p>O conteúdo pode ter sido removido ou desativado.</p><div style={{ marginTop: 18 }}><Link className="button" href="/">Voltar ao início</Link></div></div></div></main>; }

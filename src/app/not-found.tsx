import Link from "next/link";
import Icon from "@/components/Icon";

export default function NotFound() {
  return <main className="hs-system-page"><section><span><Icon name="search" size={34} /></span><small>ERRO 404</small><h1>Essa página não está por aqui.</h1><p>O conteúdo pode ter sido removido, renomeado ou desativado.</p><Link href="/">Voltar ao início <Icon name="arrow" size={16} /></Link></section></main>;
}

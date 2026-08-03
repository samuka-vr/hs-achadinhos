import Link from "next/link";
import SearchBox from "./SearchBox";

export default function Header({ siteName = "H&S Achadinhos" }: { siteName?: string }) {
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand" href="/" aria-label={`${siteName} - início`}>
          <span className="brand-mark">H&S</span>
          <span>{siteName}</span>
        </Link>
        <SearchBox />
        <nav className="header-links" aria-label="Navegação principal">
          <Link href="/#categorias">Categorias</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/admin/login">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

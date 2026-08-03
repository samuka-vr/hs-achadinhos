import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, emptyTitle = "Nenhum produto encontrado" }: { products: Product[]; emptyTitle?: string }) {
  if (!products.length) {
    return <div className="empty"><h3>{emptyTitle}</h3><p>Cadastre novos produtos no painel administrativo.</p></div>;
  }
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

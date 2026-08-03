import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Icon from "./Icon";

export default function ProductGrid({ products, emptyTitle = "Nenhum produto encontrado" }: { products: Product[]; emptyTitle?: string }) {
  if (!products.length) return <div className="empty"><Icon name="products" size={32} /><h3>{emptyTitle}</h3><p>Ainda não tem produto aqui.</p></div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

import type { CSSProperties } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Icon from "./Icon";

export default function ProductGrid({
  products,
  columns,
  emptyTitle = "Nenhum produto por aqui",
}: {
  products: Product[];
  columns?: number;
  emptyTitle?: string;
}) {
  if (!products.length) {
    return <div className="hs-empty-state"><span><Icon name="products" /></span><strong>{emptyTitle}</strong><p>Assim que novos achados forem publicados, eles aparecem aqui.</p></div>;
  }
  return (
    <div className="hs-product-grid" style={{ "--grid-columns": columns || undefined } as CSSProperties}>
      {products.map((product) => <ProductCard product={product} key={product.id} />)}
    </div>
  );
}

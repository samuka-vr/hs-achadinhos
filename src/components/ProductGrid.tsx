import type { CSSProperties } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Icon from "./Icon";
export default function ProductGrid({products,emptyTitle="Nenhum produto encontrado",className="",columns}:{products:Product[];emptyTitle?:string;className?:string;columns?:number}){if(!products.length)return <div className="empty-v5"><Icon name="products" size={32}/><h3>{emptyTitle}</h3><p>Ainda não tem produto aqui.</p></div>;const style=columns?{"--section-columns":Math.max(1,Math.min(6,columns))} as CSSProperties:undefined;return <div className={`product-grid-v5 ${className}`} style={style}>{products.map((p)=><ProductCard key={p.id} product={p}/>)}</div>}

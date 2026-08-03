import Icon from "@/components/Icon";
import ProductGrid from "@/components/ProductGrid";
import SearchBox from "@/components/SearchBox";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { normalizeSearch } from "@/lib/utils";
export const dynamic="force-dynamic";type Props={searchParams:Promise<{q?:string}>};
export default async function SearchPage({searchParams}:Props){const{q=""}=await searchParams;const normalized=normalizeSearch(q);const supabase=getServerSupabase();const{data}=supabase?await supabase.from("products").select("*,categories(id,name,slug)").eq("is_active",true).limit(1000):{data:[]};const products=((data??[]) as Product[]).filter((p)=>normalizeSearch([p.name,p.product_code||"",p.short_description||"",p.categories?.name||"",...(p.tags||[])].join(" ")).includes(normalized)&&normalized.length>0);return <main className="search-page-v5"><div className="container-v5"><section className="search-hero-v5"><Icon name="search" size={30}/><div><span>BUSCA</span><h1>{q?`Resultados para “${q}”`:"Encontre um produto"}</h1><p>{q?`${products.length} produto(s) encontrado(s).`:"Digite o nome ou o código que apareceu no vídeo."}</p></div><SearchBox variant="hero"/></section><section className="section-v5"><ProductGrid products={products} emptyTitle="Nenhum produto encontrado"/></section></div></main>}

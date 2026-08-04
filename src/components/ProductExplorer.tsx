"use client";
import { useMemo,useState } from "react";
import type { Category,Product } from "@/lib/types";
import { normalizeSearch } from "@/lib/utils";
import ProductGrid from "./ProductGrid";
import Icon from "./Icon";

export default function ProductExplorer({products,categories,pageSize,showSearch=true}:{products:Product[];categories:Category[];pageSize:number;showSearch?:boolean}){
  const[category,setCategory]=useState("all");
  const[sort,setSort]=useState("recent");
  const[term,setTerm]=useState("");
  const[visible,setVisible]=useState(pageSize);
  const filtered=useMemo(()=>{
    const normalized=normalizeSearch(term);
    const list=products.filter((p)=>{
      const matchCategory=category==="all"||p.category_id===category;
      const text=normalizeSearch([p.name,p.product_code||"",p.short_description||"",p.categories?.name||"",...(p.tags||[])].join(" "));
      return matchCategory&&(!normalized||text.includes(normalized));
    });
    switch(sort){
      case"popular":return list.sort((a,b)=>b.click_count-a.click_count);
      case"price-low":return list.sort((a,b)=>(a.current_price??Number.MAX_SAFE_INTEGER)-(b.current_price??Number.MAX_SAFE_INTEGER));
      case"price-high":return list.sort((a,b)=>(b.current_price??-1)-(a.current_price??-1));
      default:return list.sort((a,b)=>Number(b.is_pinned)-Number(a.is_pinned)||new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
    }
  },[products,category,sort,term]);

  return <>
    <div className={`catalog-toolbar-v5 ${showSearch?"":"without-search"}`}>
      {showSearch?<div><Icon name="search"/><input value={term} onChange={(e)=>{setTerm(e.target.value);setVisible(pageSize)}} placeholder="Filtrar por nome ou código"/></div>:null}
      <select value={sort} onChange={(e)=>setSort(e.target.value)} aria-label="Ordenar produtos"><option value="recent">Mais recentes</option><option value="popular">Mais acessados</option><option value="price-low">Menor preço</option><option value="price-high">Maior preço</option></select>
    </div>
    <div className="catalog-tabs-v5"><button className={category==="all"?"active":""} onClick={()=>{setCategory("all");setVisible(pageSize)}}>Todos</button>{categories.map((c)=><button key={c.id} className={category===c.id?"active":""} onClick={()=>{setCategory(c.id);setVisible(pageSize)}}>{c.icon?<span>{c.icon}</span>:null}{c.name}</button>)}</div>
    <div className="catalog-count-v5"><strong>{filtered.length}</strong> produto(s)</div>
    <ProductGrid products={filtered.slice(0,visible)}/>
    {visible<filtered.length?<div className="load-more-v5"><button onClick={()=>setVisible((x)=>x+pageSize)}>Mostrar mais</button></div>:null}
  </>;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatPrice, normalizeSearch } from "@/lib/utils";
import Icon from "./Icon";

type SearchItem={id:string;name:string;slug:string;image_url:string|null;current_price:number|null;product_code?:string|null;type:"product"|"category"};
export default function SearchBox({variant="header"}:{variant?:"header"|"hero"}){
 const router=useRouter();const pathname=usePathname();const boxRef=useRef<HTMLDivElement>(null);const[term,setTerm]=useState("");const[catalog,setCatalog]=useState<SearchItem[]>([]);const[open,setOpen]=useState(false);const[loaded,setLoaded]=useState(false);
 useEffect(()=>{setTerm("");setOpen(false);},[pathname]);useEffect(()=>{const onDown=(event:MouseEvent)=>{if(!boxRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("mousedown",onDown);return()=>document.removeEventListener("mousedown",onDown);},[]);
 async function loadCatalog(){if(loaded)return;setLoaded(true);const supabase=getBrowserSupabase();if(!supabase)return;const[p,c]=await Promise.all([supabase.from("products").select("id,name,slug,image_url,current_price,product_code").eq("is_active",true).limit(1000),supabase.from("categories").select("id,name,slug,image_url").eq("is_active",true).order("sort_order").limit(200)]);setCatalog([...(p.data??[]).map((x)=>({...x,type:"product" as const})),...(c.data??[]).map((x)=>({...x,current_price:null,product_code:null,type:"category" as const}))]);}
 const results=useMemo(()=>{const normalized=normalizeSearch(term);if(normalized.length<2)return[];return catalog.filter((item)=>normalizeSearch(`${item.name} ${item.product_code||""}`).includes(normalized)).slice(0,8);},[catalog,term]);
 async function track(value:string,count:number){const supabase=getBrowserSupabase();if(!supabase)return;await supabase.rpc("register_search_event",{p_query:value,p_results_count:count,p_referrer:document.referrer||null,p_user_agent:navigator.userAgent});}
 function submit(event:FormEvent){event.preventDefault();const value=term.trim();if(!value)return;void track(value,results.length);setOpen(false);router.push(`/busca?q=${encodeURIComponent(value)}`);}
 return <div className={`search-wrap-v5 ${variant}`} ref={boxRef}><form role="search" onSubmit={submit}><Icon name="search" className="search-leading-icon-v5" size={20}/><input value={term} onChange={(e)=>{setTerm(e.target.value);setOpen(true)}} onFocus={()=>{void loadCatalog();setOpen(true)}} placeholder={variant==="hero"?"Digite o nome ou o código do produto":"Buscar produto ou código"} aria-label="Buscar produtos" autoComplete="off"/><button type="submit">Buscar</button></form>{open&&term.trim().length>=2?<div className="suggestions-v5"><div className="suggestions-title-v5"><span>Resultados</span><small>{results.length}</small></div>{results.length?results.map((item)=><Link key={`${item.type}-${item.id}`} href={item.type==="product"?`/produto/${item.slug}`:`/categoria/${item.slug}`} onClick={()=>{void track(term,results.length);setOpen(false)}}>{item.image_url?<img src={item.image_url} alt=""/>:<span><Icon name={item.type==="product"?"products":"categories"}/></span>}<div><strong>{item.name}</strong><small>{item.type==="product"?(item.product_code?`Código ${item.product_code} • `:"")+(formatPrice(item.current_price)||"Ver produto"):"Ver categoria"}</small></div><Icon name="arrow" size={17}/></Link>):<div className="suggestion-empty-v5"><Icon name="search"/><strong>Nada encontrado</strong><small>Tente outro nome ou confira o código.</small></div>}</div>:null}</div>;
}

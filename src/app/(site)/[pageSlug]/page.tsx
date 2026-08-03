import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ContentPage } from "@/lib/types";

type Props={params:Promise<{pageSlug:string}>};
export const dynamic="force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const{pageSlug}=await params;const supabase=getServerSupabase();if(!supabase)return{};const{data}=await supabase.from("content_pages").select("title,subtitle,seo_title,seo_description,image_url").eq("slug",pageSlug).eq("is_published",true).maybeSingle();if(!data)return{};return{title:data.seo_title||data.title,description:data.seo_description||data.subtitle,openGraph:{title:data.seo_title||data.title,description:data.seo_description||data.subtitle,images:data.image_url?[data.image_url]:[]}};}
export default async function ContentPageRoute({params}:Props){const{pageSlug}=await params;const supabase=getServerSupabase();if(!supabase)notFound();const{data}=await supabase.from("content_pages").select("*").eq("slug",pageSlug).eq("is_published",true).maybeSingle();if(!data)notFound();const page=data as ContentPage;const paragraphs=page.body.split(/\n\s*\n/).filter(Boolean);return <main className="content-page-v5"><div className="container-v5"><nav className="breadcrumbs-v5"><Link href="/">Início</Link><span>›</span><strong>{page.title}</strong></nav><article className={`content-page-card-v5 ${page.image_url?"has-image":""}`}><div className="content-page-copy-v5">{page.eyebrow?<span>{page.eyebrow}</span>:null}<h1>{page.title}</h1>{page.subtitle?<p className="content-page-lead-v5">{page.subtitle}</p>:null}<div className="content-page-body-v5">{paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>{page.button_text&&page.button_url?<a className="button-v5" href={page.button_url}>{page.button_text}<Icon name="arrow" size={17}/></a>:null}</div>{page.image_url?<div className="content-page-image-v5"><img src={page.image_url} alt=""/></div>:null}</article></div></main>;}

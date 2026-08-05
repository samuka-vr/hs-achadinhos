import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ContentPage } from "@/lib/types";
import { isSafePublicUrl, safePublicHref } from "@/lib/security";

type Props = { params: Promise<{ pageSlug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageSlug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) return {};
  const { data } = await supabase.from("content_pages").select("title,subtitle,seo_title,seo_description,image_url").eq("slug", pageSlug).eq("is_published", true).maybeSingle();
  if (!data) return {};
  return { title: data.seo_title || data.title, description: data.seo_description || data.subtitle, openGraph: { title: data.seo_title || data.title, description: data.seo_description || data.subtitle, images: data.image_url ? [data.image_url] : [] } };
}

export default async function ContentPageRoute({ params }: Props) {
  const { pageSlug } = await params;
  const supabase = getServerSupabase();
  if (!supabase) notFound();
  const { data } = await supabase.from("content_pages").select("*").eq("slug", pageSlug).eq("is_published", true).maybeSingle();
  if (!data) notFound();
  const page = data as ContentPage;
  const paragraphs = page.body.split(/\n\s*\n/).filter(Boolean);
  return <main className="hs-inner-page"><div className="hs-shell">
    <nav className="hs-breadcrumbs"><Link href="/">Início</Link><Icon name="arrow" size={13} /><strong>{page.title}</strong></nav>
    <article className={`hs-content-page ${page.image_url ? "has-image" : ""}`}>
      <div className="hs-content-page__copy">{page.eyebrow ? <span>{page.eyebrow}</span> : null}<h1>{page.title}</h1>{page.subtitle ? <p className="hs-content-page__lead">{page.subtitle}</p> : null}<div className="hs-content-page__body">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{page.button_text && isSafePublicUrl(page.button_url) ? <a className="hs-primary-button" href={safePublicHref(page.button_url)}>{page.button_text}<Icon name="arrow" size={16} /></a> : null}</div>
      {page.image_url ? <div className="hs-content-page__image"><img src={page.image_url} alt="" /></div> : null}
    </article>
  </div></main>;
}

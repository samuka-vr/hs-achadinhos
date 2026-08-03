import Link from "next/link";
import type { Category, NavigationItem, SiteSettings } from "@/lib/types";
import SearchBox from "./SearchBox";
import Icon, { type IconName } from "./Icon";
import MobileMenu from "./MobileMenu";

export default function Header({settings,categories,navigation}:{settings:SiteSettings;categories:Category[];navigation:NavigationItem[]}){
 const headerItems=navigation.filter((item)=>item.location==="header"&&item.is_active).sort((a,b)=>a.sort_order-b.sort_order);
 return <>{settings.announcement_enabled&&settings.announcement_text?<div className="announcement-v5"><a href={settings.announcement_url||"#produtos"}>{settings.announcement_text}<Icon name="arrow" size={15}/></a></div>:null}<header className={`site-header-v5 style-${settings.header_style} ${settings.sticky_header?"sticky":""}`}><div className="container-v5 header-row-v5"><Link className="brand-v5" href="/"><img src={settings.logo_url||"/brand/hs-logo.png"} alt={`Logo ${settings.site_name}`}/><span><strong>{settings.site_name}</strong><small>{settings.header_tagline}</small></span></Link>{settings.show_header_search?<div className="header-search-v5"><SearchBox/></div>:null}<nav className="desktop-nav-v5">{headerItems.length?headerItems.map((item)=><Link href={item.url} key={item.id} target={item.open_new_tab?"_blank":undefined}><Icon name={(item.icon||"link") as IconName} size={15}/>{item.label}</Link>):<><Link href="/#produtos-dos-videos">Dos vídeos</Link><Link href="/#categorias">Categorias</Link><Link href="/#produtos">Produtos</Link></>}</nav><div className="header-actions-v5">{settings.instagram?<a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram"/></a>:null}<MobileMenu categories={categories} settings={settings} navigation={navigation}/></div></div></header></>;
}

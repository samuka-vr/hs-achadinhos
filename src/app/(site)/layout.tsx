import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSettings } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = getServerSupabase();
  const settingsResult = supabase ? await supabase.from("site_settings").select("key,value") : { data: null };
  const settings = parseSettings(settingsResult.data);
  return <><Header siteName={settings.site_name} />{children}<Footer settings={settings} /></>;
}

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tc = await getTranslations("Common");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle()
    : { data: null };

  const initialProfile = {
    name:
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "",
    email: user?.email || "",
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || "",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-2xl">{tc("skipToContent")}</a>
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header initialProfile={initialProfile} />
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

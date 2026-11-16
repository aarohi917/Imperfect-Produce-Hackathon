import { Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useT, useLang } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, BarChart3, Camera, ClipboardCheck, HeartHandshake, Bell, LogOut, ScanLine, MapPinned } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, roleLabel } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SettingsControl } from "@/components/SettingsControl";
import { SettingsSync } from "@/components/SettingsSync";
import { Brand } from "@/components/Brand";

export function AppShell() {
  const lang = useLang();
  const t = useT();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const uid = me?.user.id;

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", uid],
    enabled: !!uid,
    refetchInterval:60000,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ["unread"] });
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  const nav = [
    ...(me?.isManagement ? [{ to: "/dashboard", label: t("数据", "Insights"), icon: BarChart3 }] : [{to:"/overview",label:t("概览","Overview","अवलोकन","आढावा"),icon:BarChart3}]),
    { to: "/harvest", label: t("采收", "Harvest"), icon: Camera },
    { to: "/field-intelligence", label: t("田间智能", "Field Intelligence", "खेत की जानकारी", "शेत माहिती"), icon: MapPinned },
    ...(me?.isManagement ? [{ to: "/approvals", label: t("审核", "Approvals"), icon: ClipboardCheck }] : []),
    { to: "/visual-intelligence", label: t("视觉智能", "Visual Intelligence", "दृश्य बुद्धिमत्ता", "दृश्य बुद्धिमत्ता"), icon: ScanLine },
    { to: "/guide", label: t("指导", "Guide"), icon: HeartHandshake },
  ] as const;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">

      <SettingsSync />
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-border bg-background/95 px-4 pt-3 backdrop-blur md:px-8 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:px-10">
        <Link to={me?.isManagement ? "/dashboard" : "/overview"} className="min-w-0 pb-3"><Brand /></Link>
        <nav className="col-span-2 row-start-2 hidden min-w-0 flex-wrap items-center gap-1 md:flex xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:pb-3" aria-label={t("导航", "Navigation", "नेविगेशन", "नेव्हिगेशन")}>{nav.map(n => <Link key={n.to} to={n.to} title={n.label} aria-label={n.label} search={n.to === "/guide" ? {harvest:undefined} : {}} className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" activeProps={{className:"border-primary font-semibold text-primary"}}><n.icon className="h-4 w-4 shrink-0" strokeWidth={1.5}/><span>{n.label}</span></Link>)}</nav>
        <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-1 pb-3 md:gap-2 xl:col-start-3">
          <SettingsControl />
          <div className="hidden text-right text-xs 2xl:block"><p className="font-semibold">{me?.profile?.display_name}</p><p className="text-muted-foreground">{me?.roles.map(r => roleLabel(lang)[r]).join(", ")}</p></div>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/notifications" title={t("通知", "Notifications")} aria-label={t("通知", "Notifications")}>
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">{unread}</span>}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={signOut} title={t("退出", "Sign out")} aria-label={t("退出", "Sign out")}><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="app-content mx-auto min-w-0 max-w-[1440px] px-4 py-5 md:px-8 md:py-6 xl:px-10">
        <div className="mb-4 flex items-center border-b border-border/60 pb-3">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground" onClick={() => {
            if (router.history.canGoBack()) router.history.back();
            else void navigate({to:me?.isManagement ? "/dashboard" : "/overview"});
          }}><ArrowLeft/>{t("返回", "Back", "वापस", "मागे")}</Button>
        </div>
        <Outlet />
      </main>

      <nav aria-label={t("导航", "Navigation", "नेविगेशन", "नेव्हिगेशन")} className="mobile-navigation fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-sidebar-border bg-sidebar py-2 text-sidebar-foreground md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} search={n.to === "/guide" ? {harvest:undefined} : {}} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 text-[10px] opacity-80" activeProps={{ className: "text-sidebar-primary opacity-100" }}>
            <n.icon className="h-5 w-5 shrink-0" /> <span className="w-full text-center text-[9px] leading-tight [overflow-wrap:anywhere]">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6 min-w-0">
      <h1 className="break-words text-3xl text-foreground md:text-4xl">{title}</h1>
      {sub && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{sub}</p>}
    </div>
  );
}

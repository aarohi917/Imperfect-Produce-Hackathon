import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, useLang, useSettings } from "@/lib/i18n";
import { formatDate } from "@/lib/localization";
import { notificationLabel } from "@/lib/notification-label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FarmReport } from "@/components/FarmReport";
import { loadFarmReports } from "@/lib/farm-reports.functions";
import type { ReportSnapshot } from "@/lib/farm-monitoring";
import { pageMeta } from "@/lib/page-meta";
import { Bell, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => pageMeta("通知 — 丑蔬 Imperfect Produce", "采收上报和核对动态。"),
  component: Notifications,
});

function Notifications() {
  const lang = useLang();
  const settings = useSettings();
  const t = useT();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["notifications", me?.user.id], enabled: !!me,
    queryFn: async () => {const {data,error}=await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);if(error) throw error;return data ?? [];},
    refetchInterval:60000,
  });
  const {data:reports=[],error:reportError}=useQuery({queryKey:["farm-reports",me?.user.id],enabled:!!me?.isManagement,queryFn:()=>loadFarmReports()});
  const { data: visualPhotos = {} } = useQuery({
    queryKey: ["visual-notification-photos", list.map(n => n.id)], enabled: !!me?.isManagement,
    queryFn: async () => {
      const paths = list.filter(n => n.event_type === "visual_intelligence").flatMap(n => {
        const details = n.details as { photoPath?: unknown } | null;
        return typeof details?.photoPath === "string" ? [details.photoPath] : [];
      });
      if (!paths.length) return {} as Record<string, string>;
      const { data, error } = await supabase.storage.from("harvest-photos").createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries((data ?? []).flatMap(i => i.path && i.signedUrl ? [[i.path, i.signedUrl]] : [])) as Record<string, string>;
    },
  });
  async function markAll() {
    if(!me) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", me.user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread"] });
  }
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3"><PageTitle title={t("通知", "Notifications")} /><Button variant="outline" size="sm" onClick={markAll}>{t("全部已读", "Mark all read")}</Button></div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]"><div><h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold"><Bell className="h-4 w-4 text-accent" />{t("通知", "Notifications")}</h2><div className="space-y-2">
        {list.length === 0 && <div className="py-8 text-muted-foreground">{t("暂无新通知。", "You're all caught up.")}</div>}
        {list.filter(n=>n.event_type!=="communication").map((n) => (
          <Card key={n.id} className={`rounded-none border-x-0 border-t-0 bg-transparent py-5 ${n.read ? "opacity-70" : "border-l-2 border-l-accent pl-4"}`}>
            <div className="flex flex-wrap justify-between gap-2"><div className="font-semibold">{notificationLabel(n,lang).title}</div><div className="text-xs text-muted-foreground">{formatDate(n.created_at,settings,true)}</div></div>
            <p className="text-sm text-muted-foreground">{notificationLabel(n,lang).body}</p>
            {n.event_type === "visual_intelligence" && (() => { const details = n.details as { photoPath?: string } | null; const url = details?.photoPath ? visualPhotos[details.photoPath] : undefined; return url ? <img src={url} alt={t("标注的扫描照片", "Annotated scan photo", "चिह्नित स्कैन फोटो", "चिन्हांकित स्कॅन फोटो")} className="my-3 max-h-56 w-full object-contain" /> : null; })()}
            {n.event_type === "farm_alert" && <Link to="/guide" search={{harvest:undefined}} className="text-sm font-semibold text-primary underline">{t("一起看看","Discuss with the guide")}</Link>}
            {me?.isManagement && (notificationLabel(n,lang).pending || n.event_type === "visual_intelligence") && <Link to="/approvals" search={{ report: n.harvest_id ?? undefined }} className="text-sm font-semibold text-primary underline">{t("查看报告", "Open report", "रिपोर्ट खोलें", "अहवाल उघडा")}</Link>}
          </Card>
        ))}
      </div>
      </div>{me?.isManagement && <section className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0"><FileText className="mb-3 h-7 w-7 text-primary" /><h2 className="text-xl">{t("每周农场报告","Weekly farm reports","साप्ताहिक खेत रिपोर्ट","साप्ताहिक शेत अहवाल")}</h2>
        {reportError && <p role="alert" className="text-destructive">{t("无法读取报告","Could not read reports","रिपोर्ट नहीं पढ़ सके","अहवाल वाचता आले नाहीत")}</p>}
        {!reports.length && <p className="mt-2 text-sm text-muted-foreground">{t("暂无每周报告。","No weekly reports yet.","अभी साप्ताहिक रिपोर्ट नहीं है।","अजून साप्ताहिक अहवाल नाहीत.")}</p>}
        {reports.map(r=><details key={r.id} className="border-b border-border py-4"><summary className="cursor-pointer font-semibold">{formatDate(r.period_start,settings)} – {formatDate(r.period_end,settings)} · {r.currency}</summary><p className="mt-2 text-xs text-muted-foreground">{r.time_zone} · {formatDate(r.created_at,{...settings,timeZone:r.time_zone},true)}</p><FarmReport start={r.period_start} end={r.period_end} currency={r.currency} snapshot={r.snapshot as unknown as ReportSnapshot}/><Link to="/guide" search={{harvest:undefined}} className="text-sm font-semibold text-primary underline">{t("制定或更新计划","Create or revisit the plan")}</Link></details>)}
      </section>}</div>
    </>
  );
}

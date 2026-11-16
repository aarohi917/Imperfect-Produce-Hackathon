import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadOperations } from "@/lib/operations.functions";
import { vegLabel } from "@/lib/vegetables";
import { useMe } from "@/lib/auth";
import { useSettings, useT } from "@/lib/i18n";
import { currencyRows, formatMoney } from "@/lib/localization";
import { summarize } from "@/lib/analytics";
import { CropAnalysis } from "./CropAnalysis";
import { ReferencePhoto } from "./ReferencePhoto";

export function GuideContext() {
  const { data: me } = useMe(), settings = useSettings(), t = useT();
  const { data: rows, error, isPending } = useQuery({
    queryKey: ["guide-context-records", me?.user.id], enabled: !!me,
    queryFn: async () => {
      if (!me) return [];
      if(!me.isManagement) return (await loadOperations()).filter(r=>r.farmer_id===me.user.id).map(r=>({...r,expected_revenue:0,cost:0,currency:"CNY"}));
      const result = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("harvests").select("*").eq("report_type", "harvest").eq("farmer_id", me.user.id).order("harvest_date", { ascending: false }).order("id").range(offset, offset + 499);
        if (error) throw error;
        result.push(...data);
        if (data.length < 500) return result;
      }
    },
  });
  if (error) return <p role="alert" className="py-4 text-sm text-destructive">{t("无法读取记录，未显示统计。", "Records could not be read; totals are not shown.")}</p>;
  if (isPending || !rows) return <p className="py-4 text-sm text-muted-foreground">{t("正在读取采收记录…", "Reading harvest records…")}</p>;
  const selected = me?.isManagement ? currencyRows(rows, settings.currency) : rows, stats = summarize(selected);
  return <>
    <ReferencePhoto className="-mx-4 h-28" />
    <section className="border-b border-border py-5"><h2 className="mb-4 text-lg">{t("我的农场分析", "My farm analysis")}</h2>
      <div className="flex items-baseline justify-between gap-2"><span className="text-sm text-muted-foreground">{t("已核对重量", "Confirmed weight")}</span><span className="font-semibold tabular-nums">{stats.kg.toLocaleString()} {t("公斤", "kg")}</span></div>
      <p className="mt-3 text-xs text-muted-foreground">{stats.pending} {t("等待核对", "Waiting to be checked")} · {stats.rejected} {t("已驳回", "Rejected")}</p>
    </section>
    <section className="border-b border-border py-5"><h2 className="font-display text-lg">{t("作物表现", "Crops")}</h2>
      {me?.isManagement ? <><dl className="my-4 grid grid-cols-2 gap-4">{[[t("预计收入", "Expected revenue"), stats.revenue], [t("已记录成本", "Recorded costs"), stats.cost]].map(([label, amount]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold tabular-nums">{formatMoney(Number(amount), settings.currency, settings.language, 2)}</dd></div>)}</dl>
      <CropAnalysis rows={selected} compact /></> : <dl className="mt-4 space-y-3">{stats.crops.map(c=><div key={c.name} className="flex justify-between gap-3"><dt className="text-sm">{vegLabel(c.name,settings.language)}</dt><dd className="text-sm font-semibold tabular-nums">{c.kg.toFixed(1)} kg</dd></div>)}</dl>}
    </section>
  </>;
}
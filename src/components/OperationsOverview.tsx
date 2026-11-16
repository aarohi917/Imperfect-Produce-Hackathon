import { Link } from "@tanstack/react-router";
import { ArrowRight, Camera, ClipboardCheck, Sprout, Truck } from "lucide-react";
import { useSettings, useT } from "@/lib/i18n";
import { formatMoney, locales } from "@/lib/localization";
import type { summarize } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { ReferencePhoto } from "@/components/ReferencePhoto";

export function OperationsOverview({ stats, approved, staff }: { stats: ReturnType<typeof summarize>; approved: number; staff: boolean }) {
  const t = useT(), settings = useSettings();
  const kg = stats.kg.toLocaleString(locales[settings.language], { maximumFractionDigits: 1 });
  const money = (n: number) => formatMoney(n, settings.currency, settings.language, 2);
  return <section className="mb-8">
    <div className="operations-intro relative min-h-64 overflow-hidden">
      <ReferencePhoto className="absolute inset-0" />
      <div className="absolute inset-0 bg-photo-scrim/65" />
      <div className="relative flex min-h-64 flex-wrap items-end justify-between gap-5 px-6 py-7 text-photo-foreground md:px-8">
        <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold"><Sprout className="h-4 w-4" />{t("丑蔬", "Imperfect Produce", "इम्परफेक्ट प्रोड्यूस", "इम्परफेक्ट प्रोड्यूस")}</p><h1 className="text-3xl">{staff ? t("农场经营分析", "Farm operations") : t("我的农场分析", "My farm analysis")}</h1><p className="mt-3 max-w-md text-sm">{t("从采收到去向，每个数字都有一批记录。", "From harvest to destination, every number has a batch behind it.")}</p></div>
        <Button asChild><Link to="/harvest"><Camera className="h-4 w-4" />{t("记录采收", "Record harvest")}</Link></Button>
      </div>
    </div>
    <div className="grid grid-cols-2 border-x border-b border-border bg-card lg:grid-cols-4">
      {[[t("已核对重量", "Confirmed weight"), `${kg} ${t("公斤", "kg")}`, `${approved} ${t("批", "batches")}`], [t("预计收入", "Expected revenue"), money(stats.revenue), t("不是已收款", "Not payments received")], [t("已记录成本", "Recorded costs"), money(stats.cost), t("未记录费用不在内", "Unrecorded expenses excluded")], [t("预计毛利", "Expected gross profit"), money(stats.profit), `${stats.margin}% ${t("预计毛利率", "expected margin")}`]].map(([label,value,hint]) => <div key={label} className="min-w-0 border-r border-border px-4 py-5 last:border-r-0 md:px-6"><p className="text-xs text-muted-foreground">{label}</p><p className="my-2 break-words text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{hint}</p></div>)}
    </div>
    <div className="mt-5 grid gap-4 border-y border-border py-4 sm:grid-cols-3">
      <div className="flex gap-3"><Camera className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{t("采收", "Harvest")}</p><p className="mt-1 text-xs text-muted-foreground">{approved + stats.pending + stats.rejected} {t("批", "batches")}</p></div></div>
      <div className="flex gap-3"><ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><p className="text-sm font-semibold">{stats.pending} {t("等待核对", "Waiting to be checked")}</p><p className="mt-1 text-xs text-muted-foreground">{stats.rejected} {t("已驳回", "Rejected")}</p></div>{staff && <Button asChild size="icon-sm" variant="ghost" className="ml-auto"><Link to="/approvals" aria-label={t("去核对", "Check reports")}><ArrowRight /></Link></Button>}</div>
      <div className="flex gap-3"><Truck className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{t("去向", "Destination")}</p><p className="mt-1 text-xs text-muted-foreground">{stats.factoryShare}% {t("工厂", "Factory")} · {t("核对通过不代表已交货或已收款。", "Confirmation does not establish completed delivery or payment.")}</p></div></div>
    </div>
  </section>;
}
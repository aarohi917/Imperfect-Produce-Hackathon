import { formatDate } from "@/lib/localization";
import { EVIDENCE } from "@/lib/evidence";
import { useLang, useT, useSettings } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";

export function EvidenceNotes() {
  const lang = useLang();
  const settings = useSettings();
  const t = useT();
  return (
    <details className="mt-6 border-y border-border py-4">
      <summary className="cursor-pointer font-semibold text-primary">{t("资料来源与适用范围", "Evidence & limitations")}</summary>
      <p className="mt-3 text-sm text-muted-foreground">{t("历史研究仅作背景，不计入农场统计。未接入实时行情；本地有机丑菜价格与损失率暂无核实数据。", "Historical research is background only, excluded from farm totals. No live price feed; local organic imperfect-produce prices and loss rates remain unverified.")}</p>
      <div className="divide-y divide-border">
        {EVIDENCE.map((e) => (
          <article key={e.id} className="space-y-2 py-4 text-sm">
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4">{e.title[lang]}<ExternalLink className="h-3 w-3 shrink-0" /></a>
            <p className="text-xs text-muted-foreground">{t("发表：", "Published: ")}{formatDate(e.published,settings)} · {t("期间：", "Period: ")}{e.period}</p>
            <p>{e.finding[lang]}</p>
            <p className="text-muted-foreground">{e.limit[lang]}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
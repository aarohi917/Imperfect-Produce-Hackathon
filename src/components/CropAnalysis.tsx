import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useSettings, useT } from "@/lib/i18n";
import { currencyRows, formatMoney, locales } from "@/lib/localization";
import { summarize, type HarvestRow } from "@/lib/analytics";
import { vegLabel } from "@/lib/vegetables";

export function CropAnalysis({ rows, compact = false }: { rows: HarvestRow[]; compact?: boolean }) {
  const settings = useSettings(), t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const crops = summarize(currencyRows(rows, settings.currency)).crops;
  const current = crops.find(c => c.name === selected);
  const money = (n: number) => formatMoney(n, settings.currency, settings.language, 2);
  if (!crops.length) return <p className="py-5 text-sm text-muted-foreground">{t("当前范围暂无已核对采收。", "No confirmed harvests in this selection.")}</p>;
  return <div className="min-w-0">
    <ChartContainer config={{ kg: { label: t("重量（公斤）", "Weight (kg)"), color: "var(--chart-1)" } }} className={compact ? "h-40 w-full" : "h-64 w-full"}>
      <BarChart accessibilityLayer data={crops.map(c => ({ ...c, label: vegLabel(c.name, settings.language) }))} margin={{ left: -20, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="kg" radius={[2, 2, 0, 0]} onClick={(_, index) => { const crop = crops[index]; if (crop) setSelected(crop.name); }} cursor="pointer">
          {crops.map(c => <Cell key={c.name} fill={selected === c.name ? "var(--chart-2)" : "var(--chart-1)"} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
    <div className="mt-3 flex flex-wrap gap-1" aria-label={t("作物", "Crop")}>{crops.map(c => <Button key={c.name} size="sm" variant={selected === c.name ? "secondary" : "ghost"} aria-pressed={selected === c.name} onClick={() => setSelected(c.name)}>{vegLabel(c.name, settings.language)}</Button>)}</div>
    {current && <section className="mt-3 border-y border-border bg-muted/40 py-4" aria-label={vegLabel(current.name, settings.language)}>
      <h3 className="mb-3 text-lg">{vegLabel(current.name, settings.language)}</h3>
      <dl className={`grid gap-4 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
        {[[t("预计收入", "Expected revenue"), money(current.revenue)], [t("已记录成本", "Recorded costs"), money(current.cost)], [t("预计毛利率", "Expected margin"), `${current.margin}%`], [t("已核对重量", "Confirmed weight"), `${current.kg.toLocaleString(locales[settings.language], { maximumFractionDigits: 1 })} ${t("公斤", "kg")}`]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold tabular-nums">{value}</dd></div>)}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{t("不是已收款", "Not payments received")} · {settings.currency}</p>
    </section>}
  </div>;
}
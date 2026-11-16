import { translate, formatMoney, type Lang } from "./localization";
export type HarvestRow = {
  report_type?: string;
  currency?: string; id?: string; vegetable: string; quantity: number; destination: string; expected_revenue: number; cost: number;
  status: string; created_at: string; harvest_date?: string; grade?: string; farmer_id?: string;
};

const n = (x: unknown) => Number(x) || 0;
const month = (r: HarvestRow) => (r.harvest_date ?? r.created_at).slice(0, 7);

export type CropStat = { name: string; kg: number; revenue: number; cost: number; profit: number; pricePerKg: number; costPerKg: number; margin: number; gradeA: number; reports: number };

function cropStats(rows: HarvestRow[]): CropStat[] {
  const m = new Map<string, HarvestRow[]>();
  for (const r of rows) m.set(r.vegetable, [...(m.get(r.vegetable) ?? []), r]);
  return [...m].map(([name, rs]) => {
    const kg = rs.reduce((a, r) => a + n(r.quantity), 0);
    const revenue = rs.reduce((a, r) => a + n(r.expected_revenue), 0);
    const cost = rs.reduce((a, r) => a + n(r.cost), 0);
    const aKg = rs.filter((r) => (r.grade ?? "A") === "A").reduce((a, r) => a + n(r.quantity), 0);
    return {
      name, kg, revenue, cost, profit: revenue - cost, reports: rs.length,
      pricePerKg: kg ? revenue / kg : 0, costPerKg: kg ? cost / kg : 0,
      margin: revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0,
      gradeA: kg ? Math.round((aKg / kg) * 100) : 0,
    };
  }).sort((a, b) => b.kg - a.kg);
}

/** Only checker-approved harvests count toward financial and harvest totals. */
export function summarize(rows: HarvestRow[]) {
  rows = rows.filter(r => r.report_type !== "visual_intelligence");
  const ok = rows.filter((r) => r.status === "approved");
  const revenue = ok.reduce((a, r) => a + n(r.expected_revenue), 0);
  const cost = ok.reduce((a, r) => a + n(r.cost), 0);
  const kg = ok.reduce((a, r) => a + n(r.quantity), 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const months = new Map<string, { kg: number; revenue: number; profit: number }>();
  for (const r of ok) {
    const c = months.get(month(r)) ?? { kg: 0, revenue: 0, profit: 0 };
    c.kg += n(r.quantity); c.revenue += n(r.expected_revenue); c.profit += n(r.expected_revenue) - n(r.cost);
    months.set(month(r), c);
  }
  const byMonth = [...months].sort().map(([m, v]) => ({ month: m, ...v }));
  const last = byMonth.at(-1), prev = byMonth.at(-2);
  const kgChange = last && prev && prev.kg ? Math.round(((last.kg - prev.kg) / prev.kg) * 100) : null;
  const factoryKg = ok.filter((r) => r.destination === "factory").reduce((a, r) => a + n(r.quantity), 0);
  return {
    kg, revenue, cost, profit, margin, kgChange,
    pending: rows.filter((r) => r.status === "pending").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    factoryShare: kg ? Math.round((factoryKg / kg) * 100) : 0,
    crops: cropStats(ok), byMonth,
  };
}

/**
 * Flags a report whose price per kg differs more than 50% from the approved average
 * for that vegetable, or whose cost exceeds revenue — so checker can double-check it.
 */
export function checkReport(r: HarvestRow, approved: HarvestRow[], lang: Lang = "zh"): string[] {
  if (r.report_type === "visual_intelligence") return [];
  approved = approved.filter(a => a.report_type !== "visual_intelligence");
  const t = (zh: string, en: string, hi?: string, mr?: string) => translate(lang,zh,en,hi,mr);
  const flags: string[] = [];
  const q = n(r.quantity);
  if (q <= 0) flags.push(t("重量为零", "Weight is zero"));
  if (n(r.cost) > n(r.expected_revenue) && n(r.expected_revenue) > 0) flags.push(t("成本高于收入", "Cost is higher than revenue"));
  if (n(r.expected_revenue) === 0) flags.push(t("未填写收入", "No revenue entered"));
  const same = approved.filter((a) => a.vegetable === r.vegetable && a.status === "approved" && a.id !== r.id && (a.currency ?? "CNY") === (r.currency ?? "CNY"));
  const kg = same.reduce((a, x) => a + n(x.quantity), 0);
  if (kg > 0 && q > 0 && n(r.expected_revenue) > 0) {
    const avg = same.reduce((a, x) => a + n(x.expected_revenue), 0) / kg;
    const p = n(r.expected_revenue) / q;
    if (avg > 0 && Math.abs(p - avg) / avg > 0.5) flags.push(`${t("单价/公斤","Price/kg")}: ${formatMoney(p,r.currency,lang,2)} · ${formatMoney(avg,r.currency,lang,2)}`);
  }
  return flags;
}

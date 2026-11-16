import type { HarvestRow } from "./analytics";
export type AssistantRow = HarvestRow & { field_name?: string | null };
export type GoalMetric = "margin" | "cost_per_kg" | "custom" | "expected_profit";
export type Goal = {
  id: string; title: string; metric: string; target: number; baseline: number | null;
  baseline_date: string; due_date: string; crop: string | null; measurement: string;
  current_value: number | null; status: string;
};
export function metricValue(rows: AssistantRow[], metric: string, crop: string | null = null) {
  rows = rows.filter(r => r.report_type !== "visual_intelligence");
  const approved = rows.filter(r => r.status === "approved" && (!crop || r.vegetable === crop));
  if (!approved.length || metric === "custom") return null;
  const kg = approved.reduce((s, r) => s + r.quantity, 0);
  const revenue = approved.reduce((s, r) => s + r.expected_revenue, 0);
  const cost = approved.reduce((s, r) => s + r.cost, 0);
  if (metric === "expected_profit") return revenue - cost;
  return metric === "margin" ? (revenue > 0 ? 100 * (revenue - cost) / revenue : null) : (kg > 0 ? cost / kg : null);
}
export function goalProgress(goal: Goal, rows: AssistantRow[]) {
  const eligible = rows.filter(r => (r.harvest_date ?? r.created_at.slice(0, 10)) >= goal.baseline_date && (r.harvest_date ?? r.created_at.slice(0,10)) <= goal.due_date);
  const current = goal.metric === "custom" ? goal.current_value : metricValue(eligible, goal.metric, goal.crop);
  return { current, targetObserved: current !== null && (goal.metric === "cost_per_kg" ? current <= goal.target : current >= goal.target) };
}
export type Finding = { key: string; crop?: string; ids: string[]; zh: string; en: string; nextZh: string; nextEn: string };
export function farmingFindings(rows: AssistantRow[]): Finding[] {
  rows = rows.filter(r => r.report_type !== "visual_intelligence");
  const approved = rows.filter(r => r.status === "approved").sort((a,b) => (a.harvest_date ?? a.created_at).localeCompare(b.harvest_date ?? b.created_at) || a.created_at.localeCompare(b.created_at) || (a.id ?? "").localeCompare(b.id ?? ""));
  const findings: Finding[] = [];
  for (const crop of new Set(approved.map(r => r.vegetable))) {
    const same = approved.filter(r => r.vegetable === crop), last = same.at(-1), recent = same.slice(-3);
    const margins = recent.map(r => r.expected_revenue > 0 ? (r.expected_revenue-r.cost)/r.expected_revenue*100 : null);
    const [a,b,c] = margins;
    if (recent.length === 3 && a !== null && a !== undefined && b !== null && b !== undefined && c !== null && c !== undefined && a > b && b > c) {
      findings.push({key: `margin-${crop}`, crop, ids: recent.flatMap(r => r.id ? [r.id] : []), zh: `${crop}最近三批已核对采收的预计毛利率从${a.toFixed(1)}%降至${c.toFixed(1)}%。`, en: `${crop}: expected margins declined across the last three checked batches, from ${a.toFixed(1)}% to ${c.toFixed(1)}%.`, nextZh: "先比较每公斤预计售价与成本。尚不能确定原因，也不代表实际已收款。", nextEn: "Compare expected price and cost per kg first. The cause is not confirmed, and these are not payments received."});
    }
    const prior = same.slice(-4,-1);
    const usual = metricValue(prior, "cost_per_kg", crop);
    if (last && prior.length === 3 && usual !== null && usual > 0 && last.quantity > 0 && last.cost/last.quantity > usual*1.5) findings.push({key: `cost-${crop}`, crop, ids: [last.id ?? ""], zh: `${crop}最新一批成本¥${(last.cost/last.quantity).toFixed(2)}/公斤，比此前三批加权成本¥${usual.toFixed(2)}/公斤高出50%以上。`, en: `${crop}: latest recorded cost is ¥${(last.cost/last.quantity).toFixed(2)}/kg, over 50% above the previous three batches' weighted ¥${usual.toFixed(2)}/kg.`, nextZh: "核对投入品、人工、运输与费用分摊；这只是需要核实的差异，不是已确认浪费。", nextEn: "Check inputs, labour, transport and cost allocation; this difference does not confirm waste."});
  }
  const incomplete = rows.filter(r => !r.field_name?.trim() || r.expected_revenue === 0);
  if (incomplete.length) findings.push({key:"incomplete", ids: incomplete.flatMap(r=>r.id?[r.id]:[]), zh: `${incomplete.length}条采收缺少地块或预计收入为零，比较可能不完整。`, en: `${incomplete.length} harvests have no field or zero expected revenue; comparisons may be incomplete.`, nextZh: "检查原记录；零收入不等于未售出，未核对的记录不计入财务汇总。", nextEn: "Review the original records. Zero revenue does not mean unsold produce; unchecked records do not enter financial totals."});
  return findings.slice(0,3);
}
export function goalAssessment(goal: Goal, rows: AssistantRow[], today: string) {
  const progress = goalProgress(goal, rows.filter(r => (r.harvest_date ?? r.created_at.slice(0,10)) <= today));
  if (goal.status === "paused") return "paused" as const;
  if (progress.current === null) return "insufficient" as const;
  if (progress.targetObserved) return "target_observed" as const;
  if (today > goal.due_date) return "behind" as const;
  // No yield, demand or execution measurements exist to reliably forecast the deadline.
  return "not_yet_assessable" as const;
}

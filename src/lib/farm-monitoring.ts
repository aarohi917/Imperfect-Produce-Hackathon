import { dateKey, currencyRows, type Settings } from "./localization";
import { farmingFindings, goalProgress, goalAssessment, type AssistantRow, type Goal } from "./farmer-assistant";
export function shiftDay(day: string, days: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + days * 86400000).toISOString().slice(0,10);
}
export function weeklyPeriod(now: Date, settings: Settings) {
  const today = dateKey(now, settings.timeZone);
  const weekday = new Date(today + "T12:00:00Z").getUTCDay();
  const startDay = settings.weekStartsOn === "sunday" ? 0 : 1;
  const thisStart = shiftDay(today, -((weekday - startDay + 7) % 7));
  const hour = Number(new Intl.DateTimeFormat("en-GB",{timeZone:settings.timeZone,hour:"2-digit",hourCycle:"h23"}).format(now));
  return { start:shiftDay(thisStart,-7), end:shiftDay(thisStart,-1), due:today !== thisStart || hour >= 8 };
}
export function totals(rows: AssistantRow[]) {
  rows = rows.filter(r => r.report_type !== "visual_intelligence");
  const approved = rows.filter(r=>r.status === "approved");
  const kg = approved.reduce((s,r)=>s+r.quantity,0);
  const revenue = approved.reduce((s,r)=>s+r.expected_revenue,0);
  const cost = approved.reduce((s,r)=>s+r.cost,0);
  return { count:approved.length, kg, revenue, cost, profit:revenue-cost, pending:rows.filter(r=>r.status === "pending").length };
}
export function reportSnapshot(allRows: AssistantRow[], goals: (Goal & {currency:string})[], settings: Settings, start: string, end: string) {
  const rows = currencyRows(allRows.filter(r => r.report_type !== "visual_intelligence"),settings.currency);
  const between = (a:string,b:string)=>rows.filter(r=>{const d=r.harvest_date ?? r.created_at.slice(0,10);return d>=a && d<=b;});
  const current = between(start,end), prior = between(shiftDay(start,-7),shiftDay(end,-7));
  return { current:totals(current), previous:totals(prior), crops:[...new Set(current.filter(r=>r.status==="approved").map(r=>r.vegetable))].map(crop=>({crop,...totals(current.filter(r=>r.vegetable===crop))})), findings:farmingFindings(rows.filter(r=>(r.harvest_date ?? r.created_at.slice(0,10))<=end)), goals:goals.filter(g=>g.currency===settings.currency && g.status==="active").map(g=>({id:g.id,title:g.title,metric:g.metric,target:g.target,dueDate:g.due_date,...goalProgress(g,rows.filter(r=>(r.harvest_date ?? r.created_at.slice(0,10))<=end)),assessment:goalAssessment(g,rows,end)})) };
}
export type ReportSnapshot = ReturnType<typeof reportSnapshot>;
export function findingFingerprint(ids: string[], rows: AssistantRow[]) {
  return JSON.stringify(rows.filter(r=>r.id && ids.includes(r.id)).sort((a,b)=>(a.id ?? "").localeCompare(b.id ?? "")).map(r=>[r.id,r.status,r.quantity,r.expected_revenue,r.cost,r.field_name,r.harvest_date]));
}
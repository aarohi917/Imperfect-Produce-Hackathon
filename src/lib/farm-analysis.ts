import { summarize, type HarvestRow } from "./analytics";

export type FarmRow = HarvestRow & { field_name?: string | null; notes?: string | null; review_note?: string | null; reviewed_at?: string | null };
export type FarmFilters = { crop: string; from: string; to: string };

export function filterFarmRows(rows: FarmRow[], filters: FarmFilters) {
  return rows.filter((r) => {
    if (r.report_type === "visual_intelligence") return false;
    const date = (r.harvest_date ?? r.created_at).slice(0, 10);
    return (!filters.crop || r.vegetable === filters.crop) && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to);
  });
}

/** All comparisons retain the approved-only accounting boundary. */
export function analyzeFarm(rows: FarmRow[]) {
  rows = rows.filter(r => r.report_type !== "visual_intelligence");
  const approved = rows.filter((r) => r.status === "approved");
  const group = (key: (r: FarmRow) => string) => {
    const groups = new Map<string, FarmRow[]>();
    for (const r of approved) { const k = key(r); groups.set(k, [...(groups.get(k) ?? []), r]); }
    return [...groups].map(([name, records]) => ({ name, records, ...summarize(records) })).sort((a, b) => b.kg - a.kg);
  };
  const total = summarize(rows);
  const grades = ["A", "B", "C", "unknown"].map((name) => {
    const records = approved.filter((r) => (r.grade && ["A", "B", "C"].includes(r.grade) ? r.grade : "unknown") === name);
    return { name, ...summarize(records), records };
  });
  return {
    total, approved,
    fields: group((r) => r.field_name?.trim() || "unknown"),
    channels: group((r) => r.destination),
    grades,
    exceptions: rows.filter((r) => r.status !== "rejected" && (Number(r.cost) > Number(r.expected_revenue) || !Number(r.expected_revenue) || !r.field_name?.trim())),
    missingFields: approved.filter((r) => !r.field_name?.trim()).length,
    lossMaking: approved.filter((r) => Number(r.cost) > Number(r.expected_revenue)),
  };
}
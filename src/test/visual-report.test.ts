import { describe, expect, it } from "vitest";
import { summarizeVisualItems, visualItemsSchema, type VisualItem } from "@/lib/visual-report";
import { summarize } from "@/lib/analytics";
import { analyzeFarm } from "@/lib/farm-analysis";
import { metricValue, farmingFindings } from "@/lib/farmer-assistant";
import { totals } from "@/lib/farm-monitoring";

const item: VisualItem = { id: 1, type: "carrot", confidence: 0.9, sizeCm: null, qualityScore: 82, grade: "Good", blemishPct: 7 };
describe("Visual observation reports", () => {
  it("stops an empty detection report", () => expect(visualItemsSchema.safeParse([]).success).toBe(false));
  it("counts types and computes quality from detected items", () => {
    const report = summarizeVisualItems([item, { ...item, id: 2, qualityScore: 60, grade: "Fair" }]);
    expect(report.itemCount).toBe(2);
    expect(report.counts).toEqual({ carrot: 2 });
    expect(report.averageQuality).toBe(71);
    expect(report.grades).toEqual({ Good: 1, Fair: 1, Poor: 0, Unknown: 0 });
  });
  it("keeps missing calibration and quality unknown", () => {
    const report = summarizeVisualItems([{ ...item, qualityScore: null, grade: null, blemishPct: null }]);
    expect(report.items[0]?.sizeCm).toBeNull();
    expect(report.averageQuality).toBeNull();
    expect(report.grades.Unknown).toBe(1);
  });
  const observation = { report_type: "visual_intelligence", id: "visual", vegetable: "carrot", quantity: 100, destination: "market", expected_revenue: 500, cost: 200, status: "approved", created_at: "2026-11-15", field_name: null };
  it("excludes visual observations from harvest and financial totals", () => {
    expect(summarize([observation]).kg).toBe(0);
    expect(summarize([observation]).revenue).toBe(0);
    expect(totals([observation]).count).toBe(0);
  });
  it("excludes visual observations from field comparisons", () => expect(analyzeFarm([observation]).approved).toEqual([]));
  it("excludes visual observations from goal measurements", () => expect(metricValue([observation], "expected_profit")).toBeNull());
  it("excludes visual observations from harvest warnings", () => expect(farmingFindings([observation])).toEqual([]));
});
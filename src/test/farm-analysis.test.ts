import { describe, it, expect } from "vitest";
import { analyzeFarm, filterFarmRows, type FarmRow } from "@/lib/farm-analysis";

const row: FarmRow = { id: "one", vegetable: "胡萝卜", quantity: 10, cost: 40, expected_revenue: 100, status: "approved", destination: "market", harvest_date: "2026-11-01", created_at: "2026-11-02", field_name: "North", grade: "B" };
describe("deeper farm analysis", () => {
  it("excludes pending and rejected harvests from field and sales-channel totals", () => {
    const s = analyzeFarm([row, { ...row, status: "pending", quantity: 900 }, { ...row, status: "rejected", quantity: 800 }]);
    expect(s.fields[0]?.kg).toBe(10);
    expect(s.channels[0]?.profit).toBe(60);
    expect(s.grades.find((g) => g.name === "B")?.kg).toBe(10);
  });
  it("filters on harvest date and crop, with inclusive boundaries", () => {
    const rows = [row, { ...row, harvest_date: "2026-10-31" }, { ...row, vegetable: "菠菜" }];
    expect(filterFarmRows(rows, { crop: "胡萝卜", from: "2026-11-01", to: "2026-11-01" })).toEqual([row]);
  });
  it("does not silently turn missing grades into grade A", () => {
    const { grade, ...withoutGrade } = row;
    const s = analyzeFarm([withoutGrade]);
    expect(s.grades.find((g) => g.name === "A")?.kg).toBe(0);
    expect(s.grades.find((g) => g.name === "unknown")?.kg).toBe(10);
  });
  it("keeps missing fields and costs above revenue visible for follow-up", () => {
    const s = analyzeFarm([{ ...row, field_name: null, cost: 150 }, { ...row, status: "rejected", field_name: null }]);
    expect(s.missingFields).toBe(1);
    expect(s.lossMaking).toHaveLength(1);
    expect(s.exceptions).toHaveLength(1);
    expect(s.fields[0]?.name).toBe("unknown");
  });
  it("uses weighted money per kilogram, not an average of batch prices", () => {
    const s = analyzeFarm([row, { ...row, quantity: 90, expected_revenue: 180, cost: 90 }]);
    expect(s.total.revenue / s.total.kg).toBe(2.8);
    expect(s.total.cost / s.total.kg).toBe(1.3);
  });
});
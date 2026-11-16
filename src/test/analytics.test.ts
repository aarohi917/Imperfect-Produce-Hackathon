import { describe, it, expect } from "vitest";
import { summarize, checkReport } from "@/lib/analytics";
import { normalizeVegetable } from "@/lib/vegetables";

const base = { vegetable: "胡萝卜", quantity: 10, destination: "market", expected_revenue: 100, cost: 40, created_at: "2026-11-01T00:00:00Z" };

describe("harvest data rules", () => {
  it("counts only HQ-approved harvests toward totals", () => {
    const s = summarize([{ ...base, status: "approved" }, { ...base, status: "pending" }, { ...base, status: "rejected" }]);
    expect(s.revenue).toBe(100);
    expect(s.profit).toBe(60);
    expect(s.pending).toBe(1);
    expect(s.crops[0]!.pricePerKg).toBe(10);
  });
  it("flags price per kg more than 50% off the approved average", () => {
    const approved = [{ ...base, id: "a", status: "approved" }];
    expect(checkReport({ ...base, id: "b", status: "pending", expected_revenue: 200 }, approved)).toHaveLength(1);
    expect(checkReport({ ...base, id: "c", status: "pending", expected_revenue: 120 }, approved)).toHaveLength(0);
  });
  it("normalizes vegetable names to the standard list", () => {
    expect(normalizeVegetable("Carrots")).toBe("胡萝卜");
    expect(normalizeVegetable("西红柿")).toBe("番茄");
    expect(normalizeVegetable("西瓜")).toBe("");
  });
});

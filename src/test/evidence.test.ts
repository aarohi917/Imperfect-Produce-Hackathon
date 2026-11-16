import { describe, expect, it } from "vitest";
import { EVIDENCE, evidenceContext, GUIDE_ACCURACY_RULES } from "@/lib/evidence";

describe("research boundaries", () => {
  it("keeps the 4.39 yuan price scoped to national wholesale and its historical week", () => {
    const price = EVIDENCE.find((e) => e.id === "mara-2025-w28");
    expect(price).toMatchObject({ kind: "national-wholesale", value: 4.39, unit: "CNY/kg", crop: null, period: "2025-07-07 — 2025-07-13" });
  });
  it("keeps the 17.1% grading loss tied to apples rather than vegetables", () => {
    expect(EVIDENCE.find((e) => e.id === "jia-apple-2024")).toMatchObject({ crop: "apple", value: 17.1, unit: "percent" });
  });
  it("supplies both original sources to guide context", () => {
    const context = evidenceContext();
    for (const e of EVIDENCE) expect(context).toContain(e.url);
    expect(GUIDE_ACCURACY_RULES).toContain("expected_revenue 是预计收入");
  });
});
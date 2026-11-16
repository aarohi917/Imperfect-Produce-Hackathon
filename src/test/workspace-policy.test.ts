import { describe, it, expect } from "vitest";
import { managementAccess, canReadFarmFinance, harvestAlertRecipients } from "@/lib/workspace-policy";
describe("workspace permissions", () => {
  it("farmers have no financial workspace", () => expect(managementAccess(["farmer"], [{role:"member"}])).toBe(false));
  it("Checkers retain management access", () => expect(managementAccess(["hq"], [])).toBe(true));
  it("CEOs retain management access", () => expect(managementAccess(["ceo"], [])).toBe(true));
  it("appointed managers get the management workspace", () => expect(managementAccess(["farmer"], [{role:"manager"}])).toBe(true));
  it("managers cannot read unrelated farms' finance", () => expect(canReadFarmFinance(["farmer"], ["org-a"], ["org-b"])).toBe(false));
  it("managers can read only their organization's farms", () => expect(canReadFarmFinance(["farmer"], ["org-a"], ["org-a"])).toBe(true));
  it("harvest alerts go to Checkers, not farmers or CEO-only accounts", () => expect(harvestAlertRecipients([{user_id:"checker",role:"hq"},{user_id:"farmer",role:"farmer"},{user_id:"ceo",role:"ceo"}])).toEqual(["checker"]));
});
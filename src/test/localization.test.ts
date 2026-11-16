import { describe,it,expect } from "vitest";
import { dateKey,formatDate,formatMoney,currencyRows,normalizeSettings,LANGUAGES,CURRENCIES } from "@/lib/localization";
import { vegLabel } from "@/lib/vegetables";
import { defaultChatTitle,displayChatTitle } from "@/lib/guide-history";
describe("Localization rules",()=>{
  it("supports English, Chinese, Hindi and Marathi",()=>{expect(LANGUAGES).toEqual(["zh","en","hi","mr"]); expect(vegLabel("胡萝卜","en")).toBe("Carrot");expect(vegLabel("胡萝卜","hi")).toBe("गाजर");expect(vegLabel("胡萝卜","mr")).toBe("गाजर");});
  it("supports five manually selected currencies without changing values",()=>{expect(CURRENCIES).toEqual(["USD","INR","CNY","GBP","JPY"]);expect(formatMoney(123.45,"USD","en")).toBe("$123.45");expect(formatMoney(123.45,"INR","en")).toBe("₹123.45");expect(formatMoney(123.45,"JPY","en")).toBe("¥123");});
  it("never mixes different currencies in a financial comparison",()=>{expect(currencyRows([{currency:"CNY",cost:10},{currency:"USD",cost:20},{cost:30}],"CNY").reduce((s,r)=>s+r.cost,0)).toBe(40);});
  it("uses Los Angeles November 14 rather than Shanghai November 15",()=>{expect(dateKey("2026-11-14T18:24:00Z","America/Los_Angeles")).toBe("2026-11-14");expect(dateKey("2026-11-14T18:24:00Z","Asia/Shanghai")).toBe("2026-11-15");expect(defaultChatTitle("2026-11-14T18:24:00Z","low profit margins","en","America/Los_Angeles")).toBe("November 14, 2026 – Profit Margins");});
  it("preserves date-only harvests and deadlines",()=>{expect(formatDate("2026-11-14",{language:"en",currency:"USD",timeZone:"America/Los_Angeles"})).toBe("November 14, 2026");});
  it("does not overwrite renamed chat titles when time zone changes",()=>{expect(displayChatTitle({title:"My plan",title_custom:true,created_at:"2026-11-14T18:24:00Z"},"en","Asia/Shanghai")).toBe("My plan");});
  it("rejects invalid settings without inferring a currency",()=>{expect(normalizeSettings({timeZone:"wrong"})).toEqual({language:"zh",currency:"CNY",timeZone:"UTC",weekStartsOn:"monday",monitoringEnabled:true,proactiveNotifications:true});});
});
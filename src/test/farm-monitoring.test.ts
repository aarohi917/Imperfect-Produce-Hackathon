import { describe,it,expect } from "vitest";
import { weeklyPeriod,reportSnapshot,findingFingerprint } from "@/lib/farm-monitoring";
import { goalProgress,goalAssessment,metricValue,type AssistantRow,type Goal } from "@/lib/farmer-assistant";
import { normalizeSettings } from "@/lib/localization";
const row=(id:string,date:string,revenue:number,cost:number,extra:Partial<AssistantRow> & {currency?:string}={}):AssistantRow & {currency:string}=>({id,vegetable:"番茄",quantity:10,status:"approved",expected_revenue:revenue,cost,harvest_date:date,created_at:date+"T12:00:00Z",destination:"market",field_name:"test",currency:"USD",...extra});
const goal:Goal & {currency:string}={id:"g",title:"Earn $5 expected gross profit",metric:"expected_profit",target:5,baseline:null,baseline_date:"2026-11-09",due_date:"2026-11-15",crop:null,measurement:"",current_value:null,status:"active",currency:"USD"};
describe("Automatic farm reporting rules",()=>{
  it("Sunday starts cover Sunday through Saturday",()=>{
    expect(weeklyPeriod(new Date("2026-11-15T16:00:00Z"),normalizeSettings({weekStartsOn:"sunday",timeZone:"America/Los_Angeles"}))).toEqual({start:"2026-11-08",end:"2026-11-14",due:true});
  });
  it("Monday starts cover Monday through Sunday",()=>{
    expect(weeklyPeriod(new Date("2026-11-16T16:00:00Z"),normalizeSettings({weekStartsOn:"monday",timeZone:"America/Los_Angeles"}))).toEqual({start:"2026-11-09",end:"2026-11-15",due:true});
  });
  it("waits until 08:00 local time on the new week start",()=>{
    expect(weeklyPeriod(new Date("2026-11-15T15:59:00Z"),normalizeSettings({weekStartsOn:"sunday",timeZone:"America/Los_Angeles"})).due).toBe(false);
    expect(weeklyPeriod(new Date("2026-11-15T16:00:00Z"),normalizeSettings({weekStartsOn:"sunday",timeZone:"America/Los_Angeles"})).due).toBe(true);
  });
  it("uses selected time zone even when the UTC calendar date differs",()=>{
    expect(weeklyPeriod(new Date("2026-11-15T00:30:00Z"),normalizeSettings({weekStartsOn:"sunday",timeZone:"Asia/Shanghai"})).start).toBe("2026-11-08");
    expect(weeklyPeriod(new Date("2026-11-15T00:30:00Z"),normalizeSettings({weekStartsOn:"sunday",timeZone:"America/Los_Angeles"})).start).toBe("2026-11-01");
  });
  it("totals only checked records in the requested week and currency",()=>{
    const snapshot=reportSnapshot([row("1","2026-11-10",100,40),row("2","2026-11-10",10000,0,{status:"pending"}),row("3","2026-11-10",5000,0,{currency:"CNY"}),row("4","2026-11-03",80,40)],[],normalizeSettings({currency:"USD"}),"2026-11-09","2026-11-15");
    expect(snapshot.current).toEqual({count:1,kg:10,revenue:100,cost:40,profit:60,pending:1});
    expect(snapshot.previous.profit).toBe(40);
  });
  it("fingerprints stay stable for the same issue and change for relevant revised values",()=>{
    const one=row("1","2026-11-10",100,40);
    expect(findingFingerprint(["1"],[one])).toBe(findingFingerprint(["1"],[one,row("2","2026-11-10",500,0)]));
    expect(findingFingerprint(["1"],[one])).not.toBe(findingFingerprint(["1"],[{...one,cost:50}]));
  });
  it("tracks the $5 example as expected gross profit rather than actual earnings",()=>{
    expect(metricValue([row("1","2026-11-10",10,5)],"expected_profit")).toBe(5);
    expect(goalProgress(goal,[row("1","2026-11-10",10,5)])).toEqual({current:5,targetObserved:true});
  });
  it("never uses harvests after the goal deadline to claim the target was met",()=>{
    expect(goalProgress(goal,[row("1","2026-11-16",100,0)])).toEqual({current:null,targetObserved:false});
  });
  it("does not forecast on-track success without sufficient evidence",()=>{
    expect(goalAssessment(goal,[row("1","2026-11-10",5,4)],"2026-11-14")).toBe("not_yet_assessable");
    expect(goalAssessment(goal,[row("1","2026-11-10",5,4)],"2026-11-16")).toBe("behind");
    expect(goalAssessment(goal,[],"2026-11-16")).toBe("insufficient");
  });
  it("does not advance paused goals",()=>{
    expect(goalAssessment({...goal,status:"paused"},[row("1","2026-11-10",10,5)],"2026-11-14")).toBe("paused");
  });
  it("persists independent monitoring and notification controls",()=>{
    expect(normalizeSettings({monitoringEnabled:false,proactiveNotifications:true,weekStartsOn:"sunday"})).toMatchObject({monitoringEnabled:false,proactiveNotifications:true,weekStartsOn:"sunday"});
  });
});
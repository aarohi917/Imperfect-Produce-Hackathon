import { describe, it, expect } from "vitest";
import { metricValue, farmingFindings, goalProgress, type AssistantRow, type Goal } from "@/lib/farmer-assistant";
const row=(id:string,revenue:number,cost:number,date="2026-11-14",extra:Partial<AssistantRow>={}):AssistantRow=>({id,vegetable:"番茄",quantity:10,expected_revenue:revenue,cost,status:"approved",destination:"market",created_at:`${date}T10:00:00Z`,harvest_date:date,field_name:"一号田",...extra});
describe("Farmer assistant evidence boundaries",()=>{
  it("excludes unchecked harvests from financial measurements",()=>{
    expect(metricValue([row("1",100,40),row("2",10000,0,undefined,{status:"pending"})],"margin")).toBe(60);
  });
  it("compares declining expected margins across multiple same-crop harvests",()=>{
    const findings=farmingFindings([row("1",100,20,"2026-11-10"),row("2",100,40,"2026-11-11"),row("3",100,60,"2026-11-12")]);
    expect(findings.map(f=>f.key)).toEqual(["margin-番茄"]);
    expect(findings[0]?.ids).toEqual(["1","2","3"]);
  });
  it("does not treat a single lower batch as a declining pattern",()=>{
    expect(farmingFindings([row("1",100,20),row("2",100,40)] )).toEqual([]);
  });
  it("flags unusually high expenses against weighted prior cost per kg",()=>{
    const rows=[row("1",1000,10,"2026-11-01",{quantity:10}),row("2",1000,90,"2026-11-02",{quantity:90}),row("3",1000,10,"2026-11-03"),row("4",1000,20,"2026-11-04")];
    expect(farmingFindings(rows).some(f=>f.key==="cost-番茄")).toBe(true);
    expect(metricValue(rows.slice(0,3),"cost_per_kg")).toBe(1);
  });
  it("does not infer unsold produce from zero expected revenue",()=>{
    expect(farmingFindings([row("1",0,10)]).map(f=>f.key)).toEqual(["incomplete"]);
  });
  it("surfaces missing field data",()=>{
    expect(farmingFindings([row("1",100,10,undefined,{field_name:null})]).map(f=>f.key)).toEqual(["incomplete"]);
  });
  const goal:Goal={id:"g",title:"Improve profitability",metric:"margin",target:50,baseline:20,baseline_date:"2026-11-14",due_date:"2026-12-14",crop:null,measurement:"",current_value:null,status:"active"};
  it("keeps progress unknown when no new checked records support it",()=>{
    expect(goalProgress(goal,[row("old",100,40,"2026-11-13")])).toEqual({current:null,targetObserved:false});
  });
  it("revisits progress using new records without marking actions completed",()=>{
    expect(goalProgress(goal,[row("new",100,40)])).toEqual({current:60,targetObserved:true});
  });
  it("treats reducing production cost as a lower-value goal",()=>{
    expect(goalProgress({...goal,metric:"cost_per_kg",target:5},[row("new",100,40)])).toEqual({current:4,targetObserved:true});
  });
  it("keeps custom loss measurements separate from inferred farm totals",()=>{
    expect(goalProgress({...goal,metric:"custom",target:50,current_value:null},[row("1",0,10)])).toEqual({current:null,targetObserved:false});
  });
});
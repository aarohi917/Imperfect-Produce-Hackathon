import {it,expect,vi} from "vitest";
import {runFarmMonitoring} from "@/lib/farm-monitoring.server";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/integrations/supabase/types";
vi.mock("@/lib/farmer-assistant.server",()=>({readFarmerRecords:vi.fn(async()=>[]),readFarmerAssistant:vi.fn(async()=>({goals:[],memories:[],recallEnabled:true}))}));
function fakeDb(monitoring:boolean,notify:boolean) {
  const rpc=vi.fn(async()=>({data:true,error:null}));
  const from=vi.fn((table:string)=>{
    const result=table==="farm_monitor_state"?{data:[{user_id:"owner"}],error:null}:table==="user_settings"?{data:{language:"en",currency:"USD",time_zone:"UTC",week_starts_on:"monday",monitoring_enabled:monitoring,proactive_notifications:notify},error:null}:{data:null,error:null};
    const chain={select:()=>chain,order:()=>chain,limit:async()=>result,eq:()=>chain,maybeSingle:async()=>result,update:()=>chain,then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};
    return chain;
  });
  return {db:{from,rpc} as unknown as SupabaseClient<Database>,rpc,from};
}
it("disabled automatic monitoring creates no alerts or reports",async()=>{
  const {db,rpc}=fakeDb(false,true);
  expect(await runFarmMonitoring(db,new Date("2026-11-16T08:00:00Z"))).toEqual({processed:1,alerts:0,reports:0,failures:0});
  expect(rpc).not.toHaveBeenCalled();
});
it("disabled proactive notifications still saves a weekly report without delivery",async()=>{
  const {db,rpc}=fakeDb(true,false);
  expect((await runFarmMonitoring(db,new Date("2026-11-16T08:00:00Z"))).reports).toBe(1);
  expect(rpc).toHaveBeenCalledWith("deliver_farm_report",expect.objectContaining({p_notify:false,p_start:"2026-11-09",p_end:"2026-11-15",p_user_id:"owner"}));
});
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { readFarmerRecords, readFarmerAssistant } from "./farmer-assistant.server";
import { normalizeSettings, currencyRows } from "./localization";
import { farmingFindings, goalAssessment } from "./farmer-assistant";
import { weeklyPeriod, reportSnapshot, findingFingerprint } from "./farm-monitoring";
import { dateKey } from "./localization";

export async function runFarmMonitoring(db: SupabaseClient<Database>, now = new Date()) {
  // A bounded, durable round-robin queue keeps each callback within the managed request budget.
  const {data:queue,error} = await db.from("farm_monitor_state").select("*").order("last_checked_at",{ascending:true,nullsFirst:true}).order("user_id").limit(10);
  if(error) throw new Error("Could not read monitoring queue");
  let alerts=0, reports=0, failures=0;
  for(const item of queue) {
    try {
      const {data:stored,error:settingsError}=await db.from("user_settings").select("*").eq("user_id",item.user_id).maybeSingle();
      if(settingsError) throw settingsError;
      const settings=normalizeSettings(stored ? {language:stored.language as "zh",currency:stored.currency as "CNY",timeZone:stored.time_zone,weekStartsOn:stored.week_starts_on as "monday"|"sunday",monitoringEnabled:stored.monitoring_enabled,proactiveNotifications:stored.proactive_notifications} : {});
      // Clear before reading; a harvest change during processing re-queues instead of being lost.
      const {error:claimError}=await db.from("farm_monitor_state").update({dirty:false,last_checked_at:now.toISOString(),last_error:null}).eq("user_id",item.user_id);
      if(claimError) throw claimError;
      if(!settings.monitoringEnabled) continue;
      const {isManagement}=await import("./workspace-access.server");
      if(!await isManagement(db,item.user_id)) continue;
      const [rows,state]=await Promise.all([readFarmerRecords(db,item.user_id),readFarmerAssistant(db,item.user_id)]);
      const selected=currencyRows(rows,settings.currency).filter(r=>r.harvest_date<=dateKey(now,settings.timeZone));
      if(settings.proactiveNotifications) {
        for(const finding of farmingFindings(selected).filter(f=>f.key!=="incomplete")) {
          const goals=state.goals.filter(g=>g.status==="active" && g.currency===settings.currency && (!g.crop || g.crop===finding.crop)).map(g=>({id:g.id,title:g.title,assessment:goalAssessment(g,selected,dateKey(now,settings.timeZone))}));
          const {data:delivered,error:deliveryError}=await db.rpc("deliver_farm_alert",{p_user_id:item.user_id,p_key:`${settings.currency}:${finding.key}`,p_fingerprint:findingFingerprint(finding.ids,selected),p_details:JSON.parse(JSON.stringify({finding,currency:settings.currency,goals})) as Json});
          if(deliveryError) throw deliveryError;
          if(delivered) alerts++;
        }
      }
      const period=weeklyPeriod(now,settings);
      if(period.due) {
        const {data:existing,error:reportReadError}=await db.from("farm_reports").select("id").eq("user_id",item.user_id).eq("period_start",period.start).eq("period_end",period.end).eq("currency",settings.currency).maybeSingle();
        if(reportReadError) throw reportReadError;
        if(!existing) {
          const {data:delivered,error:deliveryError}=await db.rpc("deliver_farm_report",{p_user_id:item.user_id,p_start:period.start,p_end:period.end,p_currency:settings.currency,p_zone:settings.timeZone,p_week:settings.weekStartsOn ?? "monday",p_snapshot:JSON.parse(JSON.stringify(reportSnapshot(rows,state.goals,settings,period.start,period.end))) as Json,p_notify:settings.proactiveNotifications ?? true});
          if(deliveryError) throw deliveryError;
          if(delivered) reports++;
        }
      }
    } catch {
      failures++;
      await db.from("farm_monitor_state").update({dirty:true,last_checked_at:now.toISOString(),last_error:"Monitoring failed; retry queued"}).eq("user_id",item.user_id);
    }
  }
  return {processed:queue.length,alerts,reports,failures};
}
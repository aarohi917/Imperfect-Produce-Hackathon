import { normalizeSettings, currencyRows, dateKey, type Currency, type Lang } from "./localization";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { metricValue, goalProgress, goalAssessment, farmingFindings } from "./farmer-assistant";
import { VEGETABLES } from "./vegetables";
export const loadFarmerAssistant = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const {isManagement}=await import("./workspace-access.server");
  const management=await isManagement(context.supabase,context.userId);
  const { readFarmerAssistant, readFarmerRecords } = await import("./farmer-assistant.server");
  const [state, allRows, preferences] = await Promise.all([readFarmerAssistant(context.supabase,context.userId),readFarmerRecords(context.supabase,context.userId),context.supabase.from("user_settings").select("*").eq("user_id",context.userId).maybeSingle()]);
  if(preferences.error) throw new Error("Could not read settings");
  const currency=preferences.data?.currency ?? "CNY";
  const rows=management?currencyRows(allRows,currency):allRows;
  return {...state, management, findings:management?farmingFindings(rows):[], goals:state.goals.map(g=>({...g,...goalProgress(g,currencyRows(allRows,g.currency)),assessment:goalAssessment(g,currencyRows(allRows,g.currency),dateKey(new Date(),preferences.data?.time_zone ?? "UTC"))})), crops:[...new Set(rows.map(r=>r.vegetable))]};
});
export const saveFarmerMemory = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid().optional(),content:z.string().trim().min(1).max(1000)})).handler(async ({context,data})=>{
  const q = data.id ? context.supabase.from("farmer_memories").update({content:data.content}).eq("id",data.id).eq("user_id",context.userId) : context.supabase.from("farmer_memories").insert({user_id:context.userId,content:data.content});
  const {error} = await q.select("id").single();
  if(error) throw new Error("无法保存记忆 / Could not save memory");
  return {ok:true};
});
export const deleteFarmerMemory = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({context,data})=>{
  const {error}=await context.supabase.from("farmer_memories").delete().eq("id",data.id).eq("user_id",context.userId).select("id").single();
  if(error) throw new Error("无法删除记忆 / Could not delete memory");
  return {ok:true};
});
export const setFarmerRecall = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({enabled:z.boolean()})).handler(async ({context,data})=>{
  const {error}=await context.supabase.from("farmer_guide_preferences").upsert({user_id:context.userId,recall_enabled:data.enabled});
  if(error) throw new Error("无法保存设置 / Could not save preference");
  return {ok:true};
});
export const saveFarmerGoal = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({
  id:z.string().uuid().optional(),title:z.string().trim().min(1).max(200),metric:z.enum(["margin","cost_per_kg","custom","expected_profit"]),target:z.number().finite(),
  dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),crop:z.string().nullable(),measurement:z.string().trim().max(500),currentValue:z.number().finite().nullable(),status:z.enum(["active","paused"]),
}).superRefine((data,ctx)=>{
  if(data.metric==="margin" && (data.target < -100 || data.target > 100)) ctx.addIssue({code:"custom",message:"毛利率目标应为-100至100 / Margin target must be -100 to 100"});
  if(data.metric==="cost_per_kg" && data.target<0) ctx.addIssue({code:"custom",message:"成本不能为负 / Cost cannot be negative"});
  if(data.metric==="custom" && !data.measurement) ctx.addIssue({code:"custom",message:"请填写衡量方式 / Add a measurement"});
  if(data.crop && !VEGETABLES.some(crop => crop === data.crop)) ctx.addIssue({code:"custom",message:"请选择标准作物 / Choose a standard crop"});
  if(Number.isNaN(Date.parse(data.dueDate+"T00:00:00Z")) || new Date(data.dueDate+"T00:00:00Z").toISOString().slice(0,10)!==data.dueDate) ctx.addIssue({code:"custom",message:"日期无效 / Invalid date"});
})).handler(async ({context,data})=>{
  const {isManagement}=await import("./workspace-access.server");
  if(data.metric!=="custom" && !await isManagement(context.supabase,context.userId)) throw new Error("Management access required");
  const {readFarmerRecords}=await import("./farmer-assistant.server");
  const {data:preferences,error:settingsError}=await context.supabase.from("user_settings").select("*").eq("user_id",context.userId).maybeSingle();
  if(settingsError) throw new Error("Could not read settings");
  const settings=normalizeSettings(preferences ? {language:preferences.language as Lang,currency:preferences.currency as Currency,timeZone:preferences.time_zone} : {});
  const today = dateKey(new Date(),settings.timeZone);
  const rows=await readFarmerRecords(context.supabase,context.userId);
  const cutoff=new Date(Date.parse(today+"T00:00:00Z")-30*86400000).toISOString().slice(0,10);
  const baseline=metricValue(currencyRows(rows,settings.currency).filter(r=>r.harvest_date>=cutoff && r.harvest_date<today),data.metric,data.crop);
  const values={title:data.title,metric:data.metric,target:data.target,due_date:data.dueDate,crop:data.crop,measurement:data.measurement,current_value:data.metric==="custom"?data.currentValue:null,status:data.status};
  if(data.id){
    const {data:old,error}=await context.supabase.from("farmer_goals").select("metric,crop").eq("id",data.id).eq("user_id",context.userId).single();
    if(error || !old) throw new Error("目标不存在 / Goal unavailable");
    if(old.metric!==data.metric || old.crop!==data.crop) throw new Error("请为新的衡量方式另建目标 / Create a new goal for a different metric or crop");
  }
  const q=data.id?context.supabase.from("farmer_goals").update(values).eq("id",data.id).eq("user_id",context.userId):context.supabase.from("farmer_goals").insert({...values,user_id:context.userId,baseline:data.metric==="custom"?data.currentValue:baseline,baseline_date:today,currency:settings.currency});
  const {error}=await q.select("id").single();
  if(error) throw new Error("无法保存目标 / Could not save goal");
  return {ok:true};
});
export const deleteFarmerGoal = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({context,data})=>{
  const {error}=await context.supabase.from("farmer_goals").delete().eq("id",data.id).eq("user_id",context.userId).select("id").single();
  if(error) throw new Error("无法删除目标 / Could not delete goal");
  return {ok:true};
});
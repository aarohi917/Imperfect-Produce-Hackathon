import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
export type OperationalHarvest = {id:string;farmer_id:string;photo_path:string|null;vegetable:string;quantity:number;unit:string;destination:string;status:"pending"|"approved"|"rejected";created_at:string;field_name:string|null;grade:string;harvest_date:string;reviewed_at:string|null};
export const loadOperations = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async({context}) => {
  const {data,error} = await context.supabase.rpc("operational_harvests");
  if(error) throw new Error("Could not read operational harvests");
  return (Array.isArray(data) ? data : []) as unknown as OperationalHarvest[];
});
export const submitOperationalHarvest = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({vegetable:z.string(),quantity:z.number().positive().max(100000),destination:z.enum(["market","factory"]),grade:z.enum(["A","B","C"]),field_name:z.string().nullable(),harvest_date:z.string(),photo_path:z.string().nullable(),notes:z.string().nullable(),ai_summary:z.string().nullable()}).strict()).handler(async({context,data})=>{
  const {error}=await context.supabase.rpc("submit_operational_harvest",{p_record:data});
  if(error) throw new Error("Could not submit harvest");
  return {ok:true};
});
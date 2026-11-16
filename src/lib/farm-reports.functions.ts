import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const loadFarmReports=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const {isManagement}=await import("./workspace-access.server");
  if(!await isManagement(context.supabase,context.userId)) return [];
  const {data,error}=await context.supabase.from("farm_reports").select("*").order("period_start",{ascending:false}).limit(52);
  if(error) throw new Error("Could not read farm reports");
  return data;
});
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export async function readFarmerRecords(supabase: SupabaseClient<Database>, userId: string) {
  const {isManagement}=await import("./workspace-access.server");
  if(!await isManagement(supabase,userId)){
    const {data,error}=await supabase.rpc("operational_harvests");
    if(error) throw new Error("Could not read operational harvests");
    return ((Array.isArray(data)?data:[]) as unknown as Database["public"]["Tables"]["harvests"]["Row"][]).filter(r=>r.farmer_id===userId).map(r=>({...r,expected_revenue:0,cost:0,currency:"CNY",notes:null,review_note:null}));
  }
  const rows: Database["public"]["Tables"]["harvests"]["Row"][] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("harvests").select("*").eq("report_type", "harvest").eq("farmer_id", userId).order("harvest_date", { ascending: false }).order("id").range(offset,offset+499);
    if (error) throw new Error("无法读取采收记录 / Could not read harvest records");
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export async function readFarmerAssistant(supabase: SupabaseClient<Database>, userId: string) {
  const [memory, goals, preferences] = await Promise.all([
    supabase.from("farmer_memories").select("*").eq("user_id",userId).order("created_at",{ascending:false}),
    supabase.from("farmer_goals").select("*").eq("user_id",userId).order("created_at",{ascending:false}),
    supabase.from("farmer_guide_preferences").select("recall_enabled").eq("user_id",userId).maybeSingle(),
  ]);
  if (memory.error || goals.error || preferences.error) throw new Error("无法读取私人记忆与目标 / Could not read private memory and goals");
  return { memories: memory.data, goals: goals.data, recallEnabled: preferences.data?.recall_enabled ?? true };
}